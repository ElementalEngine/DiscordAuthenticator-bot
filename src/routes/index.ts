import { Router } from 'express';
import joinRouter from './join';
import { authenticate, registerUser } from '../controllers/auth';

const router = Router();

// 1) Root → redirect to /join
router.get('/', (_req, res) => {
  res.redirect('/join');
});

// 2) /join → kick off OAuth
router.use(joinRouter);

// 3) OAuth2 callback → handle auth and registration
router.get(
  '/auth/callback',
  authenticate,
  registerUser
);

export default router;
