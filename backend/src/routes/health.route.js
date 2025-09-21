import { Router } from 'express';
import { checkDb } from '../db/health.js';

const router = Router();

router.get('/db/health', async (_req, res) => {
  try {
    await checkDb();
    res.json({ ok: true, db: 'up' });
  } catch (err) {
    res.status(500).json({
      ok: false,
      db: 'down',
      error: err instanceof Error ? err.message : String(err)
    });
  }
});

export default router;
