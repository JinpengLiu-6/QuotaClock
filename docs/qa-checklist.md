# QuotaClock QA Checklist

Use this checklist before merging a Chrome extension MVP branch.

## A. Extension Loading

- [ ] Run `npm run rebuild`.
- [ ] Open `chrome://extensions`.
- [ ] Enable Developer mode.
- [ ] Load unpacked `dist`.
- [ ] Extension popup opens.
- [ ] No manifest error appears.
- [ ] No popup console error appears.

## B. Popup Scan

- [ ] Open `https://chatgpt.com/`.
- [ ] Open Settings > Rate limits remaining.
- [ ] Click popup Scan.
- [ ] Codex card source changes from `mock` to `dom`.
- [ ] 5h and Weekly values display correctly.
- [ ] Error message appears when the Rate limits panel is not open.

## C. HUD Injection

- [ ] Open `https://chatgpt.com/`.
- [ ] HUD appears near top-right.
- [ ] HUD does not cover the input box.
- [ ] HUD does not cover sidebar controls.
- [ ] HUD appears only once.
- [ ] Refresh the page.
- [ ] HUD still appears only once.

## D. HUD Interaction

- [ ] Click HUD to expand.
- [ ] Click Collapse to collapse.
- [ ] Click Scan inside HUD.
- [ ] Scan success updates HUD.
- [ ] Scan failure shows a clear message.
- [ ] Drag HUD to a new position.
- [ ] Refresh page.
- [ ] HUD position persists.
- [ ] Dragging should not toggle expand/collapse.

## E. ChatGPT Navigation

- [ ] Switch between chats.
- [ ] Start a new chat.
- [ ] Reload page.
- [ ] HUD remains available.
- [ ] HUD is not duplicated.

## F. Privacy

- [ ] No network request is made by QuotaClock.
- [ ] No chat content is saved.
- [ ] Only `quota:codex` and `hud:position` are stored for the Codex scan and HUD placement.

## G. Visual QA

- [ ] Popup height is not clipped.
- [ ] Provider list scrolls correctly.
- [ ] HUD is readable in ChatGPT light mode.
- [ ] HUD is readable in ChatGPT dark mode.
- [ ] HUD sci-fi style does not hurt readability.
