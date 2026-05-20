import type { QuotaProviderAdapter, QuotaSnapshot } from './types';

const snapshot: QuotaSnapshot = {
  id: 'codex',
  name: 'Codex',
  usedPercent: 36,
  remainingPercent: 64,
  remainingLabel: '64% remaining',
  resetLabel: 'in 3h 20m',
  suggestion: 'Good window for coding tasks',
  accentColor: '#3b82f6',
  updatedAt: new Date().toISOString(),
};

export const codexProvider: QuotaProviderAdapter = {
  id: 'codex',
  name: 'Codex',
  async getQuotaSnapshot() {
    return snapshot;
  },
};
