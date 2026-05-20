import type { ProviderQuota, ProviderStatus } from '../providers/types';
import { getPrimaryPercent, getWorstStatus } from './quotaStatus';

export interface TaskSuggestion {
  label: string;
  providerName: string;
  status: ProviderStatus;
}

const statusPriority: ProviderStatus[] = ['good', 'caution', 'critical', 'blocked', 'unknown'];

export function getBestProvider(quotas: ProviderQuota[]): ProviderQuota | null {
  for (const status of statusPriority) {
    const candidates = quotas.filter((quota) => getWorstStatus(quota.limits) === status);

    if (candidates.length === 0) {
      continue;
    }

    if (status === 'good') {
      return candidates.find((quota) => quota.source !== 'mock') ?? candidates[0] ?? null;
    }

    if (status === 'unknown') {
      return null;
    }

    return candidates[0] ?? null;
  }

  return null;
}

export function getBestProviderReason(provider: ProviderQuota): string {
  const status = getWorstStatus(provider.limits);

  if (status === 'unknown') {
    return 'Open the provider page to refresh quota.';
  }

  if (provider.providerId === 'codex' && status === 'good') {
    return 'Large coding tasks are safe. Short-term and weekly quota are healthy.';
  }

  if (provider.providerId === 'claude' && status === 'good') {
    return 'Good option for reasoning and writing tasks.';
  }

  if (provider.providerId === 'deepseek') {
    return status === 'blocked'
      ? 'Credits are limited. Prefer another provider for now.'
      : 'Good for batch or low-cost tasks.';
  }

  if (provider.providerId === 'qwen' && status === 'caution') {
    return 'Usable, but better for medium or smaller tasks.';
  }

  if (status === 'caution') {
    return 'Usable, but better for medium or smaller tasks.';
  }

  if (status === 'critical' || status === 'blocked') {
    return 'Prefer another provider until quota resets.';
  }

  return provider.recommendation;
}

export function getTaskSuggestions(quotas: ProviderQuota[]): TaskSuggestion[] {
  return [
    {
      label: 'Large task',
      ...pickProvider(quotas, ['codex', 'claude'], ['good']),
    },
    {
      label: 'Batch task',
      ...pickProvider(quotas, ['deepseek'], ['good', 'caution', 'critical']),
    },
    {
      label: 'Low-cost task',
      ...pickProvider(quotas, ['deepseek'], ['good', 'caution', 'critical']),
    },
    {
      label: 'Careful',
      ...pickCarefulProvider(quotas),
    },
  ];
}

export function getAttentionMessage(quotas: ProviderQuota[]): string {
  const attentionProvider = quotas.find((quota) =>
    ['caution', 'critical', 'blocked'].includes(getWorstStatus(quota.limits)),
  );

  if (!attentionProvider) {
    return 'All connected providers look healthy.';
  }

  const status = getWorstStatus(attentionProvider.limits);
  const percent = getPrimaryPercent(attentionProvider.limits);
  const quotaText = typeof percent === 'number' ? ` at ${percent}%` : '';

  return `${attentionProvider.providerName} is in ${status} state${quotaText}. Prefer medium tasks or switch provider.`;
}

export function formatCommandStatus(status: ProviderStatus): string {
  if (status === 'good') {
    return 'Healthy';
  }

  if (status === 'critical' || status === 'blocked') {
    return 'Limited';
  }

  if (status === 'unknown') {
    return 'Unknown';
  }

  return 'Caution';
}

function pickProvider(
  quotas: ProviderQuota[],
  providerIds: string[],
  allowedStatuses: ProviderStatus[],
): Omit<TaskSuggestion, 'label'> {
  const preferred = providerIds
    .map((providerId) => quotas.find((quota) => quota.providerId === providerId))
    .find((quota): quota is ProviderQuota =>
      Boolean(quota && allowedStatuses.includes(getWorstStatus(quota.limits))),
    );

  if (preferred) {
    return {
      providerName: preferred.providerName,
      status: getWorstStatus(preferred.limits),
    };
  }

  return {
    providerName: 'Unknown',
    status: 'unknown',
  };
}

function pickCarefulProvider(quotas: ProviderQuota[]): Omit<TaskSuggestion, 'label'> {
  const provider = quotas.find((quota) =>
    ['caution', 'critical'].includes(getWorstStatus(quota.limits)),
  );

  if (!provider) {
    return {
      providerName: 'Unknown',
      status: 'unknown',
    };
  }

  return {
    providerName: provider.providerName,
    status: getWorstStatus(provider.limits),
  };
}
