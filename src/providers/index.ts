import { claudeProvider } from './claudeProvider';
import { codexProvider } from './codexProvider';
import { deepseekProvider } from './deepseekProvider';
import { qwenProvider } from './qwenProvider';
import type { QuotaProviderAdapter, QuotaSnapshot } from './types';

export const quotaProviders: QuotaProviderAdapter[] = [
  codexProvider,
  claudeProvider,
  deepseekProvider,
  qwenProvider,
];

export function getMockQuotaSnapshots(): QuotaSnapshot[] {
  return [
    {
      id: 'codex',
      name: 'Codex',
      usedPercent: 36,
      remainingPercent: 64,
      remainingLabel: '64% remaining',
      resetLabel: 'in 3h 20m',
      suggestion: 'Good window for coding tasks',
      accentColor: '#3b82f6',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'claude',
      name: 'Claude',
      usedPercent: 58,
      remainingPercent: 42,
      remainingLabel: '42% remaining',
      resetLabel: 'tonight',
      suggestion: 'Save for longer reads',
      accentColor: '#d97706',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'deepseek',
      name: 'DeepSeek',
      usedPercent: 21,
      remainingPercent: 79,
      remainingLabel: '79% remaining',
      resetLabel: 'tomorrow',
      suggestion: 'Plenty left for research',
      accentColor: '#059669',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'qwen',
      name: 'Qwen',
      usedPercent: 72,
      remainingPercent: 28,
      remainingLabel: '28% remaining',
      resetLabel: 'in 6h',
      suggestion: 'Use for shorter prompts',
      accentColor: '#7c3aed',
      updatedAt: new Date().toISOString(),
    },
  ];
}
