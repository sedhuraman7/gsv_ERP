import express from 'express';
import { getInventory, createInventoryItem, deleteInventoryItem, updateInventoryItem } from '../controllers/inventoryController';

const router = express.Router();

router.get('/', getInventory);
router.post('/', createInventoryItem);
router.delete('/:id', deleteInventoryItem);
router.put('/:id', updateInventoryItem);

export default router;
