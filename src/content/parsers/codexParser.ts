import type { ProviderQuota, ProviderStatus, QuotaLimit } from '../../providers/types';

type CodexLimitType = '5h' | 'weekly';

const RATE_LIMITS_PATTERN = /rate\s+limits\s+remaining/i;
const FIVE_HOUR_PATTERN = /\b5\s*(?:h|hours?)\b/i;
const WEEKLY_PATTERN = /\bweekly\b/i;

interface ParsedLimit {
  type: CodexLimitType;
  remainingPercent: number;
  resetAtText: string;
}

export function parseCodexQuotaFromText(text: string): ProviderQuota | null {
  try {
    const candidateText = extractQuotaCandidateText(text);
    const parsedCandidate = parseNormalizedQuotaText(normalizeQuotaText(candidateText));

    if (parsedCandidate || candidateText === text) {
      return parsedCandidate;
    }

    return parseNormalizedQuotaText(normalizeQuotaText(text));
  } catch {
    return null;
  }
}

export function parseCodexQuotaFromDocument(doc: Document = document): ProviderQuota | null {
  return parseCodexQuotaFromText(doc.body?.innerText ?? '');
}

export const parseCodexQuotaText = parseCodexQuotaFromText;

export function extractQuotaCandidateText(text: string): string {
  const candidatePatterns = [RATE_LIMITS_PATTERN, FIVE_HOUR_PATTERN, WEEKLY_PATTERN];

  for (const pattern of candidatePatterns) {
    const match = text.match(pattern);

    if (match && typeof match.index === 'number') {
      return sliceAroundIndex(text, match.index, 1200);
    }
  }

  return text.slice(Math.max(0, text.length - 2000));
}

function normalizeQuotaText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function parseNormalizedQuotaText(normalizedText: string): ProviderQuota | null {
  if (!normalizedText.includes('%') || !hasCodexLimitLabels(normalizedText)) {
    return null;
  }

  const fiveHourLimit = parseLimit(normalizedText, '5h');
  const weeklyLimit = parseLimit(normalizedText, 'weekly');
  const parsedLimits = [fiveHourLimit, weeklyLimit].filter(
    (limit): limit is ParsedLimit => Boolean(limit),
  );

  if (parsedLimits.length === 0) {
    return null;
  }

  const limits = parsedLimits.map(toQuotaLimit);
  const worstStatus = getWorstStatus(limits);

  return {
    providerId: 'codex',
    providerName: 'Codex',
    limits,
    recommendation: getRecommendation(worstStatus),
    updatedAt: new Date().toISOString(),
    source: 'dom',
  };
}

function hasCodexLimitLabels(text: string): boolean {
  return FIVE_HOUR_PATTERN.test(text) || WEEKLY_PATTERN.test(text);
}

function parseLimit(text: string, type: CodexLimitType): ParsedLimit | null {
  const segment = getLimitSegment(text, type);
  const percentMatch = segment?.match(/(\d{1,3})\s*%/);

  if (!segment || !percentMatch) {
    return null;
  }

  const resetCandidate = segment.slice((percentMatch.index ?? 0) + percentMatch[0].length);

  return {
    type,
    remainingPercent: clampPercent(Number(percentMatch[1])),
    resetAtText: extractResetText(resetCandidate, type),
  };
}

function getLimitSegment(text: string, type: CodexLimitType): string | null {
  const labelPattern = getLimitLabelPattern(type);
  const labelMatch = text.match(labelPattern);

  if (!labelMatch || typeof labelMatch.index !== 'number') {
    return null;
  }

  const segmentStart = labelMatch.index;
  const remainingText = text.slice(segmentStart + labelMatch[0].length);
  const nextLabelPattern = type === '5h' ? WEEKLY_PATTERN : FIVE_HOUR_PATTERN;
  const nextLabelMatch = remainingText.match(nextLabelPattern);
  const segmentEnd =
    nextLabelMatch && typeof nextLabelMatch.index === 'number'
      ? segmentStart + labelMatch[0].length + nextLabelMatch.index
      : text.length;

  return text.slice(segmentStart, segmentEnd);
}

function getLimitLabelPattern(type: CodexLimitType): RegExp {
  return type === 'weekly' ? WEEKLY_PATTERN : FIVE_HOUR_PATTERN;
}

function extractResetText(textAfterPercent: string, type: CodexLimitType): string {
  const resetPatterns =
    type === 'weekly'
      ? [/\b([A-Z][a-z]{2,9}\s+\d{1,2})\b/i, /\b(\d{1,2}:\d{2}\s*(?:AM|PM)?)\b/i, /\b(Unknown)\b/i]
      : [/\b(\d{1,2}:\d{2}\s*(?:AM|PM)?)\b/i, /\b(Unknown)\b/i];

  for (const pattern of resetPatterns) {
    const match = textAfterPercent.match(pattern);

    if (match) {
      return normalizeResetText(match[1]);
    }
  }

  return 'Unknown';
}

function normalizeResetText(resetText: string): string {
  return resetText.replace(/\s+/g, ' ').trim();
}

function toQuotaLimit(limit: ParsedLimit): QuotaLimit {
  return {
    id: `codex-${limit.type}`,
    label: limit.type === 'weekly' ? 'Weekly' : '5h',
    kind: 'percentage',
    remainingPercent: limit.remainingPercent,
    resetAtText: limit.resetAtText,
    status: getQuotaStatus(limit.remainingPercent),
  };
}

function getQuotaStatus(remainingPercent?: number): ProviderStatus {
  if (typeof remainingPercent !== 'number' || Number.isNaN(remainingPercent)) {
    return 'unknown';
  }

  if (remainingPercent >= 70) {
    return 'good';
  }

  if (remainingPercent >= 40) {
    return 'caution';
  }

  if (remainingPercent >= 15) {
    return 'critical';
  }

  return 'blocked';
}

function getWorstStatus(limits: QuotaLimit[]): ProviderStatus {
  const rank: Record<ProviderStatus, number> = {
    blocked: 0,
    critical: 1,
    caution: 2,
    good: 3,
    unknown: 4,
  };

  return limits.reduce<ProviderStatus>((worst, limit) => {
    return rank[limit.status] < rank[worst] ? limit.status : worst;
  }, 'unknown');
}

function getRecommendation(status: ProviderStatus): string {
  const recommendations: Record<ProviderStatus, string> = {
    good: 'Large task OK',
    caution: 'Medium tasks recommended',
    critical: 'Small tasks only',
    blocked: 'Wait reset or switch model',
    unknown: 'Open provider page to refresh quota',
  };

  return recommendations[status];
}

function clampPercent(percent: number): number {
  return Math.min(Math.max(percent, 0), 100);
}

function sliceAroundIndex(text: string, index: number, radius: number): string {
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + radius);
  return text.slice(start, end);
}
