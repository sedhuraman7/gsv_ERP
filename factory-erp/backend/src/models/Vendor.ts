import mongoose, { Schema, Document } from 'mongoose';

export interface IVendor extends Document {
    id: string; // Custom ID like VEND-001
    name: string;
    category: string;
    contactPerson: string;
    email: string;
    phone: string;
    address?: string;
    gstNumber?: string;
    rating: number;
    status: 'active' | 'warning' | 'inactive';
    deliveryTime: string;
    lastOrderDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const VendorSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    contactPerson: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String },
    gstNumber: { type: String },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    status: { type: String, enum: ['active', 'warning', 'inactive'], default: 'active' },
    deliveryTime: { type: String },
    lastOrderDate: { type: Date }
}, {
    timestamps: true
});

export default mongoose.model<IVendor>('Vendor', VendorSchema);
