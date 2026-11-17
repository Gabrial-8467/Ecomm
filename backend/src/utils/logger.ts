import { env } from '../config/env.js';

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

function write(level: LogLevel, args: unknown[]): void {
  const prefix = `[${new Date().toISOString()}] [${level}]`;

  if (level === 'ERROR') {
    console.error(prefix, ...args);
  } else if (level === 'WARN') {
    console.warn(prefix, ...args);
  } else {
    console.log(prefix, ...args);
  }
}

export const logger = {
  info: (...args: unknown[]) => write('INFO', args),
  warn: (...args: unknown[]) => write('WARN', args),
  error: (...args: unknown[]) => write('ERROR', args),
  debug: (...args: unknown[]) => {
    if (env.NODE_ENV !== 'production') {
      write('DEBUG', args);
    }
  },
};
