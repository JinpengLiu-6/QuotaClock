<script setup lang="ts">
import { computed, ref } from 'vue';
import ProviderCard from '../components/ProviderCard.vue';
import { getMockProviderQuotas } from '../providers';
import type { ProviderQuota, RefreshQuotaResponse } from '../providers/types';
import { getAllProviderQuotas, saveProviderQuota } from '../storage/quotaStorage';
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
const dataMode = computed(() => {
  const hasDomQuota = providers.value.some((provider) => provider.source === 'dom');
  return hasDomQuota ? 'Mixed' : 'Simulation';
});
const lastUpdated = computed(() => {
  const timestamps = providers.value
    .map((provider) => Date.parse(provider.updatedAt))
    .filter((timestamp) => Number.isFinite(timestamp));

  return timestamps.length > 0 ? new Date(Math.max(...timestamps)).toLocaleTimeString() : 'Unknown';
});

void loadStoredQuotas();

async function loadStoredQuotas(): Promise<void> {
  const storedQuotas = await getAllProviderQuotas();

  if (storedQuotas.length > 0) {
    providers.value = mergeProviderQuotas(providers.value, storedQuotas);
  }
}

async function scanActiveTabQuota(): Promise<void> {
  refreshError.value = '';
  isRefreshing.value = true;

  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!activeTab.id || !isSupportedQuotaPage(activeTab.url)) {
      refreshError.value = 'Please open ChatGPT/Codex page first.';
      return;
    }

    const response = (await chrome.tabs.sendMessage(activeTab.id, {
      type: 'REFRESH_QUOTA',
    })) as RefreshQuotaResponse;

    if (!response.ok || !response.quota) {
      refreshError.value = response.error ?? 'Could not read quota. Open Rate limits panel and scan again.';
      return;
    }

    await saveProviderQuota(response.quota);
    providers.value = mergeProviderQuotas(providers.value, [response.quota]);
  } catch {
    refreshError.value = 'Could not read quota. Open Rate limits panel and scan again.';
  } finally {
    isRefreshing.value = false;
  }
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

function mergeProviderQuotas(currentQuotas: ProviderQuota[], nextQuotas: ProviderQuota[]): ProviderQuota[] {
  const nextQuotaByProviderId = new Map(nextQuotas.map((quota) => [quota.providerId, quota]));
  return currentQuotas.map((quota) => nextQuotaByProviderId.get(quota.providerId) ?? quota);
}

function isSupportedQuotaPage(url?: string): boolean {
  return Boolean(
    url?.startsWith('https://chatgpt.com/') || url?.startsWith('https://chat.openai.com/'),
  );
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
          @click="scanActiveTabQuota"
        >
          {{ isRefreshing ? 'Scan' : 'Scan' }}
        </button>
      </div>
      <div class="header-meta">
        <span>Telemetry: {{ dataMode }}</span>
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
