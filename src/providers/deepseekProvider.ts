import type { ProviderQuota, QuotaProviderAdapter } from './types';

export const deepseekMockQuota: ProviderQuota = {
  providerId: 'deepseek',
  providerName: 'DeepSeek',
  limits: [
    {
      id: 'deepseek-credits',
      label: 'Credits',
      kind: 'credits',
      balanceText: '¥32.8',
      resetAtText: 'Unknown',
      status: 'good',
    },
  ],
  recommendation: 'Large task OK',
  updatedAt: new Date().toISOString(),
  source: 'mock',
};

export const deepseekProvider: QuotaProviderAdapter = {
  id: 'deepseek',
  name: 'DeepSeek',
  async getQuota() {
    return deepseekMockQuota;
  },
};
