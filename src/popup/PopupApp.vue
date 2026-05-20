<script setup lang="ts">
import { computed, ref } from 'vue';
import ProviderCard from '../components/ProviderCard.vue';
import { getMockProviderQuotas } from '../providers';
import type { ProviderQuota } from '../providers/types';
import { getPrimaryPercent, getWorstStatus } from '../utils/quotaStatus';

const providers = ref<ProviderQuota[]>(getMockProviderQuotas());
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

async function refreshActiveTabQuota(): Promise<void> {
  isRefreshing.value = true;

  window.setTimeout(() => {
    providers.value = getMockProviderQuotas();
    isRefreshing.value = false;
  }, 220);
}

function getProviderStatus(quota: ProviderQuota): string {
  return getWorstStatus(quota.limits);
}
</script>

<template>
  <main class="popup-shell" aria-label="QuotaClock popup">
    <header class="popup-header">
      <div>
        <p class="eyebrow">AI quota monitor</p>
        <h1>QuotaClock</h1>
        <p class="popup-subtitle">Recommended provider</p>
        <strong class="recommended-provider">{{ recommendedProvider }}</strong>
      </div>
      <button class="primary-button" type="button" :disabled="isRefreshing" @click="refreshActiveTabQuota">
        {{ isRefreshing ? 'Refreshing' : 'Refresh' }}
      </button>
    </header>

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
