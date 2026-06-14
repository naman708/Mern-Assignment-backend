import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { syncModels } from './models';

async function bootstrap(): Promise<void> {
  // Establish infrastructure connections before accepting traffic.
  await connectDatabase();
  await syncModels();

  try {
    await connectRedis();
  } catch (err) {
    // Redis is used for caching/tokens; the API can still serve auth flows that
    // don't depend on it, so we warn rather than crash on a cold Redis.
    logger.warn('Redis unavailable at startup — caching disabled:', (err as Error).message);
  }

  const app = createApp();
  const server = app.listen(env.port, () => {
    logger.info(`Server listening on port ${env.port} (${env.nodeEnv})`);
  });

  const shutdown = (signal: string) => {
    logger.info(`${signal} received — shutting down`);
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  logger.error('Fatal startup error:', err);
  process.exit(1);
});
