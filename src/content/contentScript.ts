import type { ProviderQuota, RefreshQuotaResponse } from '../providers/types';
import { saveProviderQuota } from './contentQuota';
import { injectHud } from './injectHud';

const CODEX_PARSER_ENTRY_PATH = 'content/codexParser.js';

interface CodexParserModule {
  parseCodexQuotaFromDocument(doc?: Document): ProviderQuota | null;
}

injectHud();

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'REFRESH_QUOTA') {
    return false;
  }

  refreshCodexQuota()
    .then(sendResponse)
    .catch(() => {
      sendResponse({
        ok: false,
        error: 'Could not read quota. Open Rate limits panel and scan again.',
      } satisfies RefreshQuotaResponse);
    });

  return true;
});

async function refreshCodexQuota(): Promise<RefreshQuotaResponse> {
  const parser = await loadCodexParser();
  const parsed = parser.parseCodexQuotaFromDocument(document);

  if (!parsed) {
    return {
      ok: false,
      error: 'Could not read quota. Open Rate limits panel and scan again.',
    };
  }

  await saveProviderQuota(parsed);

  return {
    ok: true,
    quota: parsed,
  };
}

async function loadCodexParser(): Promise<CodexParserModule> {
  return import(/* @vite-ignore */ chrome.runtime.getURL(CODEX_PARSER_ENTRY_PATH)) as Promise<CodexParserModule>;
}
