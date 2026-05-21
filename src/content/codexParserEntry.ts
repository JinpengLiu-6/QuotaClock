import {
  extractQuotaCandidateText,
  parseCodexQuotaFromDocument,
  parseCodexQuotaFromText,
} from './parsers/codexParser';

export { extractQuotaCandidateText, parseCodexQuotaFromDocument, parseCodexQuotaFromText };

Object.assign(globalThis, {
  __quotaClockExtractQuotaCandidateText: extractQuotaCandidateText,
  __quotaClockParseCodexQuotaFromDocument: parseCodexQuotaFromDocument,
  __quotaClockParseCodexQuotaFromText: parseCodexQuotaFromText,
});
