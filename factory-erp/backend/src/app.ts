import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

import customerRoutes from './routes/customerRoutes';
import vendorRoutes from './routes/vendorRoutes';
import productionRoutes from './routes/productionRoutes';
import billingRoutes from './routes/billingRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import authRoutes from './routes/authRoutes';
import categoryRoutes from './routes/categoryRoutes';
import deliveryRoutes from './routes/deliveryRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded images, etc.)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Database Connection
// Database Connection
const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/factory_erp';
console.log('🔌 Attempting to connect to DB:', dbUri.includes('mongodb+srv') ? 'MongoDB Atlas (Cloud)' : 'Local MongoDB');

mongoose.connect(dbUri)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Initialize Services
import { RFIDService } from './services/RFIDService';
const rfidService = new RFIDService();
console.log('RFID Service Initialized');
// Attempt connection (non-blocking)
rfidService.connect().catch(err => console.log('⚠️ RFID Reader not found (Simulation Mode)'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/deliveries', deliveryRoutes);

// Basic Route
app.get('/', (req, res) => {
    res.json({
        message: '🏭 ABC Manufacturing ERP API is Running',
        version: '1.0.0',
        services: {
            rfid: rfidService.getStatus().connected ? 'Online' : 'Offline'
        }
    });
});

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Error Handling Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

export default app;
