import { Router } from 'express';
import { listEmployees, getEmployee, updateEmployee, getMyProfile, updateMyProfile, acceptInferredSkill, rejectInferredSkill } from '../controllers/employee.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.get('/', authenticate, listEmployees);
router.get('/me', authenticate, getMyProfile);
router.get('/me/profile', authenticate, getMyProfile);
router.put('/me', authenticate, updateMyProfile);
router.get('/:id', authenticate, getEmployee);
router.put('/:id', authenticate, updateEmployee);
router.post('/:id/skills/:skillId/accept', authenticate, acceptInferredSkill);
router.post('/:id/skills/:skillId/reject', authenticate, rejectInferredSkill);

export default router;
