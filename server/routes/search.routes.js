import { Router } from 'express';
import { getDepartments, search, chatSearch } from '../controllers/search.controller.js';
import { authenticate, requireHR } from '../middlewares/auth.js';

const router = Router();

router.get('/departments', authenticate, requireHR, getDepartments);
router.post('/', authenticate, requireHR, search);
router.post('/chat', authenticate, requireHR, chatSearch);

export default router;
