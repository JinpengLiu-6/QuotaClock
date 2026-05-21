import type { HudPosition, ProviderQuota, ProviderStatus } from '../providers/types';

const HUD_POSITION_KEY = 'hud:position';
const LEGACY_HUD_POSITION_KEY = 'quotaClock.hudPosition';
const QUOTA_KEY_PREFIX = 'quota:';

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

export async function loadProviderQuota(providerId: string): Promise<ProviderQuota | null> {
  if (!globalThis.chrome?.storage?.local) {
    return null;
  }

  try {
    const result = await chrome.storage.local.get(getQuotaStorageKey(providerId));
    const quota = result[getQuotaStorageKey(providerId)];
    return isProviderQuota(quota) ? quota : null;
  } catch {
    return null;
  }
}

export async function saveProviderQuota(quota: ProviderQuota): Promise<void> {
  if (!globalThis.chrome?.storage?.local) {
    return;
  }

  try {
    await chrome.storage.local.set({
      [getQuotaStorageKey(quota.providerId)]: quota,
    });
  } catch {
    return;
  }
}

export async function loadHudPosition(): Promise<HudPosition | null> {
  if (!globalThis.chrome?.storage?.local) {
    return null;
  }

  try {
    const result = await chrome.storage.local.get([HUD_POSITION_KEY, LEGACY_HUD_POSITION_KEY]);
    const savedPosition = result[HUD_POSITION_KEY];
    const legacyPosition = result[LEGACY_HUD_POSITION_KEY] as { x?: number; y?: number } | undefined;

    if (isHudPosition(savedPosition)) {
      return savedPosition;
    }

    if (typeof legacyPosition?.x === 'number' && typeof legacyPosition.y === 'number') {
      return {
        top: legacyPosition.y,
        left: legacyPosition.x,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export async function saveHudPosition(position: HudPosition): Promise<void> {
  if (!globalThis.chrome?.storage?.local) {
    return;
  }

  try {
    await chrome.storage.local.set({ [HUD_POSITION_KEY]: position });
  } catch {
    return;
  }
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

function getQuotaStorageKey(providerId: string): string {
  return `${QUOTA_KEY_PREFIX}${providerId}`;
}

function isProviderQuota(value: unknown): value is ProviderQuota {
  return (
    typeof value === 'object' &&
    value !== null &&
    'providerId' in value &&
    'providerName' in value &&
    'limits' in value &&
    Array.isArray((value as ProviderQuota).limits)
  );
}

function isHudPosition(value: unknown): value is HudPosition {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as HudPosition).top === 'number' &&
    typeof (value as HudPosition).left === 'number'
  );
}
