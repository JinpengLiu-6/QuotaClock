import { describe, expect, it } from 'vitest';
import { detectProviderPage, isSupportedProviderPage } from './providerDetection';

describe('provider page detection', () => {
  it.each([
    ['https://chatgpt.com/', 'codex', true],
    ['https://chat.openai.com/c/foo', 'codex', true],
    ['https://claude.ai/new', 'claude', false],
    ['https://www.deepseek.com/', 'deepseek', false],
    ['https://chat.qwen.ai/', 'qwen', false],
  ])('detects %s', (url, providerId, supportsDomScan) => {
    expect(detectProviderPage(url)).toMatchObject({
      providerId,
      supportsDomScan,
    });
  });

  it('returns null for unsupported pages', () => {
    expect(detectProviderPage('https://example.com/')).toBeNull();
    expect(isSupportedProviderPage('https://example.com/')).toBe(false);
  });
});
