import { describe, expect, it } from 'vitest';
import { parseCodexQuotaFromText } from './codexParser';

describe('parseCodexQuotaFromText', () => {
  it('extracts 5h and weekly quota rows from multiline panel text', () => {
    const result = parseCodexQuotaFromText(
      'Rate limits remaining\n5h 99% 4:00 PM\nWeekly 100% May 27',
    );

    expect(result).toMatchObject({
      providerId: 'codex',
      providerName: 'Codex',
      source: 'dom',
      limits: [
        {
          id: 'codex-5h',
          label: '5h',
          kind: 'percentage',
          remainingPercent: 99,
          resetAtText: '4:00 PM',
          status: 'good',
        },
        {
          id: 'codex-weekly',
          label: 'Weekly',
          kind: 'percentage',
          remainingPercent: 100,
          resetAtText: 'May 27',
          status: 'good',
        },
      ],
    });
    expect(result?.updatedAt).toEqual(expect.any(String));
  });

  it('extracts quota rows from single-line panel text', () => {
    const result = parseCodexQuotaFromText(
      'Rate limits remaining 5h 99% 4:00 PM Weekly 100% May 27',
    );

    expect(result?.limits).toMatchObject([
      {
        id: 'codex-5h',
        remainingPercent: 99,
        resetAtText: '4:00 PM',
      },
      {
        id: 'codex-weekly',
        remainingPercent: 100,
        resetAtText: 'May 27',
      },
    ]);
  });

  it('extracts quota rows when labels, percentages, and resets are on separate lines', () => {
    const result = parseCodexQuotaFromText('5h\n12%\n16:00\nWeekly\n88%\nMay 27');

    expect(result?.limits).toMatchObject([
      {
        id: 'codex-5h',
        remainingPercent: 12,
        resetAtText: '16:00',
        status: 'blocked',
      },
      {
        id: 'codex-weekly',
        remainingPercent: 88,
        resetAtText: 'May 27',
        status: 'good',
      },
    ]);
    expect(result?.recommendation).toBe('Wait reset or switch model');
  });

  it('returns null for invalid text', () => {
    expect(parseCodexQuotaFromText('No quota data here')).toBeNull();
  });
});
