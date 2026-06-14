import { sequelize } from '../config/database';
import { User } from './user.model';
import { RefreshToken } from './refreshToken.model';
import { logger } from '../config/logger';

// ─── Associations ────────────────────────────────────────────────────────────
// A user owns many refresh tokens; deleting a user cascades to their tokens.
User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens', onDelete: 'CASCADE' });
RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

/**
 * Sync models to the database. `alter` keeps the schema in step during
 * development without destructive drops. For production migrations you would
 * swap this for sequelize-cli migrations.
 */
export async function syncModels(): Promise<void> {
  await sequelize.sync({ alter: !sequelize.getDialect().includes('prod') });
  logger.info('Models synchronised');
}

export { sequelize, User, RefreshToken };
