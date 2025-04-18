import { Router } from 'express';
import { config } from '../config';

const router = Router();

// Redirect to the Discord OAuth URL
router.get('/join', (_req, res) => {
  res.redirect(config.oauth);
});

export default router;
