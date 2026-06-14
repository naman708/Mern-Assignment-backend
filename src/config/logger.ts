/* eslint-disable no-console */

/**
 * Minimal structured logger. Keeps a single import surface so we can later swap
 * in winston/pino without touching call sites.
 */
function format(level: string, args: unknown[]): unknown[] {
  const timestamp = new Date().toISOString();
  return [`[${timestamp}] [${level}]`, ...args];
}

export const logger = {
  info: (...args: unknown[]) => console.log(...format('INFO', args)),
  warn: (...args: unknown[]) => console.warn(...format('WARN', args)),
  error: (...args: unknown[]) => console.error(...format('ERROR', args)),
  debug: (...args: unknown[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(...format('DEBUG', args));
    }
  },
};
