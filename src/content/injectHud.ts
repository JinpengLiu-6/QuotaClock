const HUD_ROOT_ID = 'quotaclock-hud-root';
const HUD_ENTRY_PATH = 'content/hudEntry.js';

let hudObserver: MutationObserver | null = null;
let isMountingHud = false;
let hudLoadFailed = false;

export function injectHud(): void {
  if (!isSupportedLocation(window.location.href)) {
    return;
  }

  ensureHudRoot();
  startHudObserver();
}

function ensureHudRoot(): void {
  if (!document.body || document.getElementById(HUD_ROOT_ID) || isMountingHud || hudLoadFailed) {
    return;
  }

  isMountingHud = true;
  const root = document.createElement('div');
  root.id = HUD_ROOT_ID;
  document.body.append(root);
  injectHudStyles();

  void import(/* @vite-ignore */ chrome.runtime.getURL(HUD_ENTRY_PATH))
    .then((module: { mountHudWidget: (root: HTMLElement) => void }) => {
      module.mountHudWidget(root);
    })
    .catch(() => {
      hudLoadFailed = true;
      root.remove();
    })
    .finally(() => {
      isMountingHud = false;
    });
}

function startHudObserver(): void {
  if (hudObserver) {
    return;
  }

  hudObserver = new MutationObserver(() => {
    window.requestAnimationFrame(ensureHudRoot);
  });

  hudObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

function isSupportedLocation(href: string): boolean {
  return href.startsWith('https://chatgpt.com/') || href.startsWith('https://chat.openai.com/');
}

function injectHudStyles(): void {
  const styleId = 'quotaclock-hud-style';
  if (document.getElementById(styleId)) {
    return;
  }

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    #quotaclock-hud-root {
      position: relative;
      z-index: 2147483000;
    }

    .qc-hud {
      position: fixed;
      z-index: 2147483000;
      width: 210px;
      color: #e5f0ff;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      pointer-events: auto;
    }

    .qc-hud,
    .qc-hud * {
      box-sizing: border-box;
    }

    .qc-hud-compact,
    .qc-hud-panel {
      border: 1px solid rgba(56, 189, 248, 0.34);
      background:
        linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(30, 41, 59, 0.82)),
        radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.16), transparent 40%);
      box-shadow:
        0 12px 30px rgba(2, 6, 23, 0.32),
        0 0 18px rgba(34, 211, 238, 0.1);
      backdrop-filter: blur(18px);
    }

    .qc-hud-compact {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto auto;
      align-items: center;
      gap: 7px;
      width: 100%;
      min-height: 34px;
      border-radius: 999px;
      padding: 7px 9px;
      color: #e5f0ff;
      cursor: grab;
      font: inherit;
      user-select: none;
    }

    .qc-hud-dragging .qc-hud-compact {
      cursor: grabbing;
    }

    .qc-hud-dot {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: #22d3ee;
      box-shadow: 0 0 14px rgba(34, 211, 238, 0.7);
    }

    .qc-hud-name {
      overflow: hidden;
      color: #94a3b8;
      font-size: 12px;
      font-weight: 850;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .qc-hud-compact strong {
      color: #e5f0ff;
      font-size: 12px;
      font-weight: 950;
    }

    .qc-hud-compact small {
      color: #94a3b8;
      font-size: 10px;
      font-weight: 850;
      text-transform: lowercase;
    }

    .qc-hud-panel {
      margin-top: 8px;
      border-radius: 10px;
      padding: 10px;
    }

    .qc-hud-panel-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 8px;
    }

    .qc-hud-panel-head p,
    .qc-hud-panel-head span,
    .qc-hud-recommendation,
    .qc-hud-meta,
    .qc-hud-note {
      margin: 0;
    }

    .qc-hud-panel-head p {
      color: #e5f0ff;
      font-size: 14px;
      font-weight: 950;
    }

    .qc-hud-panel-head span,
    .qc-hud-meta {
      color: #94a3b8;
      font-size: 11px;
      font-weight: 750;
    }

    .qc-hud-link-button {
      border: 0;
      padding: 0;
      color: #67e8f9;
      background: transparent;
      cursor: pointer;
      font: inherit;
      font-size: 11px;
      font-weight: 850;
    }

    .qc-hud-limit-list {
      display: grid;
      gap: 5px;
    }

    .qc-hud-limit {
      display: grid;
      grid-template-columns: 54px 1fr;
      gap: 4px 8px;
      border-top: 1px solid rgba(148, 163, 184, 0.16);
      padding-top: 5px;
      color: #94a3b8;
      font-size: 11px;
    }

    .qc-hud-limit strong {
      color: #e5f0ff;
      text-align: right;
    }

    .qc-hud-limit small {
      grid-column: 1 / -1;
      color: #64748b;
      text-align: right;
    }

    .qc-hud-recommendation,
    .qc-hud-note {
      margin-top: 8px;
      color: #cbd5e1;
      font-size: 11px;
      line-height: 1.35;
    }

    .qc-hud-note {
      color: #fde68a;
    }

    .qc-hud-scan {
      width: 100%;
      margin-top: 9px;
      border: 1px solid rgba(56, 189, 248, 0.42);
      border-radius: 8px;
      padding: 7px 10px;
      color: #e5f0ff;
      background: rgba(15, 23, 42, 0.74);
      cursor: pointer;
      font: inherit;
      font-size: 12px;
      font-weight: 900;
    }

    .qc-hud button:focus-visible {
      outline: 2px solid rgba(56, 189, 248, 0.42);
      outline-offset: 2px;
    }
  `;
  document.documentElement.append(style);
}
