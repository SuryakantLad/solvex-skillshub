import { Router } from 'express';
import { getAnalytics, getSkillGap } from '../controllers/analytics.controller.js';
import { authenticate, requireHR } from '../middlewares/auth.js';

const router = Router();

router.get('/', authenticate, requireHR, getAnalytics);
router.get('/skill-gap', authenticate, getSkillGap);

export default router;
