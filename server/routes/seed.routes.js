import { Router } from 'express';
import { seedDatabase, getSeedStatus } from '../controllers/seed.controller.js';

const router = Router();

router.get('/status', getSeedStatus);
router.post('/', seedDatabase);

export default router;
