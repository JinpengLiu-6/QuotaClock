<script setup lang="ts">
import QuotaClockDial from './QuotaClockDial.vue';
import type { QuotaSnapshot } from '../providers/types';
import { getQuotaTone } from '../utils/quotaStatus';

const props = defineProps<{
  provider: QuotaSnapshot;
}>();

const quotaTone = getQuotaTone(props.provider.remainingPercent);
</script>

<template>
  <article class="provider-card">
    <div class="provider-card-header">
      <div>
        <h2>{{ provider.name }}</h2>
        <p>{{ provider.suggestion }}</p>
      </div>
      <span class="provider-tone" :data-tone="quotaTone">{{ quotaTone }}</span>
    </div>

    <QuotaClockDial
      :used-percent="provider.usedPercent"
      :accent-color="provider.accentColor"
      :label="provider.name"
    />

    <footer class="provider-meta">
      <span>{{ provider.remainingLabel }}</span>
      <span>Resets {{ provider.resetLabel }}</span>
    </footer>
  </article>
</template>
