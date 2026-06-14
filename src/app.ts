import path from 'path';
import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import { env } from './config/env';
import routes from './routes';
import { notFound, errorHandler } from './middlewares/error.middleware';

export function createApp(): Application {
  const app = express();

  // Security & ops middleware.
  app.use(
    helmet({
      // Allow images served from /uploads to be embedded by the frontend origin.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true,
    })
  );
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  if (!env.isProd) app.use(morgan('dev'));

  // Serve uploaded profile images statically.
  app.use('/uploads', express.static(path.resolve(process.cwd(), env.upload.dir)));

  app.get('/', (_req, res) => {
    res.json({ success: true, message: 'MERN Assignment API', docs: '/api/health' });
  });

  app.use('/api', routes);

  // 404 + centralised error handling (must be last).
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
