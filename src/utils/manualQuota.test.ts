import { describe, expect, it } from 'vitest';
import type { ProviderQuota } from '../providers/types';
import { applyManualQuotaUpdate, createManualLimitDrafts } from './manualQuota';

const baseQuota: ProviderQuota = {
  providerId: 'claude',
  providerName: 'Claude',
  limits: [
    {
      id: 'claude-weekly',
      label: 'Weekly',
      kind: 'percentage',
      remainingPercent: 72,
      resetAtText: 'May 27',
      status: 'good',
    },
  ],
  recommendation: 'Large task OK',
  updatedAt: '2026-01-01T00:00:00.000Z',
  source: 'mock',
};

describe('manual quota updates', () => {
  it('creates editable drafts from a provider quota', () => {
    expect(createManualLimitDrafts(baseQuota)).toEqual([
      {
        id: 'claude-weekly',
        remainingPercent: '72',
        balanceText: '',
        resetAtText: 'May 27',
      },
    ]);
  });

  it('applies manual percent, status, recommendation, and source', () => {
    const updated = applyManualQuotaUpdate(
      baseQuota,
      [
        {
          id: 'claude-weekly',
          remainingPercent: '18',
          balanceText: '',
          resetAtText: 'Jun 3',
        },
      ],
      new Date('2026-06-17T12:00:00.000Z'),
    );

    expect(updated).toMatchObject({
      source: 'manual',
      updatedAt: '2026-06-17T12:00:00.000Z',
      recommendation: 'Small tasks only',
      limits: [
        {
          remainingPercent: 18,
          resetAtText: 'Jun 3',
          status: 'critical',
        },
      ],
    });
  });

  it('clamps invalid manual percentages and preserves balance text', () => {
    const updated = applyManualQuotaUpdate(baseQuota, [
      {
        id: 'claude-weekly',
        remainingPercent: '120',
        balanceText: '¥9.5',
        resetAtText: '',
      },
    ]);

    expect(updated.limits[0]).toMatchObject({
      remainingPercent: 100,
      balanceText: '¥9.5',
      resetAtText: undefined,
      status: 'good',
    });
  });
});
