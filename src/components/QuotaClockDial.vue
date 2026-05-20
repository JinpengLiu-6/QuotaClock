<script setup lang="ts">
import { computed } from 'vue';
import type { ProviderQuota, QuotaLimit, ProviderStatus } from '../providers/types';
import { getPrimaryPercent, getQuotaStatus } from '../utils/quotaStatus';

const props = defineProps<{
  quota: ProviderQuota;
  size?: number;
}>();

const radiusOuter = 43;
const radiusInner = 32;
const circumferenceOuter = 2 * Math.PI * radiusOuter;
const circumferenceInner = 2 * Math.PI * radiusInner;
const tickAngles = Array.from({ length: 12 }, (_, index) => index * 30);

const primaryLimit = computed(() => props.quota.limits[0]);
const secondaryLimit = computed(() => props.quota.limits[1]);
const hasSecondaryLimit = computed(() => Boolean(secondaryLimit.value));
const primaryPercent = computed(() => getPrimaryPercent(props.quota.limits));
const centerValue = computed(() => {
  const limit = primaryLimit.value;

  if (limit?.kind === 'credits' && limit.balanceText) {
    return limit.balanceText;
  }

  return typeof primaryPercent.value === 'number' ? `${primaryPercent.value}%` : 'Unknown';
});
const centerStatus = computed(() => getQuotaStatus(primaryPercent.value));
const radarAngle = computed(() => {
  if (typeof primaryPercent.value !== 'number') {
    return 310;
  }

  return Math.round((primaryPercent.value / 100) * 360) - 90;
});

function getStrokeOffset(limit: QuotaLimit | undefined, circumference: number): number {
  const percent = limit?.remainingPercent;

  if (typeof percent !== 'number') {
    return circumference;
  }

  const normalized = Math.min(Math.max(percent, 0), 100);
  return circumference - (normalized / 100) * circumference;
}

function getStatusClass(status: ProviderStatus | undefined): string {
  return `quota-ring-${status ?? 'unknown'}`;
}
</script>

<template>
  <svg
    class="quota-clock-dial"
    :width="size ?? 96"
    :height="size ?? 96"
    viewBox="0 0 120 120"
    role="img"
    :aria-label="`${quota.providerName} quota ${centerValue}`"
  >
    <defs>
      <filter id="quota-ring-glow" x="-35%" y="-35%" width="170%" height="170%">
        <feGaussianBlur stdDeviation="2.4" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <radialGradient id="quota-core-gradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="rgba(229, 240, 255, 0.22)" />
        <stop offset="100%" stop-color="rgba(56, 189, 248, 0.02)" />
      </radialGradient>
    </defs>

    <g class="quota-ticks" aria-hidden="true">
      <line
        v-for="angle in tickAngles"
        :key="angle"
        x1="60"
        y1="12"
        x2="60"
        y2="16"
        :transform="`rotate(${angle} 60 60)`"
      />
    </g>

    <circle class="quota-ring-track" cx="60" cy="60" :r="radiusOuter" />
    <circle
      :class="['quota-ring-progress', getStatusClass(primaryLimit?.status)]"
      cx="60"
      cy="60"
      :r="radiusOuter"
      :stroke-dasharray="circumferenceOuter"
      :stroke-dashoffset="getStrokeOffset(primaryLimit, circumferenceOuter)"
    />

    <circle
      v-if="hasSecondaryLimit"
      class="quota-ring-track quota-ring-track-inner"
      cx="60"
      cy="60"
      :r="radiusInner"
    />
    <circle
      v-if="hasSecondaryLimit"
      :class="['quota-ring-progress quota-ring-progress-inner', getStatusClass(secondaryLimit?.status)]"
      cx="60"
      cy="60"
      :r="radiusInner"
      :stroke-dasharray="circumferenceInner"
      :stroke-dashoffset="getStrokeOffset(secondaryLimit, circumferenceInner)"
    />

    <circle class="quota-core" cx="60" cy="60" r="23" />
    <line
      :class="['quota-radar-hand', getStatusClass(centerStatus)]"
      x1="60"
      y1="60"
      x2="60"
      y2="26"
      :transform="`rotate(${radarAngle} 60 60)`"
    />
    <circle :class="['quota-core-dot', getStatusClass(centerStatus)]" cx="60" cy="60" r="3.5" />

    <text :class="['quota-dial-value', getStatusClass(centerStatus)]" x="60" y="65" text-anchor="middle">
      {{ centerValue }}
    </text>
  </svg>
</template>
