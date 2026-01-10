
import mongoose from 'mongoose';
import { User } from './models/User';

const run = async () => {
    try {
        const mongoUri = 'mongodb+srv://sedhu123sedhu_db_user:Sedhuraman%407777@cluster0.mbjc3rt.mongodb.net/factory_erp?retryWrites=true&w=majority&appName=Cluster0';
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const users = await User.find({}, 'email role employeeId name');
        console.log('--- Current Users ---');
        users.forEach(u => console.log(`${u.employeeId} | ${u.email} | ${u.role} | ${u.name}`));
        console.log('---------------------');

        const hrEmail = 'hr@gsv.com';
        let hrUser = await User.findOne({ email: hrEmail });

        if (!hrUser) {
            console.log('HR User not found. Creating...');
            hrUser = new User({
                employeeId: 'EMP-HR-001',
                name: 'HR Manager',
                email: hrEmail,
                password: 'password123',
                role: 'hr',
                department: 'hr',
                accessLocations: ['main_store']
            });
            await hrUser.save();
            console.log('HR User created successfully.');
        } else {
            console.log('HR User already exists: ' + hrUser._id);
            // reset password just in case
            hrUser.password = 'password123';
            hrUser.role = 'hr'; // ensure role is correct
            await hrUser.save();
            console.log('HR User updated/verified.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

run();
