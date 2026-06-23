import type { RefreshQuotaResponse, ScanDebugInfo } from '../providers/types';
import { saveProviderQuota } from './contentQuota';
import { injectHud } from './injectHud';
import {
  extractQuotaCandidateText,
  parseCodexQuotaFromDocument,
} from './parsers/codexParser';

interface ContentProviderPageInfo {
  providerName: string;
  supportsDomScan: boolean;
}

injectHud(refreshCodexQuota);

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'GET_PROVIDER_PAGE') {
    sendResponse({
      ok: true,
      page: detectProviderPage(window.location.href),
    });
    return false;
  }

  if (message?.type !== 'REFRESH_QUOTA') {
    return false;
  }

  refreshCodexQuota()
    .then(sendResponse)
    .catch(() => {
      const text = document.body?.innerText ?? '';
      sendResponse({
        ok: false,
        error: 'Could not read quota. Open Rate limits panel and scan again.',
        debug: buildScanDebug(text, Boolean(document.body)),
      } satisfies RefreshQuotaResponse);
    });

  return true;
});

async function refreshCodexQuota(): Promise<RefreshQuotaResponse> {
  const pageInfo = detectProviderPage(window.location.href);

  if (!pageInfo?.supportsDomScan) {
    return {
      ok: false,
      error: pageInfo
        ? `${pageInfo.providerName} detected. Use manual input for now.`
        : 'Please open a supported AI provider page first.',
    };
  }

  const parsed = parseCodexQuotaFromDocument(document);

  if (!parsed) {
    const text = document.body?.innerText ?? '';
    return {
      ok: false,
      error: 'Could not read quota. Open Rate limits panel and scan again.',
      debug: buildScanDebug(text, Boolean(document.body), extractQuotaCandidateText(text)),
    };
  }

  await saveProviderQuota(parsed);

  return {
    ok: true,
    quota: parsed,
  };
}

function buildScanDebug(text: string, hasBody: boolean, matchedSnippet?: string): ScanDebugInfo {
  return {
    hasBody,
    textLength: text.length,
    hasRateLimitsRemaining: /rate\s+limits\s+remaining/i.test(text),
    has5h: /\b5\s*(?:h|hours?)\b/i.test(text),
    hasWeekly: /\bweekly\b/i.test(text),
    matchedSnippet: normalizeDebugSnippet(matchedSnippet),
    nearbySnippet: getNearbySnippet(text),
  };
}

function getNearbySnippet(text: string): string {
  const match =
    text.match(/rate\s+limits\s+remaining/i) ??
    text.match(/\b5\s*(?:h|hours?)\b/i) ??
    text.match(/\bweekly\b/i);

  if (match && typeof match.index === 'number') {
    return sliceAroundIndex(text, match.index, 300);
  }

  return text.slice(Math.max(0, text.length - 800));
}

function normalizeDebugSnippet(snippet?: string): string | undefined {
  if (!snippet) {
    return undefined;
  }

  return snippet.length > 1200 ? `${snippet.slice(0, 1200)}...` : snippet;
}

function sliceAroundIndex(text: string, index: number, radius: number): string {
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + radius);
  return text.slice(start, end);
}

function detectProviderPage(url: string): ContentProviderPageInfo | null {
  if (/^https:\/\/chatgpt\.com(?:\/|$)/i.test(url) || /^https:\/\/chat\.openai\.com(?:\/|$)/i.test(url)) {
    return {
      providerName: 'Codex',
      supportsDomScan: true,
    };
  }

  if (/^https:\/\/claude\.ai(?:\/|$)/i.test(url)) {
    return {
      providerName: 'Claude',
      supportsDomScan: false,
    };
  }

  if (/^https:\/\/www\.deepseek\.com(?:\/|$)/i.test(url)) {
    return {
      providerName: 'DeepSeek',
      supportsDomScan: false,
    };
  }

  if (/^https:\/\/chat\.qwen\.ai(?:\/|$)/i.test(url)) {
    return {
      providerName: 'Qwen',
      supportsDomScan: false,
    };
  }

  return null;
}
