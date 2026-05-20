<script setup lang="ts">
import QuotaClockDial from './QuotaClockDial.vue';
import type { ProviderQuota } from '../providers/types';
import { formatStatus, getPrimaryPercent, getWorstStatus } from '../utils/quotaStatus';

const props = defineProps<{
  quota: ProviderQuota;
}>();

function formatMainQuota(quota: ProviderQuota): string {
  const primaryLimit = quota.limits[0];
  if (primaryLimit?.kind === 'credits' && primaryLimit.balanceText) {
    return primaryLimit.balanceText;
  }

  const percent = getPrimaryPercent(quota.limits);
  if (typeof percent === 'number') {
    return `${percent}%`;
  }

  const balance = quota.limits.find((limit) => limit.balanceText)?.balanceText;
  return balance ?? 'Unknown';
}

function getLimitValue(limit: ProviderQuota['limits'][number]): string {
  if (typeof limit.remainingPercent === 'number') {
    return `${limit.remainingPercent}%`;
  }

  return limit.balanceText ?? 'Unknown';
}

function formatLimitKind(kind: ProviderQuota['limits'][number]['kind']): string {
  const labels: Record<ProviderQuota['limits'][number]['kind'], string> = {
    percentage: 'Quota',
    credits: 'Credits',
    tokens: 'Tokens',
    rate: 'Rate',
    status: 'Status',
  };

  return labels[kind];
}

const status = getWorstStatus(props.quota.limits);
</script>

<template>
  <article class="provider-card">
    <div class="provider-summary">
      <QuotaClockDial :quota="quota" />

      <div class="provider-copy">
        <div class="provider-title-row">
          <h2>{{ quota.providerName }}</h2>
          <span class="status-chip" :data-status="status">{{ formatStatus(status) }}</span>
        </div>
        <p class="provider-main">{{ formatMainQuota(quota) }}</p>
        <p class="provider-kind">{{ quota.limits.map((limit) => limit.label).join(' + ') }}</p>
        <p class="provider-recommendation">{{ quota.recommendation }}</p>
      </div>
    </div>

    <dl class="limit-list">
      <div v-for="limit in quota.limits" :key="limit.id" class="limit-row">
        <dt>
          <span>{{ limit.label }}</span>
          <small>{{ formatLimitKind(limit.kind) }}</small>
        </dt>
        <dd>
          <span>{{ getLimitValue(limit) }}</span>
          <span>reset {{ limit.resetAtText ?? 'Unknown' }}</span>
        </dd>
      </div>
    </dl>
  </article>
</template>
