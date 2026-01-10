import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
    id: string; // Custom ID like CUST-001
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    location: string;
    category: string;
    gstNumber?: string;
    totalOrders: number;
    totalValue: number;
    status: 'active' | 'inactive';
    rating: number;
    createdAt: Date;
    updatedAt: Date;
}

const CustomerSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    contactPerson: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    location: { type: String, required: true },
    category: { type: String, required: true, default: 'General' },
    gstNumber: { type: String },
    totalOrders: { type: Number, default: 0 },
    totalValue: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    rating: { type: Number, default: 0, min: 0, max: 5 }
}, {
    timestamps: true
});

export default mongoose.model<ICustomer>('Customer', CustomerSchema);
