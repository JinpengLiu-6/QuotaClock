<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { parseCodexQuotaFromDocument } from '../content/parsers/codexParser';
import type { HudPosition, ProviderQuota } from '../providers/types';
import {
  getHudPosition,
  getProviderQuota,
  saveHudPosition,
  saveProviderQuota,
} from '../storage/quotaStorage';
import { getPrimaryPercent } from '../utils/quotaStatus';

const HUD_WIDTH = 210;
const MIN_VISIBLE_WIDTH = 80;
const MIN_VISIBLE_HEIGHT = 60;
const DRAG_THRESHOLD = 4;
const DEFAULT_TOP = 88;
const DEFAULT_RIGHT = 20;

const expanded = ref(false);
const quota = ref<ProviderQuota | null>(null);
const position = ref<HudPosition>(getDefaultPosition());
const scanMessage = ref('Idle');
const isScanning = ref(false);
const isDragging = ref(false);
const didDrag = ref(false);
const dragOffset = ref({ top: 0, left: 0 });
const dragStart = ref({ x: 0, y: 0 });

const mainValue = computed(() => {
  if (!quota.value) {
    return 'Unknown';
  }

  const percent = getPrimaryPercent(quota.value.limits);
  return typeof percent === 'number' ? `${percent}%` : 'Unknown';
});
const sourceLabel = computed(() => quota.value?.source ?? '');
const updatedLabel = computed(() => {
  if (!quota.value?.updatedAt) {
    return 'Unknown';
  }

  return new Date(quota.value.updatedAt).toLocaleTimeString();
});

onMounted(async () => {
  const [savedQuota, savedPosition] = await Promise.all([
    getProviderQuota('codex'),
    getHudPosition(),
  ]);

  if (savedQuota) {
    quota.value = savedQuota;
    scanMessage.value = `Loaded ${savedQuota.source} quota`;
  }

  if (savedPosition) {
    position.value = clampPosition(savedPosition);
  }

  chrome.storage?.onChanged?.addListener(handleStorageChanged);
});

onUnmounted(() => {
  chrome.storage?.onChanged?.removeListener(handleStorageChanged);
});

async function scanQuota(): Promise<void> {
  isScanning.value = true;
  scanMessage.value = 'Scanning current page...';

  try {
    const parsedQuota = parseCodexQuotaFromDocument(document);

    if (!parsedQuota) {
      scanMessage.value = 'Open Rate limits panel and scan again.';
      return;
    }

    await saveProviderQuota(parsedQuota);
    quota.value = parsedQuota;
    scanMessage.value = 'Updated from DOM';
  } catch {
    scanMessage.value = 'Open Rate limits panel and scan again.';
  } finally {
    isScanning.value = false;
  }
}

function toggleExpanded(): void {
  if (didDrag.value) {
    didDrag.value = false;
    return;
  }

  expanded.value = !expanded.value;
}

function collapse(): void {
  expanded.value = false;
}

function startDrag(event: PointerEvent): void {
  isDragging.value = true;
  didDrag.value = false;
  dragStart.value = {
    x: event.clientX,
    y: event.clientY,
  };
  dragOffset.value = {
    top: event.clientY - position.value.top,
    left: event.clientX - position.value.left,
  };
  window.addEventListener('pointermove', moveHud);
  window.addEventListener('pointerup', stopDrag, { once: true });
}

function moveHud(event: PointerEvent): void {
  if (!isDragging.value) {
    return;
  }

  const distance = Math.hypot(event.clientX - dragStart.value.x, event.clientY - dragStart.value.y);
  if (distance <= DRAG_THRESHOLD) {
    return;
  }

  didDrag.value = true;
  position.value = clampPosition({
    top: event.clientY - dragOffset.value.top,
    left: event.clientX - dragOffset.value.left,
  });
}

async function stopDrag(): Promise<void> {
  isDragging.value = false;
  window.removeEventListener('pointermove', moveHud);
  await saveHudPosition(position.value);
}

function getLimitValue(limit: ProviderQuota['limits'][number]): string {
  if (typeof limit.remainingPercent === 'number') {
    return `${limit.remainingPercent}%`;
  }

  return limit.balanceText ?? 'Unknown';
}

function handleStorageChanged(changes: Record<string, chrome.storage.StorageChange>, areaName: string): void {
  if (areaName !== 'local') {
    return;
  }

  const codexQuota = changes['quota:codex']?.newValue as ProviderQuota | undefined;
  if (codexQuota) {
    quota.value = codexQuota;
    scanMessage.value = `Loaded ${codexQuota.source} quota`;
  }
}

function getDefaultPosition(): HudPosition {
  return {
    top: DEFAULT_TOP,
    left: Math.max(8, window.innerWidth - HUD_WIDTH - DEFAULT_RIGHT),
  };
}

function clampPosition(nextPosition: HudPosition): HudPosition {
  return {
    top: Math.max(8, Math.min(window.innerHeight - MIN_VISIBLE_HEIGHT, nextPosition.top)),
    left: Math.max(8, Math.min(window.innerWidth - MIN_VISIBLE_WIDTH, nextPosition.left)),
  };
}
</script>

<template>
  <aside
    class="qc-hud"
    :class="{ 'qc-hud-expanded': expanded, 'qc-hud-dragging': isDragging }"
    :style="{ left: `${position.left}px`, top: `${position.top}px` }"
    aria-label="QuotaClock ChatGPT quota overlay"
  >
    <button
      class="qc-hud-compact"
      type="button"
      :aria-expanded="expanded"
      aria-label="Toggle QuotaClock overlay"
      @click="toggleExpanded"
      @pointerdown="startDrag"
    >
      <span class="qc-hud-dot" aria-hidden="true"></span>
      <span class="qc-hud-name">QuotaClock</span>
      <strong>{{ mainValue }}</strong>
      <small v-if="sourceLabel">{{ sourceLabel }}</small>
    </button>

    <section v-if="expanded" class="qc-hud-panel">
      <header class="qc-hud-panel-head">
        <div>
          <p>Codex</p>
          <span>Source: {{ sourceLabel || 'Unknown' }}</span>
        </div>
        <button type="button" class="qc-hud-link-button" @click.stop="collapse">Collapse</button>
      </header>

      <div class="qc-hud-limit-list">
        <div v-if="!quota" class="qc-hud-limit">
          <span>Quota</span>
          <strong>Unknown</strong>
        </div>
        <div v-for="limit in quota?.limits ?? []" :key="limit.id" class="qc-hud-limit">
          <span>{{ limit.label }}</span>
          <strong>{{ getLimitValue(limit) }}</strong>
          <small>reset {{ limit.resetAtText ?? 'Unknown' }}</small>
        </div>
      </div>

      <p class="qc-hud-recommendation">
        Recommendation: {{ quota?.recommendation ?? 'Open Rate limits panel and scan again.' }}
      </p>
      <p class="qc-hud-meta">Last updated: {{ updatedLabel }}</p>
      <p class="qc-hud-note">{{ scanMessage }}</p>

      <button class="qc-hud-scan" type="button" :disabled="isScanning" @click.stop="scanQuota">
        {{ isScanning ? 'Scanning' : 'Scan' }}
      </button>
    </section>
  </aside>
</template>
