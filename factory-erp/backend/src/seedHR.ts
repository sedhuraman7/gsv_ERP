
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User';

dotenv.config();

const createHR = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb+srv://antigravity:L3W1e0xX%4077@cluster0.n1fb0.mongodb.net/factory-erp?retryWrites=true&w=majority';
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        // Check if HR exists
        const existingHR = await User.findOne({ email: 'hr@gsv.com' });
        if (existingHR) {
            console.log('HR user already exists');
        } else {
            const hrUser = new User({
                employeeId: 'EMP-HR-001',
                name: 'HR Manager',
                email: 'hr@gsv.com',
                password: 'password123',
                role: 'hr',
                department: 'hr',
                accessLocations: ['main_store'] // Basic access
            });

            await hrUser.save();
            console.log('HR user created successfully: hr@gsv.com / password123');
        }

        mongoose.disconnect();
    } catch (error) {
        console.error('Error creating HR user:', error);
        mongoose.disconnect();
    }
};

createHR();
