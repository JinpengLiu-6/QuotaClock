export type ProviderId = 'codex' | 'claude' | 'deepseek' | 'qwen';

export interface QuotaSnapshot {
  id: ProviderId;
  name: string;
  usedPercent: number;
  remainingPercent: number;
  remainingLabel: string;
  resetLabel: string;
  suggestion: string;
  accentColor: string;
  updatedAt: string;
}

export interface QuotaProviderAdapter {
  id: ProviderId;
  name: string;
  getQuotaSnapshot(): Promise<QuotaSnapshot>;
}
