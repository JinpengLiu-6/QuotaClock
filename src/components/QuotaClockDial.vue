<script setup lang="ts">
import { computed } from 'vue';
import type { ProviderQuota, QuotaLimit, ProviderStatus } from '../providers/types';
import {
  clockTicks,
  describeArc,
  energyParticles,
  getResetHandAngle,
  polarToCartesian,
} from '../utils/dialGeometry';
import { getPrimaryPercent, getQuotaStatus } from '../utils/quotaStatus';

const props = defineProps<{
  quota: ProviderQuota;
  size?: number;
}>();

const radiusOuter = 43;
const radiusInner = 32;
const circumferenceOuter = 2 * Math.PI * radiusOuter;
const circumferenceInner = 2 * Math.PI * radiusInner;
const warmArc = describeArc(60, 60, 47, 28, 70);
const ghostArc = describeArc(60, 60, 49, 218, 318);

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
const resetHandAngle = computed(() => getResetHandAngle(primaryLimit.value?.resetAtText));

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

function getParticlePoint(angle: number, radius: number) {
  return polarToCartesian(60, 60, radius, angle);
}

function getTickStart(angle: number, radius: number) {
  return polarToCartesian(60, 60, radius, angle);
}

function getTickEnd(angle: number, radius: number) {
  return polarToCartesian(60, 60, radius, angle);
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
      <filter id="quota-ring-glow" x="-45%" y="-45%" width="190%" height="190%">
        <feGaussianBlur stdDeviation="2.4" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <radialGradient id="quota-core-gradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="rgba(34, 211, 238, 0.24)" />
        <stop offset="46%" stop-color="rgba(15, 23, 42, 0.92)" />
        <stop offset="100%" stop-color="rgba(2, 6, 23, 0.96)" />
      </radialGradient>
      <linearGradient id="quota-hand-gradient" x1="60" y1="60" x2="60" y2="20">
        <stop offset="0%" stop-color="rgba(250, 204, 21, 0)" />
        <stop offset="62%" stop-color="#facc15" />
        <stop offset="100%" stop-color="#f97316" />
      </linearGradient>
    </defs>

    <circle class="quota-energy-halo" cx="60" cy="60" r="51" />
    <path class="quota-ghost-arc" :d="ghostArc" />
    <path class="quota-warm-arc" :d="warmArc" />

    <g class="quota-particles" aria-hidden="true">
      <circle
        v-for="particle in energyParticles"
        :key="`${particle.angle}-${particle.radius}`"
        :class="`quota-particle quota-particle-${particle.color}`"
        :cx="getParticlePoint(particle.angle, particle.radius).x"
        :cy="getParticlePoint(particle.angle, particle.radius).y"
        :r="particle.size"
        :style="{ '--particle-opacity': particle.opacity, '--particle-delay': `${particle.delay}s` }"
      />
    </g>

    <g class="quota-ticks" aria-hidden="true">
      <line
        v-for="tick in clockTicks"
        :key="tick.angle"
        :class="{ 'quota-tick-major': tick.major }"
        :x1="getTickStart(tick.angle, tick.innerRadius).x"
        :y1="getTickStart(tick.angle, tick.innerRadius).y"
        :x2="getTickEnd(tick.angle, tick.outerRadius).x"
        :y2="getTickEnd(tick.angle, tick.outerRadius).y"
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
      :class="['quota-ring-fragments', getStatusClass(primaryLimit?.status)]"
      cx="60"
      cy="60"
      :r="radiusOuter + 4"
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
      class="quota-radar-hand"
      x1="60"
      y1="60"
      x2="60"
      y2="26"
      :transform="`rotate(${resetHandAngle} 60 60)`"
    />
    <circle :class="['quota-core-dot', getStatusClass(centerStatus)]" cx="60" cy="60" r="3.5" />

    <text :class="['quota-dial-value', getStatusClass(centerStatus)]" x="60" y="65" text-anchor="middle">
      {{ centerValue }}
    </text>
  </svg>
</template>
