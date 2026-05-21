<script setup lang="ts">
import { computed, ref } from 'vue';
import ProviderCard from '../components/ProviderCard.vue';
import { getMockProviderQuotas } from '../providers';
import type { ProviderQuota } from '../providers/types';
import {
  formatCommandStatus,
  getAttentionMessage,
  getBestProvider,
  getBestProviderReason,
  getTaskSuggestions,
} from '../utils/recommendation';
import { getWorstStatus } from '../utils/quotaStatus';

const providers = ref<ProviderQuota[]>(getMockProviderQuotas());
const refreshError = ref('');
const isRefreshing = ref(false);
const expandedProviderIds = ref<Set<string>>(new Set(['codex']));

const bestProvider = computed(() => getBestProvider(providers.value));
const bestStatus = computed(() => (bestProvider.value ? getWorstStatus(bestProvider.value.limits) : 'unknown'));
const bestReason = computed(() =>
  bestProvider.value ? getBestProviderReason(bestProvider.value) : 'Open an AI provider page and refresh quota.',
);
const taskSuggestions = computed(() => getTaskSuggestions(providers.value));
const attentionMessage = computed(() => getAttentionMessage(providers.value));
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

function isProviderExpanded(providerId: string): boolean {
  return expandedProviderIds.value.has(providerId);
}

function toggleProvider(providerId: string): void {
  const nextExpandedProviderIds = new Set(expandedProviderIds.value);

  if (nextExpandedProviderIds.has(providerId)) {
    nextExpandedProviderIds.delete(providerId);
  } else {
    nextExpandedProviderIds.add(providerId);
  }

  expandedProviderIds.value = nextExpandedProviderIds;
}
</script>

<template>
  <main class="popup-shell" aria-label="QuotaClock popup">
    <header class="command-header">
      <div class="header-topline">
        <div>
          <h1>QuotaClock</h1>
          <p>AI Model Control Center</p>
        </div>
        <button
          class="primary-button"
          type="button"
          aria-label="Scan quota dashboard"
          :disabled="isRefreshing"
          @click="refreshMockQuotas"
        >
          {{ isRefreshing ? 'Scan' : 'Scan' }}
        </button>
      </div>
      <div class="header-meta">
        <span>Telemetry: Simulation</span>
        <span>Sync: {{ lastUpdated }}</span>
      </div>
    </header>

    <p v-if="refreshError" class="inline-alert">{{ refreshError }}</p>

    <section v-if="providers.length > 0" class="best-choice" aria-label="Best provider now">
      <div>
        <p class="section-label">Active model</p>
        <h2>{{ bestProvider?.providerName ?? 'Unknown' }}</h2>
        <p>{{ bestReason }}</p>
      </div>
      <span class="command-status" :data-status="bestStatus">
        {{ formatCommandStatus(bestStatus) }}
      </span>
    </section>

    <section v-if="providers.length > 0" class="mission-section" aria-label="Mission router">
      <p class="section-label">Mission router</p>
      <div class="suggestion-section">
      <div
        v-for="suggestion in taskSuggestions"
        :key="suggestion.label"
        class="suggestion-chip"
        :data-status="suggestion.status"
      >
        <span>{{ suggestion.label }}</span>
        <strong>{{ suggestion.providerName }}</strong>
      </div>
      </div>
    </section>

    <section v-if="providers.length > 0" class="provider-grid" aria-label="Provider clocks">
      <ProviderCard
        v-for="provider in providers"
        :key="provider.providerId"
        :expanded="isProviderExpanded(provider.providerId)"
        :quota="provider"
        @toggle="toggleProvider(provider.providerId)"
      />
    </section>

    <section v-else class="empty-state" aria-label="No quota data">
      <strong>No quota data yet.</strong>
      <span>Open an AI provider page and refresh.</span>
    </section>

    <section v-if="providers.length > 0" class="attention-section" aria-label="Quota attention">
      <strong>System Signal</strong>
      <p>{{ attentionMessage }}</p>
    </section>
  </main>
</template>
