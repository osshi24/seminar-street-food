import { Logger } from '@nestjs/common';

const logger = new Logger('Sentry');

interface SentryLike {
  init: (opts: Record<string, unknown>) => void;
  captureException: (err: unknown) => void;
  withScope: (cb: (scope: { setExtras: (e: Record<string, unknown>) => void }) => void) => void;
}

function loadSentry(): SentryLike | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@sentry/node') as SentryLike;
  } catch {
    return null;
  }
}

export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    logger.log('SENTRY_DSN not set — skipping Sentry initialization');
    return;
  }
  const Sentry = loadSentry();
  if (!Sentry) {
    logger.warn(
      'SENTRY_DSN set but @sentry/node not installed. Run "npm i @sentry/node" inside apps/backend to enable.',
    );
    return;
  }
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
    profilesSampleRate: Number(process.env.SENTRY_PROFILES_SAMPLE_RATE ?? '0'),
  });
  logger.log(`Sentry initialized (env=${process.env.NODE_ENV || 'development'})`);
}

export function captureException(err: unknown, context?: Record<string, unknown>): void {
  const Sentry = loadSentry();
  if (!Sentry) return;
  if (context) {
    Sentry.withScope((scope) => {
      scope.setExtras(context);
      Sentry.captureException(err);
    });
  } else {
    Sentry.captureException(err);
  }
}
