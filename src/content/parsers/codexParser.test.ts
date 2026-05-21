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

  it('supports spaces between numbers and percent symbols', () => {
    const result = parseCodexQuotaFromText(
      'Rate limits remaining\n5h 99 % 4:00 PM\nWeekly 100 % May 27',
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

  it('supports uppercase panel labels and 24-hour reset times', () => {
    const result = parseCodexQuotaFromText(
      'RATE LIMITS REMAINING 5h 12% 16:00 Weekly 88% May 27',
    );

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
  });

  it('supports extra reset text between percent and reset value', () => {
    const result = parseCodexQuotaFromText(
      'Rate limits remaining 5h 45% resets at 4:00 PM Weekly 75% resets on May 27',
    );

    expect(result?.limits).toMatchObject([
      {
        id: 'codex-5h',
        remainingPercent: 45,
        resetAtText: '4:00 PM',
      },
      {
        id: 'codex-weekly',
        remainingPercent: 75,
        resetAtText: 'May 27',
      },
    ]);
  });

  it('supports loose five-hour labels and spaced percent symbols without panel title', () => {
    const result = parseCodexQuotaFromText('5 h\n99 %\n4:00 PM\nWeekly\n100 %\nMay 27');

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

  it('supports reset labels between quota percentages and reset values', () => {
    const result = parseCodexQuotaFromText('5h 99% reset 4:00 PM Weekly 100% reset May 27');

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

  it('supports 5 hours as the short-term quota label', () => {
    const result = parseCodexQuotaFromText('5 hours\n99%\n4:00 PM\nWeekly\n100%\nMay 27');

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

  it('parses quota text without the Rate limits remaining heading', () => {
    const result = parseCodexQuotaFromText('Account usage 5h 64% 8:30 PM Weekly 91% Jun 2');

    expect(result?.limits).toMatchObject([
      {
        id: 'codex-5h',
        remainingPercent: 64,
        resetAtText: '8:30 PM',
      },
      {
        id: 'codex-weekly',
        remainingPercent: 91,
        resetAtText: 'Jun 2',
      },
    ]);
  });
});
