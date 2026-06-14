import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface RefreshTokenAttributes {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revoked: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type RefreshTokenCreationAttributes = Optional<
  RefreshTokenAttributes,
  'id' | 'revoked'
>;

/**
 * Persisted refresh tokens enable rotation and server-side revocation (logout).
 * Only the SHA-256 hash of the token is stored, never the raw token.
 */
export class RefreshToken
  extends Model<RefreshTokenAttributes, RefreshTokenCreationAttributes>
  implements RefreshTokenAttributes
{
  declare id: string;
  declare userId: string;
  declare tokenHash: string;
  declare expiresAt: Date;
  declare revoked: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

RefreshToken.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    tokenHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    revoked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'RefreshToken',
    tableName: 'refresh_tokens',
    indexes: [{ fields: ['token_hash'] }, { fields: ['user_id'] }],
  }
);
