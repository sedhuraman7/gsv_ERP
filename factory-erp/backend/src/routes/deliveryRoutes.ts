import express from 'express';
import {
    assignDelivery,
    getMyDeliveries,
    updateDeliveryStatus,
    getAllDeliveries
} from '../controllers/deliveryController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// All routes are protected
router.use(protect);

// Admin/Sales/Accounts routes
router.get('/', authorize('admin', 'sales_man', 'accounts'), getAllDeliveries);
router.post('/assign', authorize('admin', 'sales_man'), assignDelivery);

// Delivery Man specific routes
router.get('/mine', authorize('delivery_man'), getMyDeliveries);
router.patch('/:id/status', authorize('delivery_man'), updateDeliveryStatus);

export default router;
