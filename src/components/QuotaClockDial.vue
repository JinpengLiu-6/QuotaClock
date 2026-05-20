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

const primaryLimit = computed(() => props.quota.limits[0]);
const secondaryLimit = computed(() => props.quota.limits[1]);
const primaryPercent = computed(() => getPrimaryPercent(props.quota.limits));
const centerValue = computed(() => {
  const limit = primaryLimit.value;

  if (limit?.kind === 'credits' && limit.balanceText) {
    return limit.balanceText;
  }

  return typeof primaryPercent.value === 'number' ? `${primaryPercent.value}%` : 'Unknown';
});
const centerStatus = computed(() => getQuotaStatus(primaryPercent.value));
const hasSecondaryLimit = computed(() => Boolean(secondaryLimit.value));

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
    :width="size ?? 92"
    :height="size ?? 92"
    viewBox="0 0 120 120"
    role="img"
    :aria-label="`${quota.providerName} quota ${centerValue}`"
  >
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

    <text :class="['quota-dial-value', getStatusClass(centerStatus)]" x="60" y="65" text-anchor="middle">
      {{ centerValue }}
    </text>
  </svg>
</template>
