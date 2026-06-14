import { Sequelize } from 'sequelize';
import { env } from './env';
import { logger } from './logger';

/**
 * Single shared Sequelize instance. Prefers DATABASE_URL (managed/hosted MySQL,
 * e.g. Aiven/Railway when deployed on Render) and falls back to discrete vars
 * for local development.
 */
const commonOptions = {
  dialect: 'mysql' as const,
  logging: env.isProd ? false : (msg: string) => logger.debug(msg),
  define: {
    underscored: true,
    freezeTableName: false,
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: env.db.ssl
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {},
};

export const sequelize = env.db.url
  ? new Sequelize(env.db.url, commonOptions)
  : new Sequelize(env.db.name, env.db.user, env.db.password, {
      host: env.db.host,
      port: env.db.port,
      ...commonOptions,
    });

export async function connectDatabase(): Promise<void> {
  await sequelize.authenticate();
  logger.info('MySQL connection established');
}
