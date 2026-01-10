import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { User } from '../models/User'; // Corrected import

dotenv.config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('✅ Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ employeeId: 'MFG-001' });
        if (existingAdmin) {
            console.log('⚠️ Admin user already exists');
            process.exit(0);
        }

        // Create admin user
        // Note: Password hashing is handled by pre-save hook in User model!
        // We just pass the plain password.

        const adminUser = new User({
            name: 'System Administrator',
            employeeId: 'MFG-001',
            email: 'admin@abcmfg.com',
            password: 'admin123', // Will be hashed by pre-save hook
            role: 'admin',
            department: 'production', // Must be one of the enum values
            // designation: 'System Admin', // Designation is not in the schema I viewed, removing it to be safe
            phone: '9876543210', // Changed from phoneNumber to phone as per schema
            isActive: true,
            accessLocations: ['main_store', 'dispatch'] // Must be from enum
        });

        await adminUser.save();
        console.log('🎉 Admin user created successfully!');
        console.log('🆔 ID: MFG-001');
        console.log('🔑 Password: admin123');

    } catch (error) {
        console.error('❌ Error creating admin:', error);
    } finally {
        mongoose.disconnect();
        process.exit(0);
    }
};

createAdmin();
