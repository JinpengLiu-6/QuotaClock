import type { ParsedCodexQuota, ProviderQuota, QuotaProviderAdapter } from './types';
import { getPrimaryPercent, getQuotaStatus, getRecommendation } from '../utils/quotaStatus';

export function createUnknownCodexQuota(): ProviderQuota {
  return {
    providerId: 'codex',
    providerName: 'Codex',
    limits: [
      {
        id: 'codex-5h',
        label: '5h',
        kind: 'percentage',
        status: 'unknown',
        resetAtText: 'Unknown',
      },
      {
        id: 'codex-weekly',
        label: 'Weekly',
        kind: 'percentage',
        status: 'unknown',
        resetAtText: 'Unknown',
      },
    ],
    recommendation: getRecommendation('unknown'),
    updatedAt: new Date().toISOString(),
    source: 'dom',
  };
}

export function codexQuotaFromParsed(parsed: ParsedCodexQuota): ProviderQuota {
  const limits = parsed.limits.map((limit) => {
    const status = getQuotaStatus(limit.remainingPercent);

    return {
      id: `codex-${limit.type}`,
      label: limit.type === 'weekly' ? 'Weekly' : '5h',
      kind: 'percentage' as const,
      remainingPercent: limit.remainingPercent,
      resetAtText: limit.resetAtText,
      status,
    };
  });
  const primaryStatus = getQuotaStatus(getPrimaryPercent(limits));

  return {
    providerId: parsed.providerId,
    providerName: 'Codex',
    limits,
    recommendation: getRecommendation(primaryStatus),
    updatedAt: parsed.updatedAt,
    source: 'dom',
  };
}

export const codexProvider: QuotaProviderAdapter = {
  id: 'codex',
  name: 'Codex',
  async getQuota() {
    return createUnknownCodexQuota();
  },
};
