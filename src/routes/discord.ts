import { Router } from 'express';
import { getAccessToken, getProfile, getConnections } from '../controllers/discord.js';

const router = Router();

// Exchange OAuth code for token
router.get('/token', getAccessToken);
router.get('/profile', getProfile);
router.get('/connections', getConnections);

export default router;
