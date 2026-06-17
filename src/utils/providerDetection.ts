export type SupportedProviderId = 'codex' | 'claude' | 'deepseek' | 'qwen';

export interface ProviderPageInfo {
  providerId: SupportedProviderId;
  providerName: string;
  supportsDomScan: boolean;
}

const providerPages: Array<ProviderPageInfo & { patterns: RegExp[] }> = [
  {
    providerId: 'codex',
    providerName: 'Codex',
    supportsDomScan: true,
    patterns: [/^https:\/\/chatgpt\.com(?:\/|$)/i, /^https:\/\/chat\.openai\.com(?:\/|$)/i],
  },
  {
    providerId: 'claude',
    providerName: 'Claude',
    supportsDomScan: false,
    patterns: [/^https:\/\/claude\.ai(?:\/|$)/i],
  },
  {
    providerId: 'deepseek',
    providerName: 'DeepSeek',
    supportsDomScan: false,
    patterns: [/^https:\/\/www\.deepseek\.com(?:\/|$)/i],
  },
  {
    providerId: 'qwen',
    providerName: 'Qwen',
    supportsDomScan: false,
    patterns: [/^https:\/\/chat\.qwen\.ai(?:\/|$)/i],
  },
];

export function detectProviderPage(url?: string): ProviderPageInfo | null {
  if (!url) {
    return null;
  }

  return (
    providerPages.find((provider) => provider.patterns.some((pattern) => pattern.test(url))) ?? null
  );
}

export function isSupportedProviderPage(url?: string): boolean {
  return Boolean(detectProviderPage(url));
}
