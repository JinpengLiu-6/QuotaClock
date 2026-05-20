# QuotaClock

QuotaClock is a browser extension that shows AI usage limits as beautiful quota clocks.

QuotaClock 是一个用时钟表盘显示 AI 工具使用余量的浏览器插件。

## Features

- Chrome Extension Manifest V3 foundation.
- Vue 3 popup built with TypeScript and Vite.
- Clock-style quota cards for AI providers.
- Local mock quota data for the first runnable version.
- Adapter-friendly provider structure for future integrations.

## Supported Providers

- Codex
- Claude
- DeepSeek
- Qwen

## Roadmap

- Add provider adapters for real quota detection.
- Add content scripts for supported AI websites.
- Add reset-time parsing and usage suggestions.
- Add local storage sync for quota snapshots.
- Add settings for provider visibility and display preferences.

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

Build the extension:

```bash
npm run build
```

## Load unpacked extension

1. Run `npm run build`.
2. Open Chrome and go to `chrome://extensions`.
3. Enable Developer mode.
4. Click Load unpacked.
5. Select the generated `dist` directory.

## Privacy

QuotaClock stores quota data locally in your browser and does not send your data to any server.

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.

## License

MIT
