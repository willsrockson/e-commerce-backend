import pino from 'pino';
import { ENVIRONMENT } from '../../config/constants.js';

const isDev = process.env.NODE_ENV === ENVIRONMENT.DEV;

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined, // Raw JSON in Prod
});