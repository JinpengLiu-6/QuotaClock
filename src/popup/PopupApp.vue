<script setup lang="ts">
import { computed, ref } from 'vue';
import ProviderCard from '../components/ProviderCard.vue';
import { getMockProviderQuotas } from '../providers';
import type { ProviderQuota } from '../providers/types';
import { getRecommendedProvider } from '../utils/quotaStatus';

const providers = ref<ProviderQuota[]>(getMockProviderQuotas());
const refreshError = ref('');
const isRefreshing = ref(false);

const recommendedProvider = computed(() => getRecommendedProvider(providers.value));
const lastUpdated = computed(() => {
  const timestamps = providers.value
    .map((provider) => Date.parse(provider.updatedAt))
    .filter((timestamp) => Number.isFinite(timestamp));

  return timestamps.length > 0 ? new Date(Math.max(...timestamps)).toLocaleTimeString() : 'Unknown';
});

function refreshMockQuotas(): void {
  refreshError.value = '';
  isRefreshing.value = true;

  window.setTimeout(() => {
    try {
      providers.value = getMockProviderQuotas();
    } catch {
      refreshError.value = 'Could not read quota. Open Rate limits panel and refresh again.';
    } finally {
      isRefreshing.value = false;
    }
  }, 180);
}
</script>

<template>
  <main class="popup-shell" aria-label="QuotaClock popup">
    <header class="popup-header">
      <div class="header-title">
        <h1>QuotaClock</h1>
        <p>AI Quota Monitor</p>
      </div>
      <button class="primary-button" type="button" :disabled="isRefreshing" @click="refreshMockQuotas">
        {{ isRefreshing ? 'Syncing' : 'Refresh' }}
      </button>
    </header>

    <section class="recommendation-strip" aria-label="Recommended provider">
      <span>Recommended:</span>
      <strong>{{ recommendedProvider?.providerName ?? 'Unknown' }}</strong>
      <small>mock data</small>
    </section>

    <p v-if="refreshError" class="inline-alert">{{ refreshError }}</p>

    <section v-if="providers.length > 0" class="provider-grid" aria-label="Provider quota cards">
      <ProviderCard v-for="provider in providers" :key="provider.providerId" :quota="provider" />
    </section>

    <p v-else class="empty-state">No quota data yet.</p>

    <footer class="popup-footer">
      <span>Updated {{ lastUpdated }}</span>
      <a href="#" aria-label="Settings placeholder">Settings</a>
      <a href="https://github.com/JinpengLiu-6/QuotaClock" target="_blank" rel="noreferrer">GitHub</a>
    </footer>
  </main>
</template>
