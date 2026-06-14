import { Router } from 'express';

const router = Router();

/**
 * Routers are mounted lazily (required at mount time rather than eagerly at the
 * top of the module). This keeps the dependency graph of each feature isolated
 * and avoids loading a route's controller/service chain until the API is wired.
 */
router.use('/auth', require('./auth.routes').default);
router.use('/users', require('./user.routes').default);

router.get('/health', (_req, res) => {
  res.json({ success: true, status: 'ok' });
});

export default router;
