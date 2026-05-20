<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { createUnknownCodexQuota } from '../providers/codexProvider';
import type { HudPosition, ProviderQuota, RefreshQuotaResponse } from '../providers/types';
import {
  loadHudPosition,
  loadProviderQuota,
  saveHudPosition,
  saveProviderQuota,
} from '../storage/quotaStorage';
import { getPrimaryPercent } from '../utils/quotaStatus';

const expanded = ref(false);
const quota = ref<ProviderQuota>(createUnknownCodexQuota());
const position = ref<HudPosition>({ x: 20, y: 88 });
const message = ref('Open settings and refresh');
const dragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });

const lowestPercent = computed(() => {
  const percent = getPrimaryPercent(quota.value.limits);
  return typeof percent === 'number' ? `${percent}%` : 'Unknown';
});

onMounted(async () => {
  const [savedQuota, savedPosition] = await Promise.all([
    loadProviderQuota('codex'),
    loadHudPosition(),
  ]);

  if (savedQuota) {
    quota.value = savedQuota;
    message.value = savedQuota.recommendation;
  }

  if (savedPosition) {
    position.value = savedPosition;
  }
});

async function refreshQuota(): Promise<void> {
  const response = await chrome.runtime.sendMessage({ type: 'REFRESH_QUOTA' }) as RefreshQuotaResponse;

  if (response.ok && response.quota) {
    quota.value = response.quota;
    message.value = response.quota.recommendation;
    await saveProviderQuota(response.quota);
    return;
  }

  message.value = response.error ?? 'Open settings and refresh';
}

function startDrag(event: PointerEvent): void {
  dragging.value = true;
  dragOffset.value = {
    x: event.clientX - position.value.x,
    y: event.clientY - position.value.y,
  };
  window.addEventListener('pointermove', moveHud);
  window.addEventListener('pointerup', stopDrag, { once: true });
}

function moveHud(event: PointerEvent): void {
  if (!dragging.value) {
    return;
  }

  position.value = {
    x: Math.max(8, Math.min(window.innerWidth - 230, event.clientX - dragOffset.value.x)),
    y: Math.max(8, Math.min(window.innerHeight - 190, event.clientY - dragOffset.value.y)),
  };
}

async function stopDrag(): Promise<void> {
  dragging.value = false;
  window.removeEventListener('pointermove', moveHud);
  await saveHudPosition(position.value);
}
</script>

<template>
  <aside
    class="qc-hud"
    :class="{ 'qc-hud-expanded': expanded }"
    :style="{ left: `${position.x}px`, top: `${position.y}px` }"
  >
    <button class="qc-hud-bar" type="button" @click="expanded = !expanded" @pointerdown="startDrag">
      <span>QuotaClock</span>
      <strong>{{ lowestPercent }}</strong>
    </button>

    <div v-if="expanded" class="qc-hud-panel">
      <h2>Codex</h2>
      <div v-for="limit in quota.limits" :key="limit.id" class="qc-hud-limit">
        <span>{{ limit.label }}: {{ limit.remainingPercent ?? 'Unknown' }}{{ typeof limit.remainingPercent === 'number' ? '%' : '' }}</span>
        <span>reset {{ limit.resetAtText ?? 'Unknown' }}</span>
      </div>
      <p>Recommendation: {{ quota.recommendation }}</p>
      <p v-if="quota.source === 'dom' && lowestPercent === 'Unknown'" class="qc-hud-note">
        {{ message }}
      </p>
      <button class="qc-secondary-button" type="button" @click.stop="refreshQuota">Refresh</button>
    </div>
  </aside>
</template>
