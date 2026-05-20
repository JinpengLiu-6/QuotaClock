<script setup lang="ts">
import QuotaClockDial from './QuotaClockDial.vue';
import type { ProviderQuota, QuotaLimit } from '../providers/types';
import { formatStatus, getPrimaryPercent, getWorstStatus } from '../utils/quotaStatus';

const props = defineProps<{
  quota: ProviderQuota;
}>();

const status = getWorstStatus(props.quota.limits);

function formatMainQuota(quota: ProviderQuota): string {
  const primaryLimit = quota.limits[0];

  if (primaryLimit?.kind === 'credits' && primaryLimit.balanceText) {
    return primaryLimit.balanceText;
  }

  const percent = getPrimaryPercent(quota.limits);
  return typeof percent === 'number' ? `${percent}%` : 'Unknown';
}

function getLimitSummary(quota: ProviderQuota): string {
  return quota.limits.map((limit) => limit.label).join(' + ');
}

function getLimitValue(limit: QuotaLimit): string {
  if (typeof limit.remainingPercent === 'number') {
    return `${limit.remainingPercent}%`;
  }

  return limit.balanceText ?? 'Unknown';
}

function isCreditsLimit(limit: QuotaLimit): boolean {
  return limit.kind === 'credits';
}
</script>

<template>
  <article class="provider-card">
    <div class="provider-summary">
      <QuotaClockDial :quota="quota" />

      <div class="provider-copy">
        <div class="provider-title-row">
          <h2>{{ quota.providerName }}</h2>
          <span class="status-line">
            <span class="status-chip" :data-status="status">{{ formatStatus(status) }}</span>
            <span class="source-chip">{{ quota.source }}</span>
          </span>
        </div>

        <p class="provider-main">{{ formatMainQuota(quota) }}</p>
        <p class="provider-kind">{{ getLimitSummary(quota) }}</p>
        <p class="provider-recommendation">{{ quota.recommendation }}</p>
      </div>
    </div>

    <dl class="limit-list">
      <template v-for="limit in quota.limits" :key="limit.id">
        <div v-if="isCreditsLimit(limit)" class="limit-row">
          <dt>Balance</dt>
          <dd>{{ limit.balanceText ?? 'Unknown' }}</dd>
        </div>
        <div v-if="isCreditsLimit(limit)" class="limit-row">
          <dt>Usage</dt>
          <dd>{{ getLimitValue(limit) }}</dd>
        </div>
        <div v-if="isCreditsLimit(limit)" class="limit-row">
          <dt>Reset</dt>
          <dd>{{ limit.resetAtText ?? 'No reset' }}</dd>
        </div>

        <div v-else class="limit-row">
          <dt>{{ limit.label }}</dt>
          <dd>
            <span>{{ getLimitValue(limit) }}</span>
            <span>reset {{ limit.resetAtText ?? 'Unknown' }}</span>
          </dd>
        </div>
      </template>
    </dl>
  </article>
</template>
