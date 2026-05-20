import { describe, expect, it } from 'vitest';
import { parseCodexQuotaText } from './codexParser';

describe('parseCodexQuotaText', () => {
  it('extracts 5h and weekly quota rows from the rate limits panel text', () => {
    const result = parseCodexQuotaText(
      'Rate limits remaining\n5h 99% 4:00 PM\nWeekly 100% May 27',
    );

    expect(result).toMatchObject({
      providerId: 'codex',
      limits: [
        {
          type: '5h',
          remainingPercent: 99,
          resetAtText: '4:00 PM',
        },
        {
          type: 'weekly',
          remainingPercent: 100,
          resetAtText: 'May 27',
        },
      ],
    });
    expect(result?.updatedAt).toEqual(expect.any(String));
  });

  it('returns null when quota keywords are missing', () => {
    expect(parseCodexQuotaText('No quota data here')).toBeNull();
  });
});
