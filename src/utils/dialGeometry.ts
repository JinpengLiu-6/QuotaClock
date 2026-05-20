export interface Point {
  x: number;
  y: number;
}

export interface EnergyParticle {
  angle: number;
  radius: number;
  size: number;
  color: 'cyan' | 'orange' | 'violet' | 'slate';
  opacity: number;
  delay: number;
}

export interface ClockTick {
  angle: number;
  innerRadius: number;
  outerRadius: number;
  major: boolean;
}

export const energyParticles: EnergyParticle[] = [
  { angle: 8, radius: 52, size: 1.3, color: 'cyan', opacity: 0.9, delay: 0 },
  { angle: 28, radius: 49, size: 0.8, color: 'orange', opacity: 0.72, delay: 0.2 },
  { angle: 47, radius: 54, size: 1.1, color: 'violet', opacity: 0.64, delay: 0.1 },
  { angle: 71, radius: 48, size: 0.7, color: 'cyan', opacity: 0.78, delay: 0.35 },
  { angle: 96, radius: 53, size: 1.4, color: 'cyan', opacity: 0.82, delay: 0.5 },
  { angle: 116, radius: 50, size: 0.8, color: 'slate', opacity: 0.5, delay: 0.15 },
  { angle: 139, radius: 55, size: 1, color: 'orange', opacity: 0.7, delay: 0.42 },
  { angle: 161, radius: 49, size: 0.7, color: 'cyan', opacity: 0.64, delay: 0.24 },
  { angle: 184, radius: 53, size: 1.2, color: 'violet', opacity: 0.66, delay: 0.62 },
  { angle: 207, radius: 48, size: 0.9, color: 'cyan', opacity: 0.7, delay: 0.12 },
  { angle: 231, radius: 54, size: 1.4, color: 'orange', opacity: 0.82, delay: 0.34 },
  { angle: 252, radius: 49, size: 0.7, color: 'slate', opacity: 0.48, delay: 0.55 },
  { angle: 276, radius: 52, size: 1.1, color: 'cyan', opacity: 0.76, delay: 0.28 },
  { angle: 301, radius: 55, size: 0.8, color: 'violet', opacity: 0.64, delay: 0.44 },
  { angle: 322, radius: 48, size: 1, color: 'cyan', opacity: 0.74, delay: 0.18 },
  { angle: 344, radius: 53, size: 0.9, color: 'orange', opacity: 0.68, delay: 0.58 },
];

export const clockTicks: ClockTick[] = Array.from({ length: 12 }, (_, index) => {
  const major = index % 3 === 0;

  return {
    angle: index * 30,
    innerRadius: major ? 45 : 48,
    outerRadius: major ? 53 : 52,
    major,
  };
});

export function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
): Point {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

export function describeArc(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToCartesian(centerX, centerY, radius, endAngle);
  const end = polarToCartesian(centerX, centerY, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    'M',
    start.x.toFixed(3),
    start.y.toFixed(3),
    'A',
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x.toFixed(3),
    end.y.toFixed(3),
  ].join(' ');
}

export function getResetHandAngle(resetAtText?: string): number {
  if (!resetAtText || resetAtText === 'Unknown' || resetAtText === 'Manual') {
    return 42;
  }

  const timeMatch = resetAtText.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (!timeMatch) {
    return 42;
  }

  const rawHour = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2] ?? 0);
  const period = timeMatch[3]?.toUpperCase();
  let hour = rawHour % 12;

  if (period === 'PM') {
    hour += 12;
  }

  const hourOnClock = hour % 12;
  return hourOnClock * 30 + minutes * 0.5;
}
