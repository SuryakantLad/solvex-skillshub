import { Router } from 'express';
import { buildTeam } from '../controllers/teamBuilder.controller.js';
import { authenticate, requireHR } from '../middlewares/auth.js';

const router = Router();

router.post('/', authenticate, requireHR, buildTeam);

export default router;
