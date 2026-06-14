import { DataTypes, Model, Optional } from 'sequelize';
import bcrypt from 'bcryptjs';
import { sequelize } from '../config/database';

export type UserRole = 'admin' | 'user';

export interface UserAttributes {
  id: string;
  name: string;
  email: string;
  password: string;
  profileImage: string | null;
  role: UserRole;
  isEmailVerified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Fields that are optional when creating a user (defaults / auto-generated). */
type UserCreationAttributes = Optional<
  UserAttributes,
  'id' | 'profileImage' | 'role' | 'isEmailVerified'
>;

export class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  declare id: string;
  declare name: string;
  declare email: string;
  declare password: string;
  declare profileImage: string | null;
  declare role: UserRole;
  declare isEmailVerified: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  /** Compare a plaintext password against the stored hash. */
  async comparePassword(candidate: string): Promise<boolean> {
    return bcrypt.compare(candidate, this.password);
  }

  /** Never leak the password hash in JSON responses. */
  toJSON(): Omit<UserAttributes, 'password'> {
    const values = { ...this.get() } as UserAttributes;
    delete (values as Partial<UserAttributes>).password;
    return values;
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    profileImage: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('admin', 'user'),
      allowNull: false,
      defaultValue: 'user',
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    hooks: {
      // Hash the password whenever it is set or changed.
      beforeSave: async (user: User) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
        if (user.changed('email') && typeof user.email === 'string') {
          user.email = user.email.toLowerCase().trim();
        }
      },
    },
  }
);
