import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProductionOrder from './models/ProductionOrder';
import { User } from './models/User';
import { FinishedProduct } from './models/Inventory';

dotenv.config();

const seedProduction = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/factory_erp');
        console.log('✅ Connected to MongoDB');

        // 1. Get Admin User
        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.error('❌ Admin user not found. Please run seed.ts first.');
            process.exit(1);
        }

        // 2. Ensure some Inventory Exists or Create it
        let prod1 = await FinishedProduct.findOne({ productCode: 'FP-GEN-001' });
        if (!prod1) {
            console.log('Creating sample Finished Product...');
            prod1 = await FinishedProduct.create({
                productCode: 'FP-GEN-001',
                name: 'Solar Inverter 5kVA',
                category: 'Electronics', // FIXED: Matches Enum
                description: 'High efficiency solar inverter',
                unit: 'piece', // FIXED: Matches Enum
                stock: { mainStore: 50 },
                sellingPrice: 45000,
                costPrice: 30000,
                isActive: true,
                bom: [] // Empty BOM is allowed by schema (array not required, items inside are)
            });
        }

        // 3. Create Sample Production Orders
        const orders = [
            {
                orderNo: 'PO-2026-001',
                targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 days
                finishedProductId: prod1._id,
                productCode: prod1.productCode,
                productName: prod1.name,
                quantityToProduce: 100,
                // Status is auto-calc by pre-save, but we set it for clarity.
                // However, pre-save might override if stages aren't set right.
                // We'll let pre-save handle it or force it.
                stages: [
                    {
                        stage: 'psb_assembly',
                        department: 'assembly',
                        status: 'completed',
                        outputQuantity: 100,
                        rejectQuantity: 2,
                        startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                        endTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
                    },
                    {
                        stage: 'kit_assembly',
                        department: 'assembly',
                        status: 'in_progress',
                        outputQuantity: 45,
                        rejectQuantity: 0,
                        startTime: new Date(Date.now() - 12 * 60 * 60 * 1000)
                    },
                    {
                        stage: 'testing',
                        department: 'quality',
                        status: 'pending'
                    },
                    {
                        stage: 'packing',
                        department: 'store',
                        status: 'pending'
                    }
                ],
                requiredMaterials: [],
                createdBy: admin._id
            },
            {
                orderNo: 'PO-2026-002',
                targetDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                finishedProductId: prod1._id,
                productCode: prod1.productCode,
                productName: prod1.name,
                quantityToProduce: 50,
                stages: [
                    { stage: 'psb_assembly', department: 'assembly', status: 'pending' },
                    { stage: 'kit_assembly', department: 'assembly', status: 'pending' },
                    { stage: 'testing', department: 'quality', status: 'pending' },
                    { stage: 'packing', department: 'store', status: 'pending' }
                ],
                requiredMaterials: [],
                createdBy: admin._id
            },
            {
                orderNo: 'PO-2026-003',
                targetDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                finishedProductId: prod1._id,
                productCode: prod1.productCode,
                productName: prod1.name,
                quantityToProduce: 200,
                stages: [
                    { stage: 'psb_assembly', department: 'assembly', status: 'completed', outputQuantity: 200 },
                    { stage: 'kit_assembly', department: 'assembly', status: 'completed', outputQuantity: 200 },
                    { stage: 'testing', department: 'quality', status: 'completed', outputQuantity: 198, rejectQuantity: 2 },
                    { stage: 'packing', department: 'store', status: 'completed', outputQuantity: 198 }
                ],
                requiredMaterials: [],
                createdBy: admin._id
            }
        ];

        // Delete existing to avoid duplicates
        await ProductionOrder.deleteMany({});
        console.log('Cleared existing production orders.');

        await ProductionOrder.insertMany(orders);
        console.log(`✅ Seeded ${orders.length} Production Orders successfully!`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedProduction();
