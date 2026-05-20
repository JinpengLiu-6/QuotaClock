export type QuotaTone = 'healthy' | 'watch' | 'low';

export function getQuotaTone(remainingPercent: number): QuotaTone {
  if (remainingPercent >= 50) {
    return 'healthy';
  }

  if (remainingPercent >= 25) {
    return 'watch';
  }

  return 'low';
}
