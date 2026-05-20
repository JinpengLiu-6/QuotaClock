import type { HudPosition, ProviderQuota } from '../providers/types';

const QUOTA_STORAGE_KEY = 'quotaClock.providerQuotas';
const HUD_POSITION_KEY = 'quotaClock.hudPosition';

type StoredProviderQuotas = Record<string, ProviderQuota>;

function hasChromeStorage(): boolean {
  return Boolean(globalThis.chrome?.storage?.local);
}

export async function loadProviderQuotas(): Promise<StoredProviderQuotas> {
  if (!hasChromeStorage()) {
    return {};
  }

  const result = await chrome.storage.local.get(QUOTA_STORAGE_KEY);
  return (result[QUOTA_STORAGE_KEY] as StoredProviderQuotas | undefined) ?? {};
}

export async function loadProviderQuota(providerId: string): Promise<ProviderQuota | null> {
  const quotas = await loadProviderQuotas();
  return quotas[providerId] ?? null;
}

export async function saveProviderQuota(quota: ProviderQuota): Promise<void> {
  if (!hasChromeStorage()) {
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

export async function saveProviderQuotas(quotas: ProviderQuota[]): Promise<void> {
  if (!hasChromeStorage()) {
    return;
  }

  const existing = await loadProviderQuotas();
  const next = quotas.reduce<StoredProviderQuotas>(
    (accumulator, quota) => ({
      ...accumulator,
      [quota.providerId]: quota,
    }),
    existing,
  );

  await chrome.storage.local.set({ [QUOTA_STORAGE_KEY]: next });
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
