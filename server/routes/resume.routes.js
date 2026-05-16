import { Router } from 'express';
import {
  parseResume, bulkImport, applyResumeDirect,
  submitResumeReview, listResumeReviews,
  approveResumeReview, rejectResumeReview, editApproveResumeReview,
} from '../controllers/resume.controller.js';
import { authenticate, requireHR } from '../middlewares/auth.js';
import { uploadSingle, uploadMultiple } from '../middlewares/upload.js';

const router = Router();

// Employee
router.post('/parse', authenticate, uploadSingle, parseResume);
router.post('/apply', authenticate, applyResumeDirect);
router.post('/submit', authenticate, submitResumeReview);
router.post('/bulk', authenticate, uploadMultiple, bulkImport);

// HR
router.get('/reviews', authenticate, requireHR, listResumeReviews);
router.post('/reviews/:id/approve', authenticate, requireHR, approveResumeReview);
router.post('/reviews/:id/reject', authenticate, requireHR, rejectResumeReview);
router.put('/reviews/:id', authenticate, requireHR, editApproveResumeReview);

export default router;
