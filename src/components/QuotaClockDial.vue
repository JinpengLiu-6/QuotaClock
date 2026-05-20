<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  usedPercent: number;
  accentColor: string;
  label: string;
}>();

const normalizedPercent = computed(() => Math.min(Math.max(props.usedPercent, 0), 100));
const remainingPercent = computed(() => 100 - normalizedPercent.value);
const backgroundStyle = computed(() => ({
  background: `conic-gradient(${props.accentColor} ${remainingPercent.value}%, #e6e8ee 0)`,
}));
</script>

<template>
  <div
    class="quota-clock-dial"
    :style="backgroundStyle"
    role="img"
    :aria-label="`${label} has ${remainingPercent}% quota remaining`"
  >
    <div class="quota-clock-face">
      <span class="quota-clock-value">{{ remainingPercent }}%</span>
      <span class="quota-clock-caption">left</span>
    </div>
  </div>
</template>
