import { Request, Response } from 'express';
import Invoice from '../models/Invoice';
import { User } from '../models/User';
import { FinishedProduct, StockMovement } from '../models/Inventory';
import { EmailService } from '../services/EmailService';
import mongoose from 'mongoose';
import Transaction from '../models/Transaction';

const emailService = new EmailService();

export const getInvoices = async (req: Request, res: Response) => {
    try {
        const invoices = await Invoice.find().sort({ createdAt: -1 });
        res.status(200).json(invoices);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createInvoice = async (req: Request, res: Response) => {
    try {
        const data = req.body;

        // Handle simplified frontend payload
        if (data.customerName) { // Simplified check, assumes mostly new structure
            // 1. Find User/Fallback
            const adminUser = await User.findOne();
            const fallbackId = adminUser ? adminUser._id : "507f1f77bcf86cd799439011";

            const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;
            const itemsCount = Number(data.items) || 1;
            const totalAmount = Number(data.totalAmount || data.amount || 0);

            // 2. STOCK UPDATE & MOVEMENT (Inventory Linking)
            if (data.selectedProductId) {
                const isMongoId = data.selectedProductId.match(/^[0-9a-fA-F]{24}$/);
                const query = isMongoId ? { _id: data.selectedProductId } : { productCode: data.selectedProductId };

                const product = await FinishedProduct.findOneAndUpdate(
                    query,
                    { $inc: { "stock.mainStore": -itemsCount } },
                    { new: true } // Return updated doc
                );

                if (product) {
                    // Create Stock Movement (Sales Out)
                    await StockMovement.create({
                        referenceNo: invoiceNo,
                        date: new Date(),
                        itemType: 'finished',
                        itemId: product._id,
                        itemCode: product.productCode,
                        itemName: product.name,
                        quantity: itemsCount,
                        unit: product.unit,
                        fromLocation: 'main_store',
                        toLocation: 'customer',
                        movementType: 'sales',
                        issuedBy: adminUser?._id || "507f1f77bcf86cd799439011",
                        department: 'sales',
                        remarks: `Invoice generated: ${invoiceNo}`
                    });
                }
            }

            // 3. CUSTOMER UPDATE & LEDGER (Accounting)
            const CustomerModel = (await import('../models/Customer')).default;
            let customerId = data.customerId;

            if (data.customerId || data.customerName) {
                const customer = await CustomerModel.findOneAndUpdate(
                    { $or: [{ _id: data.customerId }, { name: data.customerName }] },
                    {
                        $inc: { totalOrders: 1, totalValue: totalAmount },
                        $set: { lastOrderDate: new Date() }
                    },
                    { new: true }
                );

                if (customer) {
                    customerId = customer._id;
                    // Create Accounting Transaction (Debit Customer)
                    await Transaction.create({
                        transactionId: `TXN-${Date.now()}`,
                        date: new Date(),
                        type: 'invoice',
                        partyType: 'customer',
                        partyId: customer._id,
                        partyName: customer.name,
                        description: `Invoice ${invoiceNo}`,
                        amount: totalAmount,
                        isDebit: true, // Receivable
                        referenceId: null, // Will be updated after invoice save
                        category: 'Sales'
                    });

                    // If Paid immediately, create Payment Transaction
                    if (data.status === 'paid') {
                        await Transaction.create({
                            transactionId: `TXN-PAY-${Date.now()}`,
                            date: new Date(),
                            type: 'payment',
                            partyType: 'customer',
                            partyId: customer._id,
                            partyName: customer.name,
                            description: `Payment for Invoice ${invoiceNo}`,
                            amount: totalAmount,
                            isDebit: false, // Credit (They paid us)
                            referenceId: null, // Will be updated after invoice save
                            category: 'Cash' // Assuming Cash/Bank for now
                        });
                    }
                }
            }

            const newInvoice = new Invoice({
                invoiceNo: invoiceNo,
                date: data.date ? new Date(data.date) : new Date(),
                customer: {
                    name: data.customerName,
                    gstin: data.gstin || 'N/A',
                    state: 'Tamil Nadu',
                    address: 'Counter Sale',
                    contact: 'N/A'
                },
                items: [{
                    productId: fallbackId,
                    productCode: data.selectedProductId || 'GEN-001',
                    description: 'Product Sale',
                    quantity: itemsCount,
                    unit: 'nos',
                    rate: data.unitPrice,
                    gstPercentage: 18,
                }],
                paymentStatus: data.status ? data.status.toLowerCase() : 'pending',
                createdBy: fallbackId,
                grandTotal: totalAmount,
                deliveryStatus: 'pending' // Initialize delivery status
            });

            const savedInvoice = await newInvoice.save();

            // Post-save: Update Transaction reference if created before
            if (customerId) {
                // Update Invoice Transaction
                await Transaction.findOneAndUpdate(
                    { description: `Invoice ${invoiceNo}` },
                    { referenceId: savedInvoice._id }
                );

                // Update Payment Transaction (if exists)
                await Transaction.findOneAndUpdate(
                    { description: `Payment for Invoice ${invoiceNo}` },
                    { referenceId: savedInvoice._id }
                );
            }

            // 4. DELIVERY TASK LINKING
            // We rely on the Invoice "deliveryStatus: 'pending'" field.
            // The actual Delivery record is created when a Delivery Man is assigned via the UI.
            console.log('✅ Invoice created. Ready for delivery assignment.');

            // Send Email Notification
            if (data.customerEmail) {
                try {
                    const mockPdfBuffer = Buffer.from(`Invoice ${savedInvoice.invoiceNo} Details...`);
                    await emailService.sendInvoiceEmail(
                        { name: data.customerName, email: data.customerEmail },
                        {
                            invoiceNo: savedInvoice.invoiceNo,
                            date: savedInvoice.date,
                            amount: savedInvoice.grandTotal,
                            pdfBuffer: mockPdfBuffer
                        }
                    );
                } catch (emailErr) {
                    console.error("Failed to send invoice email:", emailErr);
                }
            }

            return res.status(201).json(savedInvoice);
        }

        const newInvoice = new Invoice(req.body);
        const savedInvoice = await newInvoice.save();
        res.status(201).json(savedInvoice);
    } catch (error: any) {
        console.error("Create Invoice Error:", error);
        res.status(400).json({ message: error.message });
    }
};

export const getInvoiceById = async (req: Request, res: Response) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) return res.status(404).json({ message: "Invoice not found" });
        res.status(200).json(invoice);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
