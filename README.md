# QuotaClock

QuotaClock is an open-source Chrome extension that shows AI usage limits as beautiful quota clocks.

QuotaClock 是一个用时钟表盘显示 AI 工具使用余量的浏览器插件。

## Screenshot

Screenshot placeholder: popup dashboard and ChatGPT/Codex HUD previews will be added before the first tagged release.

## Features

- Chrome Extension Manifest V3.
- Vue 3 + TypeScript + Vite popup dashboard.
- Local-only quota cache with `chrome.storage.local`.
- SVG quota clock with dual-ring support for short-term and weekly limits.
- Mock provider adapters for Codex, Claude, DeepSeek, and Qwen.
- No backend, no analytics, no telemetry.

## Supported Providers

- Codex / ChatGPT: mock popup data in the current UX prototype.
- Claude: mock provider adapter.
- DeepSeek: mock provider adapter.
- Qwen: mock provider adapter.

## Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Run type checking:

```bash
npm run typecheck
```

Run tests:

```bash
npm run test
```

Build the extension:

```bash
npm run build
```

Clean generated output:

```bash
npm run clean
```

Rebuild from scratch:

```bash
npm run rebuild
```

## Local Testing

Install dependencies:

```bash
npm install
```

Build the Chrome extension:

```bash
npm run build
```

Load the unpacked extension in Chrome:

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select the generated `dist` directory.
5. Open the QuotaClock extension popup from the Chrome toolbar.

After changing code:

```bash
npm run rebuild
```

Then return to `chrome://extensions`, click the reload icon on QuotaClock, and reopen the popup.

Current prototype status:

- The popup dashboard starts with mock data for Codex, Claude, DeepSeek, and Qwen.
- Scan can replace Codex mock data with DOM-parsed quota data on supported ChatGPT/Codex pages.
- Claude, DeepSeek, and Qwen remain mock providers.
- The ChatGPT/Codex HUD remains a future testing target.

For a fuller checklist, see [docs/testing-guide.md](./docs/testing-guide.md).

## Load Unpacked Extension

1. Run `npm run build`.
2. Open Chrome and go to `chrome://extensions`.
3. Enable Developer mode.
4. Click Load unpacked.
5. Select the generated `dist` directory.
6. Open the QuotaClock popup from the Chrome toolbar.

At this stage, the popup starts with mock quota data. On `chatgpt.com` or `chat.openai.com`, Scan can read visible Rate limits remaining text and update Codex locally.

## Privacy

QuotaClock stores quota data locally in the browser and does not send it to any server.

QuotaClock does not upload user data, does not use analytics, and does not intentionally read conversation content. The current popup prototype uses mock data only; future Codex quota parsing should read only quota-related labels such as Rate limits remaining, 5h, Weekly, and percentage values.

## Roadmap

### v0.1

- Codex / ChatGPT quota HUD
- Popup dashboard
- Local storage
- Mock providers

### v0.2

- Claude support
- Manual quota input
- Low quota notifications

### v0.3

- DeepSeek / Qwen API balance support
- Usage history chart
- Model recommendation engine

### v1.0

- Multi-provider stable dashboard
- Chrome Web Store release
- Firefox support

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.

## License

MIT
