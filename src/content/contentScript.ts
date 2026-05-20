import type { RefreshQuotaResponse } from '../providers/types';
import { codexQuotaFromParsed, saveProviderQuota } from './contentQuota';
import { mountHud } from './injectHud';
import { parseCodexQuotaFromDocument } from './parsers/codexParser';

mountHud(refreshCodexQuota);

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'REFRESH_QUOTA') {
    return false;
  }

  refreshCodexQuota()
    .then(sendResponse)
    .catch(() => {
      sendResponse({
        ok: false,
        error: 'Could not read quota. Please open the Rate limits remaining panel, then refresh again.',
      } satisfies RefreshQuotaResponse);
    });

  return true;
});

async function refreshCodexQuota(): Promise<RefreshQuotaResponse> {
  const parsed = parseCodexQuotaFromDocument();

  if (!parsed) {
    return {
      ok: false,
      error: 'Could not read quota. Please open the Rate limits remaining panel, then refresh again.',
    };
  }

  const quota = codexQuotaFromParsed(parsed);
  await saveProviderQuota(quota);

  return {
    ok: true,
    quota,
  };
}
