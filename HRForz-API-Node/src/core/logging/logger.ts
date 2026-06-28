import pino from 'pino';
import { config } from '../../config';

export const logger = pino({
  level: config.DEBUG ? 'debug' : 'info',
  transport: config.isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  base: {
    env: config.NODE_ENV,
  },
});
