import type { ProviderQuota, ProviderStatus, QuotaLimit } from './types';
import { getPrimaryPercent, getQuotaStatus, getRecommendation } from '../utils/quotaStatus';

interface MockLimitInput {
  id: string;
  label: string;
  kind: QuotaLimit['kind'];
  remainingPercent?: number;
  balanceText?: string;
  resetAtText?: string;
  status?: ProviderStatus;
}

interface MockProviderInput {
  providerId: string;
  providerName: string;
  limits: MockLimitInput[];
}

const mockProviders: MockProviderInput[] = [
  {
    providerId: 'codex',
    providerName: 'Codex',
    limits: [
      {
        id: 'codex-5h',
        label: '5h',
        kind: 'percentage',
        remainingPercent: 99,
        resetAtText: '4:00 PM',
      },
      {
        id: 'codex-weekly',
        label: 'Weekly',
        kind: 'percentage',
        remainingPercent: 100,
        resetAtText: 'May 27',
      },
    ],
  },
  {
    providerId: 'claude',
    providerName: 'Claude',
    limits: [
      {
        id: 'claude-weekly',
        label: 'Weekly',
        kind: 'percentage',
        remainingPercent: 72,
        resetAtText: 'May 27',
      },
    ],
  },
  {
    providerId: 'deepseek',
    providerName: 'DeepSeek',
    limits: [
      {
        id: 'deepseek-credits',
        label: 'Credits',
        kind: 'credits',
        remainingPercent: 82,
        balanceText: '¥32.8',
        resetAtText: 'Manual',
      },
    ],
  },
  {
    providerId: 'qwen',
    providerName: 'Qwen',
    limits: [
      {
        id: 'qwen-rate',
        label: 'RPM/TPM',
        kind: 'rate',
        remainingPercent: 46,
        resetAtText: 'Rolling',
      },
    ],
  },
];

export function getMockProviderQuotas(now = new Date()): ProviderQuota[] {
  return mockProviders.map((provider) => {
    const limits = provider.limits.map(toQuotaLimit);
    const status = getQuotaStatus(getPrimaryPercent(limits));

    return {
      providerId: provider.providerId,
      providerName: provider.providerName,
      limits,
      recommendation: getRecommendation(status),
      updatedAt: now.toISOString(),
      source: 'mock',
    };
  });
}

function toQuotaLimit(limit: MockLimitInput): QuotaLimit {
  return {
    id: limit.id,
    label: limit.label,
    kind: limit.kind,
    remainingPercent: limit.remainingPercent,
    balanceText: limit.balanceText,
    resetAtText: limit.resetAtText,
    status: limit.status ?? getQuotaStatus(limit.remainingPercent),
  };
}
