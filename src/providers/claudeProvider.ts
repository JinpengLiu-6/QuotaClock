import type { ProviderQuota, QuotaProviderAdapter } from './types';

export const claudeMockQuota: ProviderQuota = {
  providerId: 'claude',
  providerName: 'Claude',
  limits: [
    {
      id: 'claude-weekly',
      label: 'Weekly',
      kind: 'percentage',
      remainingPercent: 72,
      resetAtText: 'May 27',
      status: 'good',
    },
  ],
  recommendation: 'Large task OK',
  updatedAt: new Date().toISOString(),
  source: 'mock',
};

export const claudeProvider: QuotaProviderAdapter = {
  id: 'claude',
  name: 'Claude',
  async getQuota() {
    return claudeMockQuota;
  },
};
