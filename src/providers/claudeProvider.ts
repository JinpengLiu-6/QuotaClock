import type { QuotaProviderAdapter, QuotaSnapshot } from './types';

const snapshot: QuotaSnapshot = {
  id: 'claude',
  name: 'Claude',
  usedPercent: 58,
  remainingPercent: 42,
  remainingLabel: '42% remaining',
  resetLabel: 'tonight',
  suggestion: 'Save for longer reads',
  accentColor: '#d97706',
  updatedAt: new Date().toISOString(),
};

export const claudeProvider: QuotaProviderAdapter = {
  id: 'claude',
  name: 'Claude',
  async getQuotaSnapshot() {
    return snapshot;
  },
};
