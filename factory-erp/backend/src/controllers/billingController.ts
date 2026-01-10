import { Request, Response } from 'express';
import Invoice from '../models/Invoice';
import { User } from '../models/User';
import { FinishedProduct } from '../models/Inventory';
import { EmailService } from '../services/EmailService';

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
        if (data.customerName && !data.customer) {
            // Find a default user for 'createdBy' (Required field)
            const adminUser = await User.findOne();
            // Use a valid 24-char hex string if no user found
            const fallbackId = adminUser ? adminUser._id : "507f1f77bcf86cd799439011";

            const invoiceCount = await Invoice.countDocuments();
            const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;

            const itemsCount = Number(data.items) || 1;
            const totalAmount = Number(data.totalAmount || data.amount || 0);


            // Deduct Inventory if product selected
            if (data.selectedProductId) {
                // Determine if ID is MongoID or Custom String
                const isMongoId = data.selectedProductId.match(/^[0-9a-fA-F]{24}$/);

                if (isMongoId) {
                    await FinishedProduct.findByIdAndUpdate(
                        data.selectedProductId,
                        { $inc: { "stock.mainStore": -itemsCount } }
                    );
                } else {
                    await FinishedProduct.findOneAndUpdate(
                        { productCode: data.selectedProductId },
                        { $inc: { "stock.mainStore": -itemsCount } }
                    );
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
                    productId: fallbackId, // Using fallback to avoid invalid ObjectID error if custom string passed
                    productCode: data.selectedProductId || 'GEN-001',
                    description: 'Product Sale',
                    quantity: itemsCount,
                    unit: 'nos',
                    rate: data.unitPrice,
                    gstPercentage: 18,
                }],
                paymentStatus: data.status ? data.status.toLowerCase() : 'pending',
                createdBy: fallbackId,
                grandTotal: totalAmount
            });

            const savedInvoice = await newInvoice.save();

            // Send Email Notification
            if (data.customerEmail) {
                try {
                    // In a real app, generate the PDF here using pdfkit or similar
                    // For now, we simulate the buffer connection to the existing Email Service
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
                    console.log(`📧 Invoice email queued for ${data.customerEmail}`);
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
