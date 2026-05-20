<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import ProviderCard from '../components/ProviderCard.vue';
import { getDefaultProviderQuotas } from '../providers';
import type { ProviderQuota, RefreshQuotaResponse } from '../providers/types';
import { loadProviderQuotas, saveProviderQuota } from '../storage/quotaStorage';
import { getPrimaryPercent, getQuotaStatus } from '../utils/quotaStatus';

const providers = ref<ProviderQuota[]>(getDefaultProviderQuotas());
const refreshError = ref('');
const isRefreshing = ref(false);

const recommendedProvider = computed(() => {
  const sorted = [...providers.value].sort((left, right) => {
    const leftPercent = getPrimaryPercent(left.limits) ?? -1;
    const rightPercent = getPrimaryPercent(right.limits) ?? -1;
    return rightPercent - leftPercent;
  });

  return sorted[0]?.providerName ?? 'Unknown';
});

const lastUpdated = computed(() => {
  const timestamps = providers.value
    .map((provider) => Date.parse(provider.updatedAt))
    .filter((timestamp) => Number.isFinite(timestamp));

  if (timestamps.length === 0) {
    return 'Unknown';
  }

  return new Date(Math.max(...timestamps)).toLocaleString();
});

onMounted(loadQuotas);

async function loadQuotas(): Promise<void> {
  const stored = await loadProviderQuotas();
  providers.value = getDefaultProviderQuotas().map((quota) => stored[quota.providerId] ?? quota);
}

async function refreshActiveTabQuota(): Promise<void> {
  refreshError.value = '';
  isRefreshing.value = true;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.id) {
      throw new Error('No active tab found.');
    }

    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'REFRESH_QUOTA',
    }) as RefreshQuotaResponse;

    if (!response.ok || !response.quota) {
      throw new Error(
        response.error ??
          'Could not read quota. Please open the Rate limits remaining panel, then refresh again.',
      );
    }

    await saveProviderQuota(response.quota);
    providers.value = providers.value.map((provider) =>
      provider.providerId === response.quota?.providerId ? response.quota : provider,
    );
  } catch (error) {
    refreshError.value =
      error instanceof Error
        ? error.message
        : 'Could not read quota. Please open the Rate limits remaining panel, then refresh again.';
  } finally {
    isRefreshing.value = false;
  }
}

function getProviderStatus(quota: ProviderQuota): string {
  return getQuotaStatus(getPrimaryPercent(quota.limits));
}
</script>

<template>
  <main class="popup-shell" aria-label="QuotaClock popup">
    <header class="popup-header">
      <div>
        <p class="eyebrow">AI quota monitor</p>
        <h1>QuotaClock</h1>
        <p class="popup-subtitle">Recommended: {{ recommendedProvider }}</p>
      </div>
      <button class="primary-button" type="button" :disabled="isRefreshing" @click="refreshActiveTabQuota">
        {{ isRefreshing ? 'Refreshing' : 'Refresh' }}
      </button>
    </header>

    <p v-if="refreshError" class="inline-alert">{{ refreshError }}</p>

    <section class="provider-grid" aria-label="Provider quota cards">
      <ProviderCard
        v-for="provider in providers"
        :key="`${provider.providerId}-${getProviderStatus(provider)}`"
        :quota="provider"
      />
    </section>

    <footer class="popup-footer">
      <span>Last updated {{ lastUpdated }}</span>
      <a href="#" aria-label="Settings placeholder">Settings</a>
      <a href="https://github.com/JinpengLiu-6/QuotaClock" target="_blank" rel="noreferrer">GitHub</a>
    </footer>
  </main>
</template>
