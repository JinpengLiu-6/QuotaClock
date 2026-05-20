# Testing Guide

This guide covers local Chrome Extension testing for QuotaClock during the mock-data MVP stage.

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

The Scan button currently refreshes mock dashboard state only. It does not read real Codex quota data yet.

Check that each provider card shows:

- Provider name
- Main quota value
- Limit type
- Reset text
- Status
- Recommendation
- QuotaClockDial

## Testing Future Codex Parser

Real Codex quota parsing is a future integration target. When implemented, test it on a ChatGPT/Codex page with the Rate limits remaining panel open.

Expected future test flow:

1. Open `https://chatgpt.com/`.
2. Open the Rate limits remaining panel.
3. Click Scan in QuotaClock.
4. Confirm the parser can read rows like:

```text
Rate limits remaining
5h 99% 4:00 PM
Weekly 100% May 27
```

5. Confirm parsed results are stored locally in `chrome.storage.local`.

## Testing Future ChatGPT HUD

The ChatGPT/Codex HUD is a future integration target. When enabled, test:

- HUD appears only on configured host matches.
- HUD does not block primary page controls.
- HUD can refresh quota state.
- HUD position persists in `chrome.storage.local`.
- Unknown states display helpful recovery text.

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

Real quota reading is not connected in the current mock popup prototype. For the future Codex parser, first open the ChatGPT/Codex Rate limits remaining panel, then scan again.
