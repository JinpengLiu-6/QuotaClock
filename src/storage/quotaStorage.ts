import type { HudPosition, ProviderQuota } from '../providers/types';

const HUD_POSITION_KEY = 'quotaClock.hudPosition';
const QUOTA_KEY_PREFIX = 'quota:';

function hasChromeStorage(): boolean {
  return Boolean(globalThis.chrome?.storage?.local);
}

export async function saveProviderQuota(quota: ProviderQuota): Promise<void> {
  if (!hasChromeStorage()) {
    return;
  }

  await chrome.storage.local.set({
    [getQuotaStorageKey(quota.providerId)]: quota,
  });
}

export async function getProviderQuota(providerId: string): Promise<ProviderQuota | null> {
  if (!hasChromeStorage()) {
    return null;
  }

  const result = await chrome.storage.local.get(getQuotaStorageKey(providerId));
  return (result[getQuotaStorageKey(providerId)] as ProviderQuota | undefined) ?? null;
}

export async function getAllProviderQuotas(): Promise<ProviderQuota[]> {
  if (!hasChromeStorage()) {
    return [];
  }

  const result = await chrome.storage.local.get(null);
  return Object.entries(result)
    .filter(([key]) => key.startsWith(QUOTA_KEY_PREFIX))
    .map(([, value]) => value)
    .filter(isProviderQuota);
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
  if (!hasChromeStorage()) {
    return null;
  }

  const result = await chrome.storage.local.get(HUD_POSITION_KEY);
  return (result[HUD_POSITION_KEY] as HudPosition | undefined) ?? null;
}

export async function saveHudPosition(position: HudPosition): Promise<void> {
  if (!hasChromeStorage()) {
    return;
  }

  await chrome.storage.local.set({ [HUD_POSITION_KEY]: position });
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
