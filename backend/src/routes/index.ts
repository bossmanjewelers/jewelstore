import { Router } from 'express';
import authRoutes from './authRoutes';
import inventoryRoutes from './inventoryRoutes';
import customerRoutes from './customerRoutes';
import salesRoutes from './salesRoutes';
import categoryRoutes from './categoryRoutes';
import supplierRoutes from './supplierRoutes';
import purchaseRoutes from './purchaseRoutes';
import reportRoutes from './reportRoutes';
import settingsRoutes from './settingsRoutes';
import userRoutes from './userRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/customers', customerRoutes);
router.use('/sales', salesRoutes);
router.use('/categories', categoryRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/reports', reportRoutes);
router.use('/settings', settingsRoutes);
router.use('/users', userRoutes);

export default router;
