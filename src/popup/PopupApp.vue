<script setup lang="ts">
import { computed, ref } from 'vue';
import ProviderCard from '../components/ProviderCard.vue';
import { getMockProviderQuotas } from '../providers';
import type { ProviderQuota, RefreshQuotaResponse, ScanDebugInfo } from '../providers/types';
import { deleteProviderQuota, getAllProviderQuotas, saveProviderQuota } from '../storage/quotaStorage';
import {
  applyManualQuotaUpdate,
  createManualLimitDrafts,
  type ManualLimitDraft,
} from '../utils/manualQuota';
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
const scanStatus = ref('Idle');
const scanDebug = ref<ScanDebugInfo | null>(null);
const expandedProviderIds = ref<Set<string>>(new Set(['codex']));
const editingProviderId = ref<string | null>(null);
const manualDrafts = ref<ManualLimitDraft[]>([]);

const bestProvider = computed(() => getBestProvider(providers.value));
const bestStatus = computed(() => (bestProvider.value ? getWorstStatus(bestProvider.value.limits) : 'unknown'));
const bestReason = computed(() =>
  bestProvider.value ? getBestProviderReason(bestProvider.value) : 'Open an AI provider page and refresh quota.',
);
const taskSuggestions = computed(() => getTaskSuggestions(providers.value));
const attentionMessage = computed(() => getAttentionMessage(providers.value));
const dataMode = computed(() => {
  const hasDomQuota = providers.value.some((provider) => provider.source === 'dom');
  const hasManualQuota = providers.value.some((provider) => provider.source === 'manual');

  if (hasDomQuota && hasManualQuota) {
    return 'DOM + Manual';
  }

  if (hasDomQuota) {
    return 'Mixed';
  }

  if (hasManualQuota) {
    return 'Manual';
  }

  return 'Simulation';
});
const lastUpdated = computed(() => {
  const timestamps = providers.value
    .map((provider) => Date.parse(provider.updatedAt))
    .filter((timestamp) => Number.isFinite(timestamp));

  return timestamps.length > 0 ? new Date(Math.max(...timestamps)).toLocaleTimeString() : 'Unknown';
});
const editingProvider = computed(() =>
  providers.value.find((provider) => provider.providerId === editingProviderId.value) ?? null,
);

void loadStoredQuotas();

async function loadStoredQuotas(): Promise<void> {
  const storedQuotas = await getAllProviderQuotas();

  if (storedQuotas.length > 0) {
    providers.value = mergeProviderQuotas(providers.value, storedQuotas);
  }
}

async function scanActiveTabQuota(): Promise<void> {
  refreshError.value = '';
  scanDebug.value = null;
  isRefreshing.value = true;
  scanStatus.value = 'Scanning current tab...';

  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!activeTab.id || !isSupportedQuotaPage(activeTab.url)) {
      refreshError.value = 'Please open ChatGPT/Codex page first.';
      scanStatus.value = 'Please open ChatGPT/Codex page first.';
      return;
    }

    const response = (await chrome.tabs.sendMessage(activeTab.id, {
      type: 'REFRESH_QUOTA',
    })) as RefreshQuotaResponse;

    if (!response.ok || !response.quota) {
      refreshError.value = response.error ?? 'Could not read quota. Open Rate limits panel and scan again.';
      scanStatus.value = refreshError.value;
      scanDebug.value = response.debug ?? null;
      return;
    }

    await saveProviderQuota(response.quota);
    providers.value = mergeProviderQuotas(providers.value, [response.quota]);
    scanDebug.value = null;
    scanStatus.value = 'Codex quota updated from DOM · source: dom';
  } catch {
    refreshError.value = 'Could not read quota. Open Rate limits panel and scan again.';
    scanStatus.value = refreshError.value;
    scanDebug.value = null;
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

function openManualEditor(provider: ProviderQuota): void {
  editingProviderId.value = provider.providerId;
  manualDrafts.value = createManualLimitDrafts(provider);
}

function closeManualEditor(): void {
  editingProviderId.value = null;
  manualDrafts.value = [];
}

async function saveManualQuota(): Promise<void> {
  if (!editingProvider.value) {
    return;
  }

  const updatedQuota = applyManualQuotaUpdate(editingProvider.value, manualDrafts.value);
  await saveProviderQuota(updatedQuota);
  providers.value = mergeProviderQuotas(providers.value, [updatedQuota]);
  expandedProviderIds.value = new Set([...expandedProviderIds.value, updatedQuota.providerId]);
  scanStatus.value = `${updatedQuota.providerName} quota saved manually`;
  closeManualEditor();
}

async function resetProviderQuota(): Promise<void> {
  if (!editingProvider.value) {
    return;
  }

  const providerId = editingProvider.value.providerId;
  const mockQuota = getMockProviderQuotas().find((provider) => provider.providerId === providerId);

  await deleteProviderQuota(providerId);

  if (mockQuota) {
    providers.value = mergeProviderQuotas(providers.value, [mockQuota]);
  }

  scanStatus.value = `${editingProvider.value.providerName} reset to simulation`;
  closeManualEditor();
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
      <p class="scan-status" aria-live="polite">{{ scanStatus }}</p>
    </header>

    <p v-if="refreshError" class="inline-alert">{{ refreshError }}</p>

    <details v-if="refreshError && scanDebug" class="scan-debug-panel">
      <summary>Scan debug</summary>
      <div class="scan-debug-grid">
        <span>hasBody</span>
        <strong>{{ scanDebug.hasBody }}</strong>
        <span>textLength</span>
        <strong>{{ scanDebug.textLength }}</strong>
        <span>hasRateLimitsRemaining</span>
        <strong>{{ scanDebug.hasRateLimitsRemaining }}</strong>
        <span>has5h</span>
        <strong>{{ scanDebug.has5h }}</strong>
        <span>hasWeekly</span>
        <strong>{{ scanDebug.hasWeekly }}</strong>
      </div>
      <p>Copy the snippet below and paste it into an issue if parsing fails.</p>
      <pre>{{ scanDebug.nearbySnippet || scanDebug.matchedSnippet || 'No page text captured.' }}</pre>
    </details>

    <section v-if="editingProvider" class="manual-editor" aria-label="Manual quota editor">
      <header class="manual-editor-head">
        <div>
          <p class="section-label">Manual input</p>
          <h2>{{ editingProvider.providerName }}</h2>
        </div>
        <button class="card-mini-button" type="button" @click="closeManualEditor">Close</button>
      </header>

      <div class="manual-limit-list">
        <label v-for="draft in manualDrafts" :key="draft.id" class="manual-limit-row">
          <span>{{ editingProvider.limits.find((limit) => limit.id === draft.id)?.label ?? 'Limit' }}</span>
          <input
            v-model="draft.remainingPercent"
            type="number"
            min="0"
            max="100"
            inputmode="numeric"
            placeholder="%"
            aria-label="Remaining percent"
          />
          <input
            v-model="draft.balanceText"
            type="text"
            placeholder="Balance"
            aria-label="Balance text"
          />
          <input
            v-model="draft.resetAtText"
            type="text"
            placeholder="Reset"
            aria-label="Reset text"
          />
        </label>
      </div>

      <div class="manual-actions">
        <button class="primary-button" type="button" @click="saveManualQuota">Save</button>
        <button class="secondary-button" type="button" @click="resetProviderQuota">Reset mock</button>
      </div>
    </section>

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
        @edit="openManualEditor(provider)"
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
