import { claudeMockQuota, claudeProvider } from './claudeProvider';
import { codexProvider, createUnknownCodexQuota } from './codexProvider';
import { deepseekMockQuota, deepseekProvider } from './deepseekProvider';
import { qwenMockQuota, qwenProvider } from './qwenProvider';
import type { ProviderQuota, QuotaProviderAdapter } from './types';

export const quotaProviders: QuotaProviderAdapter[] = [
  codexProvider,
  claudeProvider,
  deepseekProvider,
  qwenProvider,
];

export function getDefaultProviderQuotas(): ProviderQuota[] {
  return [
    createUnknownCodexQuota(),
    claudeMockQuota,
    deepseekMockQuota,
    qwenMockQuota,
  ];
}
