import type { HudPosition, ProviderQuota } from '../providers/types';

const HUD_POSITION_KEY = 'quotaClock.hudPosition';
const HUD_POSITION_V2_KEY = 'hud:position';
const QUOTA_KEY_PREFIX = 'quota:';

function hasChromeStorage(): boolean {
  return Boolean(globalThis.chrome?.storage?.local);
}

export async function saveProviderQuota(quota: ProviderQuota): Promise<void> {
  if (!hasChromeStorage()) {
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

export async function getProviderQuota(providerId: string): Promise<ProviderQuota | null> {
  if (!hasChromeStorage()) {
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

export async function getAllProviderQuotas(): Promise<ProviderQuota[]> {
  if (!hasChromeStorage()) {
    return [];
  }

  try {
    const result = await chrome.storage.local.get(null);
    return Object.entries(result)
      .filter(([key]) => key.startsWith(QUOTA_KEY_PREFIX))
      .map(([, value]) => value)
      .filter(isProviderQuota);
  } catch {
    return [];
  }
}

export async function loadProviderQuota(providerId: string): Promise<ProviderQuota | null> {
  return getProviderQuota(providerId);
}

export async function loadProviderQuotas(): Promise<Record<string, ProviderQuota>> {
  const quotas = await getAllProviderQuotas();
  return quotas.reduce<Record<string, ProviderQuota>>((accumulator, quota) => {
    accumulator[quota.providerId] = quota;
    return accumulator;
  }, {});
}

export async function saveProviderQuotas(quotas: ProviderQuota[]): Promise<void> {
  await Promise.all(quotas.map((quota) => saveProviderQuota(quota)));
}

export async function loadHudPosition(): Promise<HudPosition | null> {
  return getHudPosition();
}

export async function getHudPosition(): Promise<HudPosition | null> {
  if (!hasChromeStorage()) {
    return null;
  }

  try {
    const result = await chrome.storage.local.get([HUD_POSITION_V2_KEY, HUD_POSITION_KEY]);
    const savedPosition = result[HUD_POSITION_V2_KEY];
    const legacyPosition = result[HUD_POSITION_KEY] as { x?: number; y?: number } | undefined;

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
  await saveHudPositionValue(position);
}

export async function saveHudPositionValue(position: HudPosition): Promise<void> {
  if (!hasChromeStorage()) {
    return;
  }

  try {
    await chrome.storage.local.set({ [HUD_POSITION_V2_KEY]: position });
  } catch {
    return;
  }
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
