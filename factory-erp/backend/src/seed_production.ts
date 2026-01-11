import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProductionOrder from './models/ProductionOrder';
import { FinishedProduct, RawMaterial } from './models/Inventory';
import { User } from './models/User';

dotenv.config();

const seedProduction = async () => {
    try {
        const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/factory_erp';
        await mongoose.connect(dbUri);
        console.log('✅ Connected to MongoDB');

        // Get a user
        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.error('❌ No admin user found. Please run seed.ts first.');
            process.exit(1);
        }

        // Get or Create generic materials/products if missing (Mocking them if empty)
        let product = await FinishedProduct.findOne();
        if (!product) {
            product = await FinishedProduct.create({
                productCode: 'FP-001',
                name: 'Solar Inverter 5KV',
                category: 'Electronics',
                description: 'High efficiency solar inverter',
                minStockLevel: 10,
                unit: 'pcs',
                sellingPrice: 15000,
                costPrice: 8000,
                stock: { mainStore: 50, dispatchArea: 0 },
                isActive: true
            });
        }

        let material = await RawMaterial.findOne();
        if (!material) {
            material = await RawMaterial.create({
                materialCode: 'RM-001',
                name: 'PCB Board',
                category: 'Electronics',
                minStockLevel: 100,
                unit: 'pcs',
                averageCost: 500,
                currentStock: 1000,
                isActive: true
            });
        }

        // Clear existing planned/in-progress to avoid duplicates if re-running (optional)
        // await ProductionOrder.deleteMany({ status: { $in: ['planned', 'in_production'] } });

        const orders = [
            {
                orderNo: `PO-${Date.now()}-1`,
                targetDate: new Date(Date.now() + 86400000 * 5), // +5 days
                finishedProductId: product._id,
                productCode: product.productCode,
                productName: product.name,
                quantityToProduce: 100,
                status: 'planned', // Should show in "Raw Material"
                currentStage: 'psb_assembly',
                requiredMaterials: [{
                    materialId: material._id,
                    materialCode: material.materialCode,
                    materialName: material.name,
                    requiredQuantity: 100,
                    status: 'pending'
                }],
                stages: [
                    { stage: 'psb_assembly', department: 'Assembly', status: 'pending' },
                    { stage: 'testing', department: 'QA', status: 'pending' }
                ],
                createdBy: admin._id
            },
            {
                orderNo: `PO-${Date.now()}-2`,
                targetDate: new Date(Date.now() + 86400000 * 2), // +2 days
                finishedProductId: product._id,
                productCode: product.productCode,
                productName: product.name,
                quantityToProduce: 50,
                status: 'in_production', // Should show in "In Production"
                currentStage: 'psb_assembly',
                requiredMaterials: [{
                    materialId: material._id,
                    materialCode: material.materialCode,
                    materialName: material.name,
                    requiredQuantity: 50,
                    status: 'issued'
                }],
                stages: [
                    { stage: 'psb_assembly', department: 'Assembly', status: 'in_progress' },
                    { stage: 'testing', department: 'QA', status: 'pending' }
                ],
                createdBy: admin._id
            },
            {
                orderNo: `PO-${Date.now()}-3`,
                targetDate: new Date(Date.now() - 86400000), // Yesterday
                finishedProductId: product._id,
                productCode: product.productCode,
                productName: product.name,
                quantityToProduce: 30,
                status: 'in_production',
                currentStage: 'testing', // Should ideally show in "Quality Check" if logic updated
                requiredMaterials: [{
                    materialId: material._id,
                    materialCode: material.materialCode,
                    materialName: material.name,
                    requiredQuantity: 30,
                    status: 'issued'
                }],
                stages: [
                    { stage: 'psb_assembly', department: 'Assembly', status: 'completed', outputQuantity: 30 },
                    { stage: 'testing', department: 'QA', status: 'in_progress' }
                ],
                createdBy: admin._id
            }
        ];

        for (const order of orders) {
            // @ts-ignore
            await ProductionOrder.create(order);
            console.log(`✨ Created Order: ${order.orderNo} [${order.status}]`);
        }

        console.log('✅ Production Seed Completed!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedProduction();
