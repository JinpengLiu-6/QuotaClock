import type { HudPosition, ParsedCodexQuota, ProviderQuota, ProviderStatus } from '../providers/types';

const QUOTA_STORAGE_KEY = 'quotaClock.providerQuotas';
const HUD_POSITION_KEY = 'quotaClock.hudPosition';

type StoredProviderQuotas = Record<string, ProviderQuota>;

export function createUnknownCodexQuota(): ProviderQuota {
  return {
    providerId: 'codex',
    providerName: 'Codex',
    limits: [
      {
        id: 'codex-5h',
        label: '5h',
        kind: 'percentage',
        status: 'unknown',
        resetAtText: 'Unknown',
      },
      {
        id: 'codex-weekly',
        label: 'Weekly',
        kind: 'percentage',
        status: 'unknown',
        resetAtText: 'Unknown',
      },
    ],
    recommendation: getRecommendation('unknown'),
    updatedAt: new Date().toISOString(),
    source: 'dom',
  };
}

export function codexQuotaFromParsed(parsed: ParsedCodexQuota): ProviderQuota {
  const limits = parsed.limits.map((limit) => {
    const status = getQuotaStatus(limit.remainingPercent);

    return {
      id: `codex-${limit.type}`,
      label: limit.type === 'weekly' ? 'Weekly' : '5h',
      kind: 'percentage' as const,
      remainingPercent: limit.remainingPercent,
      resetAtText: limit.resetAtText,
      status,
    };
  });

  return {
    providerId: parsed.providerId,
    providerName: 'Codex',
    limits,
    recommendation: getRecommendation(getQuotaStatus(getPrimaryPercent(limits))),
    updatedAt: parsed.updatedAt,
    source: 'dom',
  };
}

export async function loadProviderQuota(providerId: string): Promise<ProviderQuota | null> {
  const quotas = await loadProviderQuotas();
  return quotas[providerId] ?? null;
}

export async function saveProviderQuota(quota: ProviderQuota): Promise<void> {
  if (!globalThis.chrome?.storage?.local) {
    return;
  }

  const quotas = await loadProviderQuotas();
  await chrome.storage.local.set({
    [QUOTA_STORAGE_KEY]: {
      ...quotas,
      [quota.providerId]: quota,
    },
  });
}

export async function loadHudPosition(): Promise<HudPosition | null> {
  if (!globalThis.chrome?.storage?.local) {
    return null;
  }

  const result = await chrome.storage.local.get(HUD_POSITION_KEY);
  return (result[HUD_POSITION_KEY] as HudPosition | undefined) ?? null;
}

export async function saveHudPosition(position: HudPosition): Promise<void> {
  if (!globalThis.chrome?.storage?.local) {
    return;
  }

  await chrome.storage.local.set({ [HUD_POSITION_KEY]: position });
}

function getQuotaStatus(remainingPercent?: number): ProviderStatus {
  if (typeof remainingPercent !== 'number' || Number.isNaN(remainingPercent)) {
    return 'unknown';
  }

  if (remainingPercent >= 70) {
    return 'good';
  }

  if (remainingPercent >= 40) {
    return 'caution';
  }

  if (remainingPercent >= 15) {
    return 'critical';
  }

  return 'blocked';
}

function getRecommendation(status: ProviderStatus): string {
  const recommendations: Record<ProviderStatus, string> = {
    good: 'Large task OK',
    caution: 'Medium tasks recommended',
    critical: 'Small tasks only',
    blocked: 'Wait reset or switch model',
    unknown: 'Open provider page to refresh quota',
  };

  return recommendations[status];
}

export function getPrimaryPercent(limits: ProviderQuota['limits']): number | undefined {
  const percentages = limits
    .map((limit) => limit.remainingPercent)
    .filter((value): value is number => typeof value === 'number');

  return percentages.length > 0 ? Math.min(...percentages) : undefined;
}

async function loadProviderQuotas(): Promise<StoredProviderQuotas> {
  if (!globalThis.chrome?.storage?.local) {
    return {};
  }

  const result = await chrome.storage.local.get(QUOTA_STORAGE_KEY);
  return (result[QUOTA_STORAGE_KEY] as StoredProviderQuotas | undefined) ?? {};
}
