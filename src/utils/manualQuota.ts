import type { ProviderQuota, QuotaLimit } from '../providers/types';
import { getQuotaStatus, getRecommendation, getWorstStatus } from './quotaStatus';

export interface ManualLimitDraft {
  id: string;
  remainingPercent: string;
  balanceText: string;
  resetAtText: string;
}

export function createManualLimitDrafts(quota: ProviderQuota): ManualLimitDraft[] {
  return quota.limits.map((limit) => ({
    id: limit.id,
    remainingPercent:
      typeof limit.remainingPercent === 'number' ? String(limit.remainingPercent) : '',
    balanceText: limit.balanceText ?? '',
    resetAtText: limit.resetAtText ?? '',
  }));
}

export function applyManualQuotaUpdate(
  quota: ProviderQuota,
  drafts: ManualLimitDraft[],
  now = new Date(),
): ProviderQuota {
  const draftById = new Map(drafts.map((draft) => [draft.id, draft]));
  const limits = quota.limits.map((limit) => applyManualLimitUpdate(limit, draftById.get(limit.id)));
  const status = getWorstStatus(limits);

  return {
    ...quota,
    limits,
    recommendation: getRecommendation(status),
    updatedAt: now.toISOString(),
    source: 'manual',
  };
}

function applyManualLimitUpdate(limit: QuotaLimit, draft?: ManualLimitDraft): QuotaLimit {
  if (!draft) {
    return limit;
  }

  const remainingPercent = parsePercentDraft(draft.remainingPercent);
  const balanceText = normalizeOptionalText(draft.balanceText);
  const resetAtText = normalizeOptionalText(draft.resetAtText);

  return {
    ...limit,
    remainingPercent,
    balanceText,
    resetAtText,
    status: getQuotaStatus(remainingPercent),
  };
}

function parsePercentDraft(value: string): number | undefined {
  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);

  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return Math.min(100, Math.max(0, Math.round(parsed)));
}

function normalizeOptionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}
