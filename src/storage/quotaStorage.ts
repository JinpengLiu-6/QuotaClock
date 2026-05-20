import type { ProviderId, QuotaSnapshot } from '../providers/types';

const STORAGE_KEY = 'quotaClock.snapshots';

type StoredQuotaSnapshots = Partial<Record<ProviderId, QuotaSnapshot>>;

export async function loadQuotaSnapshots(): Promise<StoredQuotaSnapshots> {
  if (!globalThis.chrome?.storage?.local) {
    return {};
  }

  const result = await chrome.storage.local.get(STORAGE_KEY);
  return (result[STORAGE_KEY] as StoredQuotaSnapshots | undefined) ?? {};
}

export async function saveQuotaSnapshot(snapshot: QuotaSnapshot): Promise<void> {
  if (!globalThis.chrome?.storage?.local) {
    return;
  }

  const snapshots = await loadQuotaSnapshots();
  await chrome.storage.local.set({
    [STORAGE_KEY]: {
      ...snapshots,
      [snapshot.id]: snapshot,
    },
  });
}
