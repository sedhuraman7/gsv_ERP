import { Request, Response } from 'express';
import ProductionOrder from '../models/ProductionOrder';

export const getProductionOrders = async (req: Request, res: Response) => {
    try {
        const orders = await ProductionOrder.find().sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createProductionOrder = async (req: Request, res: Response) => {
    try {
        console.log('Received payload:', req.body);
        const { product, quantity, dueDate, priority } = req.body;

        // 1. Generate Order Number
        const count = await ProductionOrder.countDocuments();
        const orderNo = `PO-${new Date().getFullYear()}-${(count + 1).toString().padStart(3, '0')}`;

        // 2. Find Product Logic (Auto-Create if missing)
        const { FinishedProduct } = await import('../models/Inventory');
        const { User } = await import('../models/User');

        let finishedProduct = await FinishedProduct.findOne({
            name: { $regex: new RegExp(product, 'i') }
        });

        // AUTO-CREATE Product if it doesn't exist (For smooth UX)
        if (!finishedProduct) {
            console.log(`Product '${product}' not found. Auto-creating...`);
            const randomCode = `FP-AUTO-${Math.floor(Math.random() * 10000)}`;
            finishedProduct = await FinishedProduct.create({
                productCode: randomCode,
                name: product || 'New Product',
                category: 'Consumer Goods', // Default valid category
                unit: 'piece',
                sellingPrice: 0,
                costPrice: 0,
                stock: { mainStore: 0 },
                isActive: true,
                bom: []
            } as any);
        }

        // 3. Get User (Fallback to Admin)
        let userId = (req as any).user?._id;
        if (!userId) {
            const admin = await User.findOne({ role: 'admin' });
            userId = admin?._id;
        }

        // 4. Default Stages
        const defaultStages = [
            { stage: 'psb_assembly', department: 'assembly', status: 'pending' },
            { stage: 'kit_assembly', department: 'assembly', status: 'pending' },
            { stage: 'testing', department: 'quality', status: 'pending' },
            { stage: 'packing', department: 'store', status: 'pending' }
        ];

        // 5. Create Order
        const newOrder = new ProductionOrder({
            orderNo,
            productCode: finishedProduct.productCode,
            productName: finishedProduct.name, // Use actual name from DB
            finishedProductId: finishedProduct._id,
            quantityToProduce: parseInt(quantity) || 10,
            targetDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            createdBy: userId,
            stages: defaultStages,
            status: 'planned'
        });

        const savedOrder = await newOrder.save();
        res.status(201).json(savedOrder);
    } catch (error: any) {
        console.error('Create Order Error:', error);
        res.status(400).json({ message: error.message || 'Failed to create order' });
    }
};

export const updateProductionStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const updatedOrder = await ProductionOrder.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );
        res.status(200).json(updatedOrder);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};
