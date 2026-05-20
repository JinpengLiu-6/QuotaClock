import type { HudPosition, ProviderQuota, RefreshQuotaResponse } from '../providers/types';
import {
  createUnknownCodexQuota,
  getPrimaryPercent,
  loadHudPosition,
  loadProviderQuota,
  saveHudPosition,
  saveProviderQuota,
} from './contentQuota';

const HUD_ROOT_ID = 'quota-clock-hud-root';

export function mountHud(refreshQuota: () => Promise<RefreshQuotaResponse>): void {
  if (!isSupportedLocation(window.location.href) || document.getElementById(HUD_ROOT_ID)) {
    return;
  }

  injectHudStyles();

  const root = document.createElement('aside');
  root.id = HUD_ROOT_ID;
  root.className = 'qc-hud';
  document.documentElement.append(root);

  const state = {
    expanded: false,
    quota: createUnknownCodexQuota(),
    position: { x: 20, y: 88 } satisfies HudPosition,
    message: 'Open settings and refresh',
  };

  void initializeHud(root, state, refreshQuota);
}

async function initializeHud(
  root: HTMLElement,
  state: {
    expanded: boolean;
    quota: ProviderQuota;
    position: HudPosition;
    message: string;
  },
  refreshQuota: () => Promise<RefreshQuotaResponse>,
): Promise<void> {
  const [savedQuota, savedPosition] = await Promise.all([
    loadProviderQuota('codex'),
    loadHudPosition(),
  ]);

  if (savedQuota) {
    state.quota = savedQuota;
    state.message = savedQuota.recommendation;
  }

  if (savedPosition) {
    state.position = savedPosition;
  }

  renderHud(root, state, refreshQuota);
}

function renderHud(
  root: HTMLElement,
  state: {
    expanded: boolean;
    quota: ProviderQuota;
    position: HudPosition;
    message: string;
  },
  refreshQuota: () => Promise<RefreshQuotaResponse>,
): void {
  root.style.left = `${state.position.x}px`;
  root.style.top = `${state.position.y}px`;
  root.innerHTML = '';

  const bar = document.createElement('button');
  bar.className = 'qc-hud-bar';
  bar.type = 'button';
  const barLabel = document.createElement('span');
  barLabel.textContent = 'QuotaClock';
  const barValue = document.createElement('strong');
  barValue.textContent = formatLowestPercent(state.quota);
  bar.append(barLabel, barValue);
  bar.addEventListener('click', () => {
    state.expanded = !state.expanded;
    renderHud(root, state, refreshQuota);
  });
  bar.addEventListener('pointerdown', (event) => startDrag(event, root, state));
  root.append(bar);

  if (!state.expanded) {
    return;
  }

  const panel = document.createElement('div');
  panel.className = 'qc-hud-panel';

  const title = document.createElement('h2');
  title.textContent = 'Codex';
  panel.append(title);

  for (const limit of state.quota.limits) {
    const value =
      typeof limit.remainingPercent === 'number'
        ? `${limit.remainingPercent}%`
        : limit.balanceText ?? 'Unknown';
    const row = document.createElement('div');
    row.className = 'qc-hud-limit';
    const valueNode = document.createElement('span');
    valueNode.textContent = `${limit.label}: ${value}`;
    const resetNode = document.createElement('span');
    resetNode.textContent = `reset ${limit.resetAtText ?? 'Unknown'}`;
    row.append(valueNode, resetNode);
    panel.append(row);
  }

  const recommendation = document.createElement('p');
  recommendation.textContent = `Recommendation: ${state.quota.recommendation}`;
  const note = document.createElement('p');
  note.className = 'qc-hud-note';
  note.textContent = state.message;
  panel.append(recommendation, note);

  const refreshButton = document.createElement('button');
  refreshButton.className = 'qc-secondary-button';
  refreshButton.type = 'button';
  refreshButton.textContent = 'Refresh';
  refreshButton.addEventListener('click', async (event) => {
    event.stopPropagation();
    const response = await refreshQuota();

    if (response.ok && response.quota) {
      state.quota = response.quota;
      state.message = response.quota.recommendation;
      await saveProviderQuota(response.quota);
    } else {
      state.message =
        response.error ?? 'Could not read quota. Please open the Rate limits remaining panel, then refresh again.';
    }

    renderHud(root, state, refreshQuota);
  });

  panel.append(refreshButton);
  root.append(panel);
}

function formatLowestPercent(quota: ProviderQuota): string {
  const percent = getPrimaryPercent(quota.limits);
  return typeof percent === 'number' ? `${percent}%` : 'Unknown';
}

function startDrag(
  event: PointerEvent,
  root: HTMLElement,
  state: { position: HudPosition },
): void {
  const offset = {
    x: event.clientX - state.position.x,
    y: event.clientY - state.position.y,
  };

  const moveHud = (moveEvent: PointerEvent): void => {
    state.position = {
      x: Math.max(8, Math.min(window.innerWidth - 230, moveEvent.clientX - offset.x)),
      y: Math.max(8, Math.min(window.innerHeight - 190, moveEvent.clientY - offset.y)),
    };
    root.style.left = `${state.position.x}px`;
    root.style.top = `${state.position.y}px`;
  };

  const stopDrag = async (): Promise<void> => {
    window.removeEventListener('pointermove', moveHud);
    await saveHudPosition(state.position);
  };

  window.addEventListener('pointermove', moveHud);
  window.addEventListener('pointerup', () => void stopDrag(), { once: true });
}

function isSupportedLocation(href: string): boolean {
  return href.startsWith('https://chatgpt.com/') || href.startsWith('https://chat.openai.com/');
}

function injectHudStyles(): void {
  const styleId = 'quota-clock-hud-style';
  if (document.getElementById(styleId)) {
    return;
  }

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .qc-hud {
      position: fixed;
      z-index: 2147483647;
      width: 184px;
      color: #e5edf8;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .qc-hud * {
      box-sizing: border-box;
    }

    .qc-hud-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 184px;
      border: 1px solid rgb(148 163 184 / 32%);
      border-radius: 999px;
      padding: 8px 11px;
      color: #e5edf8;
      background: rgb(15 23 42 / 92%);
      box-shadow: 0 12px 30px rgb(15 23 42 / 20%);
      font-size: 12px;
      font-weight: 850;
      user-select: none;
      cursor: pointer;
    }

    .qc-hud-bar strong {
      color: #86efac;
      font-size: 13px;
    }

    .qc-hud-panel {
      margin-top: 8px;
      border: 1px solid rgb(148 163 184 / 32%);
      border-radius: 8px;
      padding: 12px;
      background: rgb(15 23 42 / 94%);
      box-shadow: 0 18px 50px rgb(15 23 42 / 28%);
    }

    .qc-hud-panel h2 {
      margin: 0 0 8px;
      color: #ffffff;
      font-size: 15px;
      line-height: 1.2;
    }

    .qc-hud-limit {
      display: flex;
      flex-direction: column;
      gap: 2px;
      border-top: 1px solid rgb(148 163 184 / 20%);
      padding: 7px 0;
      color: #dbeafe;
      font-size: 12px;
    }

    .qc-hud-panel p {
      margin: 8px 0 0;
      color: #cbd5e1;
      font-size: 12px;
      line-height: 1.4;
    }

    .qc-hud-note {
      color: #fde68a;
    }

    .qc-secondary-button {
      width: 100%;
      margin-top: 10px;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 8px 10px;
      color: #ffffff;
      background: #263244;
      font: inherit;
      font-size: 13px;
      font-weight: 800;
      cursor: pointer;
    }
  `;
  document.documentElement.append(style);
}
