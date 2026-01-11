import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User';

dotenv.config();

const users = [
    {
        employeeId: 'ADMIN001',
        name: 'System Admin',
        email: 'admin@factory.com',
        role: 'admin',
        department: 'production', // Admin has access to all usually, but schema needs one
        password: 'password123'
    },
    {
        employeeId: 'STORE001',
        name: 'Store Manager',
        email: 'store@factory.com',
        role: 'store_manager',
        department: 'store',
        password: 'password123'
    },
    {
        employeeId: 'PROD001',
        name: 'Production Head',
        email: 'prod@factory.com',
        role: 'production_head',
        department: 'production',
        password: 'password123'
    },
    {
        employeeId: 'SALES001',
        name: 'Sales Man',
        email: 'sales@factory.com',
        role: 'sales_man',
        department: 'sales',
        password: 'password123'
    },
    {
        employeeId: 'ACCT001',
        name: 'Accountant',
        email: 'accounts@factory.com',
        role: 'accounts',
        department: 'accounts',
        password: 'password123'
    },
    {
        employeeId: 'DELIVERY001',
        name: 'Fast Delivery Man',
        email: 'delivery@factory.com',
        role: 'delivery_man',
        department: 'logistics',
        password: 'password123'
    }
];

const seedUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/factory_erp');
        console.log('✅ Connected to MongoDB');

        // Clear existing users to reset passwords (Optional: user asked how to set pass, this is the easiest way)
        // ACTUALLY: Let's not delete everyone unless asked. But to fix "login fail" and ensure updated passwords:
        // I will upsert based on employeeId.

        for (const user of users) {
            const existingUser = await User.findOne({ employeeId: user.employeeId });
            if (existingUser) {
                // Update password
                existingUser.password = user.password;
                existingUser.name = user.name;
                existingUser.role = user.role as any;
                existingUser.department = user.department as any;
                await existingUser.save();
                console.log(`🔄 Updated user: ${user.name} (${user.employeeId})`);
            } else {
                await User.create(user);
                console.log(`✨ Created user: ${user.name} (${user.employeeId})`);
            }
        }

        console.log('\n🔐 DEFAULT PASSWORDS SET: "password123" for all users.');
        console.log('----------------------------------------------------');
        users.forEach(u => console.log(`${u.role.padEnd(15)} | ID: ${u.employeeId} | Pass: ${u.password}`));
        console.log('----------------------------------------------------');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedUsers();
