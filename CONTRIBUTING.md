# Contributing

Thanks for helping improve QuotaClock.

## Install Dependencies

```bash
npm install
```

## Run The Project

```bash
npm run dev
```

For a production extension build:

```bash
npm run build
```

Then load the `dist` directory from `chrome://extensions` with Developer mode enabled.

## Test Changes

Before opening a PR, run:

```bash
npm run typecheck
npm run test
npm run build
```

## Submit A PR

1. Create a focused branch from `main`.
2. Keep the change small and reviewable.
3. Explain the user-facing behavior and testing notes in the PR description.
4. Avoid analytics, remote logging, or backend calls unless the project explicitly accepts that direction later.

## Add A Provider Adapter

1. Add or update a provider file in `src/providers`.
2. Implement the shared types from `src/providers/types.ts`.
3. Keep provider logic out of Vue components.
4. Store quota state in `chrome.storage.local`.
5. Add parser or adapter tests for fragile extraction logic.
6. Prefer mock data first, then real detection in a separate focused PR.
