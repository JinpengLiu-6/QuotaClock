import { claudeProvider } from './claudeProvider';
import { codexProvider } from './codexProvider';
import { deepseekProvider } from './deepseekProvider';
import { qwenProvider } from './qwenProvider';
import type { ProviderQuota, QuotaProviderAdapter } from './types';
import { getMockProviderQuotas } from './mockQuotas';

export const quotaProviders: QuotaProviderAdapter[] = [
  codexProvider,
  claudeProvider,
  deepseekProvider,
  qwenProvider,
];

export function getDefaultProviderQuotas(): ProviderQuota[] {
  return getMockProviderQuotas();
}

export { getMockProviderQuotas };
