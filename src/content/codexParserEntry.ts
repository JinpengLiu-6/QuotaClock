import {
  parseCodexQuotaFromDocument,
  parseCodexQuotaFromText,
} from './parsers/codexParser';

export { parseCodexQuotaFromDocument, parseCodexQuotaFromText };

Object.assign(globalThis, {
  __quotaClockParseCodexQuotaFromDocument: parseCodexQuotaFromDocument,
  __quotaClockParseCodexQuotaFromText: parseCodexQuotaFromText,
});
