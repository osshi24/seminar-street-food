export const MONITORING_NAMESPACE = '/admin/monitoring';

export const MONITORED_QUEUES = [
  'email',
  'commentary-pipeline',
  'store-translation-pipeline',
] as const;

export type MonitoredQueueName = (typeof MONITORED_QUEUES)[number];

export const COLLECT_INTERVAL_MS = 30_000;
export const FLUSH_INTERVAL_MS = 10_000;
export const ALERT_INTERVAL_MS = 60_000;
export const ALERT_COOLDOWN_MS = 15 * 60_000;

export const SKIP_LOG_PREFIXES = ['/api/health', '/api/admin/monitoring/stream'];

export const REQUEST_BUFFER_HARD_CAP = 5_000;
