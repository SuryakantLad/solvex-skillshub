import { Router } from 'express';
import { parseResume, bulkImport } from '../controllers/resume.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { uploadSingle, uploadMultiple } from '../middlewares/upload.js';

const router = Router();

router.post('/parse', authenticate, uploadSingle, parseResume);
router.post('/bulk', authenticate, uploadMultiple, bulkImport);

export default router;
