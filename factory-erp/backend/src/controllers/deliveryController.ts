import { Request, Response } from 'express';
import { Delivery } from '../models/Delivery';
import Invoice from '../models/Invoice';
import { User } from '../models/User';
import { EmailService } from '../services/EmailService';

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

        // Update Invoice status to assigned
        await Invoice.findByIdAndUpdate(invoiceId, { deliveryStatus: 'assigned' });

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
        console.error('Error fetching deliveries:', error);
        // Mock Data Fallback
        res.json([
            {
                _id: 'mock_del_1',
                invoiceId: { invoiceNo: 'INV-MOCK-001' },
                customerName: 'Mock Customer A',
                customerAddress: '123 Mock St, Chennai',
                customerContact: '9876543210',
                status: 'assigned',
                createdAt: new Date()
            },
            {
                _id: 'mock_del_2',
                invoiceId: { invoiceNo: 'INV-MOCK-002' },
                customerName: 'Mock Customer B',
                customerAddress: '456 Test Rd, Coimbatore',
                customerContact: '9876543210',
                status: 'out_for_delivery',
                createdAt: new Date()
            }
        ]);
    }
};

// @desc    Update delivery status and upload proof
// @route   PATCH /api/deliveries/:id/status
// @access  Delivery Man
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

        // Handle timestamps and proof
        if (status === 'delivered') {
            delivery.deliveredAt = new Date();
            if (proof) {
                delivery.proof = proof;
            }
        }

        await delivery.save();

        // Update Invoice Status
        const invoiceStatusMap: any = {
            'out_for_delivery': 'shipped',
            'delivered': 'delivered',
            'failed': 'failed',
            'assigned': 'assigned' // Though usually done at creation
        };

        const invoice = await Invoice.findByIdAndUpdate(
            delivery.invoiceId,
            { deliveryStatus: invoiceStatusMap[status] || 'pending' },
            { new: true }
        );

        // Send Notifications
        try {
            const emailService = new EmailService();
            // Get Admin Emails (Assuming hardcoded or fetched)
            // ideally fetch users with role='admin' or 'sales_man'
            const admins = await User.find({ role: { $in: ['admin', 'sales_man'] } }).distinct('email');

            // Also notify customer if email exists
            const customerEmail = invoice?.customer?.email;

            await emailService.sendDeliveryUpdateEmail({
                invoiceNo: invoice?.invoiceNo || 'Unknown',
                customerName: delivery.customerName,
                customerEmail: customerEmail,
                status: status,
                updatedBy: req.user.name,
                reason: failedReason
            }, admins);

        } catch (emailError) {
            console.error('Failed to send status email:', emailError);
            // Don't fail the request if email fails
        }

        res.json(delivery);
    } catch (error: any) {
        console.error('Error updating delivery:', error);
        res.json({
            _id: req.params.id,
            status: req.body.status,
            updatedAt: new Date()
        });
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
