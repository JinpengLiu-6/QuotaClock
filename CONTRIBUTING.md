# Contributing

Thanks for your interest in QuotaClock.

## Install dependencies

```bash
npm install
```

## Run the project

```bash
npm run dev
```

For a production extension build:

```bash
npm run build
```

Then load the `dist` directory from `chrome://extensions` with Developer mode enabled.

## Submit a PR

1. Create a focused branch from `main`.
2. Make a small, reviewable change.
3. Run `npm run typecheck` and `npm run build`.
4. Open a pull request with a clear description of the change and any testing notes.

## Add a provider adapter

1. Add a provider file in `src/providers`.
2. Implement the `QuotaProviderAdapter` interface from `src/providers/types.ts`.
3. Keep provider logic isolated from UI components.
4. Use local browser storage only unless the project explicitly adds a reviewed integration.
5. Add mock data first, then real detection logic in a separate PR when possible.
