import type { ProviderQuota, ProviderStatus, QuotaLimit } from '../../providers/types';

type CodexLimitType = '5h' | 'weekly';

interface ParsedLimit {
  type: CodexLimitType;
  remainingPercent: number;
  resetAtText: string;
}

export function parseCodexQuotaFromText(text: string): ProviderQuota | null {
  try {
    const normalizedText = normalizeQuotaText(text);

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
  } catch {
    return null;
  }
}

export function parseCodexQuotaFromDocument(doc: Document = document): ProviderQuota | null {
  return parseCodexQuotaFromText(doc.body?.innerText ?? '');
}

export const parseCodexQuotaText = parseCodexQuotaFromText;

function normalizeQuotaText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function hasCodexLimitLabels(text: string): boolean {
  return /\b5h\b/i.test(text) || /\bWeekly\b/i.test(text);
}

function parseLimit(text: string, type: CodexLimitType): ParsedLimit | null {
  const label = type === 'weekly' ? 'Weekly' : '5h';
  const resetPattern =
    type === 'weekly'
      ? '([A-Z][a-z]{2,9}\\s+\\d{1,2}|\\d{1,2}:\\d{2}(?:\\s*[AP]M)?|Unknown)'
      : '(\\d{1,2}:\\d{2}(?:\\s*[AP]M)?|Unknown)';
  const pattern = new RegExp(`\\b${label}\\b\\s+(\\d{1,3})\\s*%\\s+${resetPattern}`, 'i');
  const match = text.match(pattern);

  if (!match) {
    return null;
  }

  return {
    type,
    remainingPercent: clampPercent(Number(match[1])),
    resetAtText: match[2].trim(),
  };
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
