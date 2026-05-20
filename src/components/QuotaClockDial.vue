<script setup lang="ts">
import { computed } from 'vue';
import type { ProviderQuota, QuotaLimit, ProviderStatus } from '../providers/types';
import { getPrimaryPercent, getQuotaStatus } from '../utils/quotaStatus';

const props = defineProps<{
  quota: ProviderQuota;
  size?: number;
}>();

const radiusOuter = 45;
const radiusInner = 35;
const circumferenceOuter = 2 * Math.PI * radiusOuter;
const circumferenceInner = 2 * Math.PI * radiusInner;

const primaryLimit = computed(() => props.quota.limits[0]);
const secondaryLimit = computed(() => props.quota.limits[1]);
const primaryPercent = computed(() => getPrimaryPercent(props.quota.limits));
const centerValue = computed(() => {
  const value = primaryPercent.value;
  return typeof value === 'number' ? `${value}%` : primaryLimit.value?.balanceText ?? 'Unknown';
});
const centerStatus = computed(() => getQuotaStatus(primaryPercent.value));

function getStrokeOffset(limit: QuotaLimit | undefined, circumference: number): number {
  const percent = limit?.remainingPercent;
  if (typeof percent !== 'number') {
    return circumference;
  }

  return circumference - (Math.min(Math.max(percent, 0), 100) / 100) * circumference;
}

function getStatusClass(status: ProviderStatus | undefined): string {
  return `quota-ring-${status ?? 'unknown'}`;
}
</script>

<template>
  <svg
    class="quota-clock-dial"
    :width="size ?? 132"
    :height="size ?? 132"
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

    <circle class="quota-ring-track quota-ring-track-inner" cx="60" cy="60" :r="radiusInner" />
    <circle
      :class="['quota-ring-progress', getStatusClass(secondaryLimit?.status)]"
      cx="60"
      cy="60"
      :r="radiusInner"
      :stroke-dasharray="circumferenceInner"
      :stroke-dashoffset="getStrokeOffset(secondaryLimit, circumferenceInner)"
    />

    <text class="quota-dial-name" x="60" y="54" text-anchor="middle">
      {{ quota.providerName }}
    </text>
    <text :class="['quota-dial-value', getStatusClass(centerStatus)]" x="60" y="73" text-anchor="middle">
      {{ centerValue }}
    </text>
  </svg>
</template>
