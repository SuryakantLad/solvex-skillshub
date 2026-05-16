import { Router } from 'express';
import { getGitHubData, syncGitHub } from '../controllers/github.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.get('/', authenticate, getGitHubData);
router.post('/sync', authenticate, syncGitHub);

export default router;
