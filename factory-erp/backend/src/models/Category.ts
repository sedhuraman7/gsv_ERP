import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
    code: string;
    name: string;
    type: string; // 'raw_material', 'finished_product', 'vendor', 'customer', 'expense', etc.
    description?: string;
    gstRate?: number;
    unit?: string;
    minStock?: number;
    maxStock?: number;
    attributes?: string[];
    isActive: boolean;
}

const CategorySchema: Schema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        required: true,
        // allowed values: 'raw_material', 'finished_product', 'spare_parts', 'consumables', 'vendor', 'customer', 'expense', 'department'
    },
    description: String,
    gstRate: {
        type: Number,
        default: 18
    },
    unit: String,
    minStock: {
        type: Number,
        default: 0
    },
    maxStock: {
        type: Number,
        default: 0
    },
    attributes: [String],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes
CategorySchema.index({ type: 1, name: 1 });
CategorySchema.index({ code: 1 }, { unique: true });

export default mongoose.model<ICategory>('Category', CategorySchema);
