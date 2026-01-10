import { Request, Response } from 'express';
import { Delivery } from '../models/Delivery';
import Invoice from '../models/Invoice';
import { User } from '../models/User';

// @desc    Assign a delivery man to an invoice
// @route   POST /api/deliveries/assign
// @access  Admin/Sales
export const assignDelivery = async (req: Request, res: Response) => {
    try {
        const { invoiceId, deliveryManId } = req.body;

        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        const deliveryMan = await User.findById(deliveryManId);
        if (!deliveryMan || deliveryMan.role !== 'delivery_man') {
            return res.status(400).json({ message: 'Invalid delivery man' });
        }

        // Check if already assigned
        const existingDelivery = await Delivery.findOne({ invoiceId });
        if (existingDelivery) {
            return res.status(400).json({ message: 'Delivery already assigned for this invoice' });
        }

        const delivery = await Delivery.create({
            invoiceId,
            deliveryManId,
            customerName: invoice.customer.name,
            customerAddress: invoice.customer.address,
            customerContact: invoice.customer.contact,
            status: 'assigned'
        });

        res.status(201).json(delivery);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get assigned deliveries for the logged-in delivery man
// @route   GET /api/deliveries/mine
// @access  Delivery Man
export const getMyDeliveries = async (req: any, res: Response) => {
    try {
        const deliveries = await Delivery.find({
            deliveryManId: req.user._id,
            status: { $in: ['assigned', 'out_for_delivery'] }
        }).sort('-createdAt');

        res.json(deliveries);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update delivery status and upload proof
// @route   PATCH /api/deliveries/:id/status
// @access  Delivery Man
export const updateDeliveryStatus = async (req: any, res: Response) => {
    try {
        const { status, failedReason, proof } = req.body;
        const deliveryId = req.params.id;

        const delivery = await Delivery.findById(deliveryId);
        if (!delivery) {
            return res.status(404).json({ message: 'Delivery not found' });
        }

        // Verify ownership
        if (delivery.deliveryManId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this delivery' });
        }

        delivery.status = status;

        if (status === 'failed') {
            if (!failedReason) {
                return res.status(400).json({ message: 'Reason is mandatory for failed delivery' });
            }
            delivery.failedReason = failedReason;
        }

        if (status === 'delivered') {
            delivery.deliveredAt = new Date();
            if (proof) {
                delivery.proof = proof;
            }

            // Auto-update Invoice status
            await Invoice.findByIdAndUpdate(delivery.invoiceId, {
                paymentStatus: 'paid' // Or a separate deliveryStatus field if we add it
            });
        }

        await delivery.save();
        res.json(delivery);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all deliveries
// @route   GET /api/deliveries
// @access  Admin/Sales/Accounts
export const getAllDeliveries = async (req: Request, res: Response) => {
    try {
        const deliveries = await Delivery.find()
            .populate('deliveryManId', 'name employeeId')
            .populate('invoiceId', 'invoiceNo date grandTotal')
            .sort('-createdAt');
        res.json(deliveries);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
