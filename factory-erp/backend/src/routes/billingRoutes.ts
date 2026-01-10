import express from 'express';
import { getInvoices, createInvoice, getInvoiceById } from '../controllers/billingController';

const router = express.Router();

router.get('/', getInvoices);
router.post('/', createInvoice);
router.get('/:id', getInvoiceById);

export default router;
