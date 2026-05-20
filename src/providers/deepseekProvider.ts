import type { QuotaProviderAdapter, QuotaSnapshot } from './types';

const snapshot: QuotaSnapshot = {
  id: 'deepseek',
  name: 'DeepSeek',
  usedPercent: 21,
  remainingPercent: 79,
  remainingLabel: '79% remaining',
  resetLabel: 'tomorrow',
  suggestion: 'Plenty left for research',
  accentColor: '#059669',
  updatedAt: new Date().toISOString(),
};

export const deepseekProvider: QuotaProviderAdapter = {
  id: 'deepseek',
  name: 'DeepSeek',
  async getQuotaSnapshot() {
    return snapshot;
  },
};
