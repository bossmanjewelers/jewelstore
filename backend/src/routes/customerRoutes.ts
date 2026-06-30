import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as cust from '../controllers/customerController';

const router = Router();

router.use(authenticate);

router.get('/', cust.getCustomers);
router.get('/birthdays', cust.getUpcomingBirthdays);
router.get('/:id', cust.getCustomer);
router.post('/', cust.createCustomer);
router.put('/:id', cust.updateCustomer);
router.delete('/:id', authorize('ADMIN', 'MANAGER'), cust.deleteCustomer);
router.get('/:id/balance', cust.getCustomerBalance);
router.post('/:id/payment', cust.recordPayment);

export default router;
