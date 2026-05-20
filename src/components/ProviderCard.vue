<script setup lang="ts">
import QuotaClockDial from './QuotaClockDial.vue';
import type { ProviderQuota, QuotaLimit } from '../providers/types';
import { formatCommandStatus } from '../utils/recommendation';
import { getPrimaryPercent, getWorstStatus } from '../utils/quotaStatus';

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

function getResetSummary(quota: ProviderQuota): string {
  const reset = quota.limits.find((limit) => limit.resetAtText)?.resetAtText;
  return reset ? `Next reset: ${reset}` : 'Next reset: Unknown';
}

function getLimitValue(limit: QuotaLimit): string {
  if (limit.kind === 'credits' && limit.balanceText) {
    return limit.balanceText;
  }

  if (typeof limit.remainingPercent === 'number') {
    return `${limit.remainingPercent}%`;
  }

  return limit.balanceText ?? 'Unknown';
}
</script>

<template>
  <article class="provider-card">
    <div class="provider-card-top">
      <h3>{{ quota.providerName }}</h3>
      <div class="provider-badges">
        <span class="status-chip" :data-status="status">{{ formatCommandStatus(status) }}</span>
        <span class="source-dot">● {{ quota.source }}</span>
      </div>
    </div>

    <div class="provider-summary">
      <QuotaClockDial :quota="quota" :size="88" />

      <div class="provider-copy">
        <p class="provider-main">{{ formatMainQuota(quota) }}</p>
        <p class="provider-kind">{{ getLimitSummary(quota) }}</p>
        <p class="provider-recommendation">{{ quota.recommendation }}</p>
        <p class="provider-reset">{{ getResetSummary(quota) }}</p>
      </div>
    </div>

    <dl class="limit-list">
      <div v-for="limit in quota.limits" :key="limit.id" class="limit-row">
        <dt>{{ limit.label }}</dt>
        <dd>
          <span>{{ getLimitValue(limit) }}</span>
          <span>{{ limit.resetAtText ?? 'Unknown' }}</span>
        </dd>
      </div>
    </dl>
  </article>
</template>
