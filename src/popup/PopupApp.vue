<script setup lang="ts">
import ProviderCard from '../components/ProviderCard.vue';
import { getMockQuotaSnapshots } from '../providers';

const providers = getMockQuotaSnapshots();
</script>

<template>
  <main class="popup-shell" aria-label="QuotaClock popup">
    <header class="popup-header">
      <div>
        <p class="eyebrow">AI quota monitor</p>
        <h1>QuotaClock</h1>
      </div>
      <span class="status-pill">Mock data</span>
    </header>

    <section class="provider-grid" aria-label="Provider quota cards">
      <ProviderCard
        v-for="provider in providers"
        :key="provider.id"
        :provider="provider"
      />
    </section>
  </main>
</template>
