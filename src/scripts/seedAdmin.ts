import { connectDatabase } from '../config/database';
import { syncModels, User } from '../models';
import { logger } from '../config/logger';

/**
 * Seed (or promote) an admin account so RBAC features can be tested immediately.
 * Run with: npm run seed:admin
 *
 * Override defaults via env: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME.
 */
async function seed(): Promise<void> {
  await connectDatabase();
  await syncModels();

  const email = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'Admin@12345';
  const name = process.env.ADMIN_NAME || 'Administrator';

  const [user, created] = await User.findOrCreate({
    where: { email },
    defaults: { name, email, password, role: 'admin', isEmailVerified: true },
  });

  if (!created) {
    user.role = 'admin';
    user.isEmailVerified = true;
    await user.save();
  }

  logger.info(`Admin ready: ${email} (password: ${password})`);
  process.exit(0);
}

seed().catch((err) => {
  logger.error('Seed failed:', err);
  process.exit(1);
});
