import { createApp } from 'vue';
import HudWidget from '../components/HudWidget.vue';

export function mountHudWidget(root: HTMLElement): void {
  createApp(HudWidget).mount(root);
}

Object.assign(globalThis, {
  __quotaClockMountHudWidget: mountHudWidget,
});
