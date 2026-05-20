import type { QuotaProviderAdapter, QuotaSnapshot } from './types';

const snapshot: QuotaSnapshot = {
  id: 'qwen',
  name: 'Qwen',
  usedPercent: 72,
  remainingPercent: 28,
  remainingLabel: '28% remaining',
  resetLabel: 'in 6h',
  suggestion: 'Use for shorter prompts',
  accentColor: '#7c3aed',
  updatedAt: new Date().toISOString(),
};

export const qwenProvider: QuotaProviderAdapter = {
  id: 'qwen',
  name: 'Qwen',
  async getQuotaSnapshot() {
    return snapshot;
  },
};
