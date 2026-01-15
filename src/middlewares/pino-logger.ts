import { createMiddleware } from 'hono/factory'
import { randomUUID } from 'crypto'
import { logger } from '../utils/universal/logger.js';

export const pinoLogger = createMiddleware(async (c, next) => {
  const requestId = randomUUID();
  const ip = c.req.header('x-forwarded-for') || c.env?.incoming?.socket?.remoteAddress || 'unknown';

  const child = logger.child({
    requestId,
    ip, 
  });

  c.set('logger', child);
  const start = Date.now();

  await next(); // Run the route logic

  const ms = Date.now() - start;

  child.info({
    method: c.req.method,
    url: c.req.path,
    status: c.res.status,
    elapsed: `${ms}ms`,
  }, 'Request Completed');
})