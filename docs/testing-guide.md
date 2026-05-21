# Testing Guide

This guide covers local Chrome Extension testing for QuotaClock during the popup MVP stage.

## Testing Popup UI

1. Install dependencies:

```bash
npm install
```

2. Build the extension:

```bash
npm run build
```

3. Open Chrome and go to `chrome://extensions`.
4. Enable Developer mode.
5. Click Load unpacked.
6. Select the generated `dist` directory.
7. Open the QuotaClock popup from the Chrome toolbar.

After changing code, run:

```bash
npm run rebuild
```

Then click the reload icon for QuotaClock in `chrome://extensions` and reopen the popup.

## Testing Mock Providers

The current popup uses mock data for:

- Codex
- Claude
- DeepSeek
- Qwen

Claude, DeepSeek, and Qwen remain mock providers. Codex can be replaced with DOM data when Scan succeeds on a supported ChatGPT/Codex page.

Check that each provider card shows:

- Provider name
- Main quota value
- Limit type
- Reset text
- Status
- Recommendation
- QuotaClockDial

## Testing Codex Scan

Codex quota parsing reads visible page text locally from `document.body.innerText`. It does not upload data or call a backend.

Test flow:

1. Open `https://chatgpt.com/`.
2. Open Settings.
3. Expand the Rate limits remaining panel.
4. Click Scan in QuotaClock.
5. Confirm the Codex card source changes from `mock` to `dom`.
6. Confirm the parser can read rows like:

```text
Rate limits remaining
5h 99% 4:00 PM
Weekly 100% May 27
```

7. Confirm parsed results are stored locally in `chrome.storage.local` with the `quota:codex` key.

## Testing ChatGPT HUD

The ChatGPT/Codex HUD appears on supported ChatGPT pages.

Test flow:

1. Build the extension:

```bash
npm run build
```

2. Load `dist` as an unpacked extension.
3. Open `https://chatgpt.com/`.
4. Confirm the HUD appears near the top-right of the page.
5. Open Settings and expand Rate limits remaining.
6. Click HUD Scan.
7. Confirm the HUD updates with Codex quota values.
8. Open the extension popup and confirm Codex source is `dom`.
9. Drag the HUD to another visible position.
10. Reload the ChatGPT page and confirm the HUD position persists.

Expected behavior:

- HUD appears only on configured host matches.
- HUD defaults to Unknown if no `quota:codex` data exists.
- HUD does not block the main input area.
- HUD can scan visible quota text directly on the page.
- HUD saves quota data and position in `chrome.storage.local`.

## Developer Debugging

### Open the extension popup console

1. Open `chrome://extensions`.
2. Find QuotaClock.
3. Click Details.
4. Click Inspect views next to the popup entry.
5. Open the Console tab.

Use this console for popup Scan errors, Vue runtime errors, and popup storage reads.

### Open the content script console

1. Open `https://chatgpt.com/`.
2. Open Chrome DevTools for the ChatGPT tab.
3. Open the Console tab.
4. Use the execution context selector if needed and choose a QuotaClock/content script context.

Use this console for HUD injection, HUD Scan, and parser behavior on the live page.

### Inspect local extension storage

In the extension popup console or content script console, run:

```js
chrome.storage.local.get(null).then(console.log)
```

Expected Codex keys:

- `quota:codex`
- `hud:position`

QuotaClock should not store chat content.

### Confirm HUD root

On a supported ChatGPT page, run:

```js
document.querySelector("#quotaclock-hud-root")
```

It should return the HUD root element.

### Confirm there is no duplicate HUD

Run:

```js
document.querySelectorAll("#quotaclock-hud-root").length
```

The expected value is `1`.

## Common Issues

### dist directory does not exist

Run:

```bash
npm run build
```

### Extension fails to load

Check that `dist/manifest.json` exists. If it does not, rebuild:

```bash
npm run rebuild
```

### Popup is blank

Open the popup console from `chrome://extensions`, inspect errors, then run:

```bash
npm run build
```

Reload the extension after rebuilding.

### Content script does not work

Confirm `host_permissions` and `content_scripts.matches` in `dist/manifest.json` include the target page URL.

### Scan cannot read quota

Open the ChatGPT/Codex Rate limits remaining panel first, then scan again. If you are not on `chatgpt.com` or `chat.openai.com`, open a supported page before scanning.
