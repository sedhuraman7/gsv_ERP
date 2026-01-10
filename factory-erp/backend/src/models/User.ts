import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    employeeId: string;
    name: string;
    email: string;
    password: string;
    phone?: string;
    role: 'admin' | 'sales_man' | 'dealer' | 'accounts' | 'store_manager' |
    'assembly_area1' | 'assembly_area2' | 'packing_area' |
    'quality_check' | 'production_head' | 'hr' | 'delivery_man';
    department: 'production' | 'sales' | 'accounts' | 'store' | 'assembly' | 'packing' | 'hr' | 'logistics';
    shift?: 'morning' | 'evening' | 'night';
    accessLocations: string[];
    isActive: boolean;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;

    comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
    employeeId: {
        type: String,
        unique: true,
        required: [true, 'Employee ID is required'],
        uppercase: true,
        trim: true
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6,
        select: false
    },
    phone: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        enum: [
            'admin',
            'sales_man',
            'dealer',
            'accounts',
            'store_manager',
            'assembly_area1',
            'assembly_area2',
            'packing_area',
            'quality_check',
            'production_head',
            'hr',
            'delivery_man'
        ],
        default: 'store_manager'
    },
    department: {
        type: String,
        enum: ['production', 'sales', 'accounts', 'store', 'assembly', 'packing', 'hr', 'logistics'],
        required: true
    },
    shift: {
        type: String,
        enum: ['morning', 'evening', 'night']
    },
    accessLocations: [{
        type: String,
        enum: ['main_store', 'godown_1', 'godown_2', 'assembly_line_1', 'assembly_line_2', 'packing_area', 'dispatch']
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    }
}, {
    timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error: any) {
        next(error);
    }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Indexes
UserSchema.index({ employeeId: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ department: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
