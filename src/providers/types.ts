export type ProviderStatus = 'good' | 'caution' | 'critical' | 'blocked' | 'unknown';

export type QuotaKind = 'percentage' | 'credits' | 'tokens' | 'rate' | 'status';

export type QuotaSource = 'dom' | 'api' | 'manual' | 'mock';

export interface QuotaLimit {
  id: string;
  label: string;
  kind: QuotaKind;
  remainingPercent?: number;
  balanceText?: string;
  resetAtText?: string;
  status: ProviderStatus;
}

export interface ProviderQuota {
  providerId: string;
  providerName: string;
  limits: QuotaLimit[];
  recommendation: string;
  updatedAt: string;
  source: QuotaSource;
}

export interface QuotaProviderAdapter {
  id: string;
  name: string;
  getQuota(): Promise<ProviderQuota>;
}

export interface ParsedCodexQuota {
  providerId: 'codex';
  limits: Array<{
    type: '5h' | 'weekly';
    remainingPercent: number;
    resetAtText: string;
  }>;
  updatedAt: string;
}

export interface RefreshQuotaResponse {
  ok: boolean;
  quota?: ProviderQuota;
  error?: string;
}

export interface HudPosition {
  x: number;
  y: number;
}
