import type { ParsedCodexQuota } from '../../providers/types';

const PANEL_KEYWORDS = ['Rate limits remaining', '5h', 'Weekly', '%'];

export function parseCodexQuotaText(text: string): ParsedCodexQuota | null {
  try {
    if (!hasQuotaKeywords(text)) {
      return null;
    }

    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const fiveHourLimit = findLimitLine(lines, '5h');
    const weeklyLimit = findLimitLine(lines, 'Weekly');

    if (!fiveHourLimit && !weeklyLimit) {
      return null;
    }

    return {
      providerId: 'codex',
      limits: [fiveHourLimit, weeklyLimit].filter(
        (limit): limit is ParsedCodexQuota['limits'][number] => Boolean(limit),
      ),
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function parseCodexQuotaFromDocument(doc: Document = document): ParsedCodexQuota | null {
  return parseCodexQuotaText(doc.body?.innerText ?? '');
}

function hasQuotaKeywords(text: string): boolean {
  return PANEL_KEYWORDS.every((keyword) => text.includes(keyword));
}

function findLimitLine(
  lines: string[],
  label: '5h' | 'Weekly',
): ParsedCodexQuota['limits'][number] | null {
  const line = lines.find((candidate) => {
    const normalized = candidate.toLowerCase();
    return normalized.includes(label.toLowerCase()) && normalized.includes('%');
  });

  if (!line) {
    return null;
  }

  const percentMatch = line.match(/(\d{1,3})\s*%/);
  if (!percentMatch) {
    return null;
  }

  const remainingPercent = clampPercent(Number(percentMatch[1]));
  const resetAtText = extractResetText(line, label, percentMatch[0]);

  return {
    type: label === 'Weekly' ? 'weekly' : '5h',
    remainingPercent,
    resetAtText: resetAtText || 'Unknown',
  };
}

function clampPercent(percent: number): number {
  return Math.min(Math.max(percent, 0), 100);
}

function extractResetText(line: string, label: string, percentText: string): string {
  const percentEnd = line.indexOf(percentText) + percentText.length;
  const afterPercent = line.slice(percentEnd).trim();

  if (afterPercent) {
    return afterPercent;
  }

  return line.replace(label, '').replace(percentText, '').trim();
}
