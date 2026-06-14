import { Op } from 'sequelize';
import { User } from '../models/user.model';
import { ApiError } from '../utils/ApiError';
import { cache, cacheKeys } from './cache.service';
import { Meta } from '../utils/ApiResponse';

const LIST_TTL_SECONDS = 30;
const ITEM_TTL_SECONDS = 60;

interface ListParams {
  page: number;
  limit: number;
  search: string;
}

interface ListResult {
  users: User[];
  meta: Meta;
}

/**
 * Paginated, searchable user listing. Results are cached in Redis for a short
 * window and invalidated whenever a user is created/updated/deleted.
 */
export async function listUsers({ page, limit, search }: ListParams): Promise<ListResult> {
  const key = cacheKeys.userList(page, limit, search);
  const cached = await cache.getJson<ListResult>(key);
  if (cached) return cached;

  const where = search
    ? {
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
        ],
      }
    : {};

  const { rows, count } = await User.findAndCountAll({
    where,
    limit,
    offset: (page - 1) * limit,
    order: [['createdAt', 'DESC']],
  });

  const result: ListResult = {
    users: rows,
    meta: {
      page,
      limit,
      total: count,
      totalPages: Math.max(1, Math.ceil(count / limit)),
    },
  };

  await cache.setJson(key, result, LIST_TTL_SECONDS);
  return result;
}

/** Fetch a single user by id (cached). Throws 404 if absent. */
export async function getUserById(id: string): Promise<User> {
  const key = cacheKeys.user(id);
  const cached = await cache.getJson<User>(key);
  if (cached) return cached as User;

  const user = await User.findByPk(id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  await cache.setJson(key, user, ITEM_TTL_SECONDS);
  return user;
}

interface UpdateInput {
  name?: string;
  profileImage?: string | null;
}

/** Update a user's own editable profile fields. */
export async function updateUser(id: string, input: UpdateInput): Promise<User> {
  const user = await User.findByPk(id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (input.name !== undefined) user.name = input.name;
  if (input.profileImage !== undefined) user.profileImage = input.profileImage;
  await user.save();

  await invalidate(id);
  return user;
}

/** Delete a user (admin action). */
export async function deleteUser(id: string): Promise<void> {
  const user = await User.findByPk(id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  await user.destroy();
  await invalidate(id);
}

async function invalidate(id: string): Promise<void> {
  await cache.del(cacheKeys.user(id));
  await cache.delPattern(cacheKeys.userListPattern);
}
