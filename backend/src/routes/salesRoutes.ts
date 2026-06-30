import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as sales from '../controllers/salesController';

const router = Router();

router.use(authenticate);

router.get('/dashboard', sales.getDashboardStats);
router.get('/report', sales.getSalesReport);
router.get('/', sales.getSales);
router.get('/:id', sales.getSale);
router.post('/', sales.createSale);
router.patch('/:id/status', authorize('ADMIN', 'MANAGER'), sales.updateSaleStatus);

export default router;
