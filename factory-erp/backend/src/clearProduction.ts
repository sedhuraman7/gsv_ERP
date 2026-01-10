import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProductionOrder from './models/ProductionOrder';

dotenv.config();

const clearProductionData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/factory_erp');
        console.log('✅ Connected to MongoDB');

        const result = await ProductionOrder.deleteMany({});
        console.log(`🗑️  Deleted ${result.deletedCount} Production Orders.`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Deletion failed:', error);
        process.exit(1);
    }
};

clearProductionData();
