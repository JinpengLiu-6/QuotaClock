import type { ProviderQuota, ProviderStatus, QuotaLimit } from '../providers/types';

export function getQuotaStatus(remainingPercent?: number): ProviderStatus {
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

export function getRecommendation(status: ProviderStatus): string {
  const recommendations: Record<ProviderStatus, string> = {
    good: 'Large task OK',
    caution: 'Medium tasks recommended',
    critical: 'Small tasks only',
    blocked: 'Wait reset or switch model',
    unknown: 'Open provider page to refresh quota',
  };

  return recommendations[status];
}

export function getWorstStatus(limits: QuotaLimit[]): ProviderStatus {
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

export function getPrimaryPercent(limits: QuotaLimit[]): number | undefined {
  const percentages = limits
    .map((limit) => limit.remainingPercent)
    .filter((value): value is number => typeof value === 'number');

  if (percentages.length === 0) {
    return undefined;
  }

  return Math.min(...percentages);
}

export function formatStatus(status: ProviderStatus): string {
  const labels: Record<ProviderStatus, string> = {
    good: 'Good',
    caution: 'Caution',
    critical: 'Critical',
    blocked: 'Blocked',
    unknown: 'Unknown',
  };

  return labels[status];
}

export function getRecommendedProvider(quotas: ProviderQuota[]): ProviderQuota | null {
  const preferredStatuses: ProviderStatus[] = [
    'good',
    'caution',
    'critical',
    'blocked',
    'unknown',
  ];

  for (const status of preferredStatuses) {
    const quota = quotas.find((provider) => getWorstStatus(provider.limits) === status);
    if (quota) {
      return quota;
    }
  }

  return null;
}
