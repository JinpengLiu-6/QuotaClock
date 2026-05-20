# QuotaClock

QuotaClock is an open-source Chrome extension that shows AI usage limits as beautiful quota clocks.

QuotaClock 是一个用时钟表盘显示 AI 工具使用余量的浏览器插件。

## Screenshot

Screenshot placeholder: popup dashboard and ChatGPT/Codex HUD previews will be added before the first tagged release.

## Features

- Chrome Extension Manifest V3.
- Vue 3 + TypeScript + Vite popup dashboard.
- ChatGPT/Codex page HUD injected by a content script.
- Codex quota parser based on visible DOM text instead of fragile class names.
- Local-only quota cache with `chrome.storage.local`.
- SVG quota clock with dual-ring support for short-term and weekly limits.
- Mock provider adapters for Claude, DeepSeek, and Qwen.
- No backend, no analytics, no telemetry.

## Supported Providers

- Codex / ChatGPT: MVP DOM parser and HUD.
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

## Load Unpacked Extension

1. Run `npm run build`.
2. Open Chrome and go to `chrome://extensions`.
3. Enable Developer mode.
4. Click Load unpacked.
5. Select the generated `dist` directory.
6. Open `https://chatgpt.com/` and use the QuotaClock popup or HUD refresh button.

For Codex quota detection, open the visible Rate limits remaining panel first, then click Refresh.

## Privacy

QuotaClock stores quota data locally in the browser and does not send it to any server.

QuotaClock does not upload user data, does not use analytics, and does not intentionally read conversation content. The MVP content script reads visible page text only to find quota-related labels such as Rate limits remaining, 5h, Weekly, and percentage values.

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
