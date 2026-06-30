import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as inv from '../controllers/inventoryController';

const router = Router();

router.use(authenticate);

router.get('/', inv.getInventory);
router.get('/low-stock', inv.getLowStock);
router.get('/:id', inv.getInventoryItem);
router.post('/', authorize('ADMIN', 'MANAGER'), inv.createInventory);
router.put('/:id', authorize('ADMIN', 'MANAGER'), inv.updateInventory);
router.delete('/:id', authorize('ADMIN'), inv.deleteInventory);
router.post('/bulk-import', authorize('ADMIN', 'MANAGER'), inv.bulkImport);

export default router;
