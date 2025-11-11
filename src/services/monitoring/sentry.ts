/**
 * Sentry Error Tracking Configuration
 * Centralized error monitoring and reporting
 */

import * as Sentry from '@sentry/react-native';
import { config } from '@/config';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || 'https://your-sentry-dsn@sentry.io/project-id';

/**
 * Initialize Sentry for error tracking and performance monitoring
 */
export const initSentry = () => {
  if (!SENTRY_DSN || SENTRY_DSN.includes('your-sentry')) {
    console.warn('Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: config.app.environment,
    tracesSampleRate: config.app.environment === 'production' ? 0.1 : 1.0,
    enableAutoSessionTracking: true,
    enableNativeSessionTracking: true,
    integrations: [
      new Sentry.ReactNativeTracing({
        enableNativeFramesTracking: true,
        enableStallTracking: true,
      }),
    ],
    // Only report errors in production
    beforeSend: (event, hint) => {
      if (config.app.environment !== 'production') {
        return event;
      }

      // Filter out certain errors
      if (event.exception) {
        const error = hint.originalException;
        
        // Don't report network cancellations
        if (error?.message?.includes('AbortError')) {
          return null;
        }

        // Don't report test errors
        if (error?.message?.includes('jest')) {
          return null;
        }
      }

      return event;
    },
    // Enable source maps for better stack traces
    attachStacktrace: true,
    maxBreadcrumbs: 100,
  });

  console.log('✅ Sentry initialized for error tracking');
};

/**
 * Capture exception with additional context
 */
export const captureException = (error: Error, context?: Record<string, any>) => {
  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
};

/**
 * Capture message with severity level
 */
export const captureMessage = (
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info'
) => {
  Sentry.captureMessage(message, level);
};

/**
 * Add breadcrumb for tracking user actions
 */
export const addBreadcrumb = (
  message: string,
  category: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info'
) => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    timestamp: Date.now() / 1000,
  });
};

/**
 * Set user context for error tracking
 */
export const setUserContext = (userId: string, email?: string, username?: string) => {
  Sentry.setUser({
    id: userId,
    email,
    username,
  });
};

/**
 * Clear user context (on logout)
 */
export const clearUserContext = () => {
  Sentry.setUser(null);
};

/**
 * Start performance transaction
 */
export const startTransaction = (name: string, op: string = 'http.client') => {
  return Sentry.startTransaction({
    name,
    op,
  });
};

/**
 * Report API call
 */
export const reportApiCall = (method: string, endpoint: string, duration: number, statusCode: number) => {
  Sentry.captureMessage(`API: ${method} ${endpoint} - ${statusCode} (${duration}ms)`, 'info');
  
  addBreadcrumb(
    `${method} ${endpoint} - ${statusCode}`,
    'api',
    statusCode >= 400 ? 'error' : 'info'
  );
};

/**
 * Report authentication event
 */
export const reportAuthEvent = (event: 'login' | 'logout' | 'register' | 'failed_login', details?: Record<string, any>) => {
  addBreadcrumb(
    `Authentication: ${event}`,
    'auth',
    event === 'failed_login' ? 'warning' : 'info'
  );

  if (details) {
    Sentry.withScope((scope) => {
      scope.setContext('auth_event', details);
      Sentry.captureMessage(`Auth event: ${event}`, 'info');
    });
  }
};

/**
 * Report game event
 */
export const reportGameEvent = (
  event: 'start' | 'complete' | 'abandon' | 'error',
  gameMode?: string,
  details?: Record<string, any>
) => {
  addBreadcrumb(
    `Game: ${event}${gameMode ? ` (${gameMode})` : ''}`,
    'game',
    event === 'error' ? 'error' : 'info'
  );

  if (details) {
    Sentry.withScope((scope) => {
      scope.setContext('game_event', { event, gameMode, ...details });
      Sentry.captureMessage(`Game event: ${event}`, 'info');
    });
  }
};

/**
 * Report payment event
 */
export const reportPaymentEvent = (
  event: 'initiated' | 'success' | 'failed' | 'cancelled',
  amount?: number,
  details?: Record<string, any>
) => {
  addBreadcrumb(
    `Payment: ${event}${amount ? ` - ${amount}` : ''}`,
    'payment',
    event === 'failed' ? 'error' : 'info'
  );

  if (details) {
    Sentry.withScope((scope) => {
      scope.setContext('payment_event', { event, amount, ...details });
      Sentry.captureMessage(`Payment event: ${event}`, event === 'failed' ? 'error' : 'info');
    });
  }
};

export default Sentry;
