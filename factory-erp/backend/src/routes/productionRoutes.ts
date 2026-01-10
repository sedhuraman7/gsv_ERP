import express from 'express';
import { getProductionOrders, createProductionOrder, updateProductionStatus } from '../controllers/productionController';

const router = express.Router();

router.get('/', getProductionOrders);
router.post('/', createProductionOrder);
router.patch('/:id/status', updateProductionStatus);

export default router;
