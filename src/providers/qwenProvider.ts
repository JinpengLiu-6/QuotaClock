import type { ProviderQuota, QuotaProviderAdapter } from './types';

export const qwenMockQuota: ProviderQuota = {
  providerId: 'qwen',
  providerName: 'Qwen',
  limits: [
    {
      id: 'qwen-rate',
      label: 'RPM/TPM',
      kind: 'rate',
      remainingPercent: 46,
      resetAtText: 'Rolling',
      status: 'caution',
    },
  ],
  recommendation: 'Medium tasks recommended',
  updatedAt: new Date().toISOString(),
  source: 'mock',
};

export const qwenProvider: QuotaProviderAdapter = {
  id: 'qwen',
  name: 'Qwen',
  async getQuota() {
    return qwenMockQuota;
  },
};
