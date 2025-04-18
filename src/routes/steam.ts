import { Router } from 'express';
import { validateSteam, checkOwnership } from '../controllers/steam.js';

const router = Router();
router.post('/validate', validateSteam);
router.post('/check', checkOwnership);

export default router;
