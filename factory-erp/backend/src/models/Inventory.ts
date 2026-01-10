import mongoose, { Document, Schema } from 'mongoose';

// Raw Material Schema
export interface IRawMaterial extends Document {
    materialCode: string;
    name: string;
    category: string;
    description?: string;
    unit: string;
    currentStock: number;
    minStockLevel: number;
    maxStockLevel: number;
    reorderLevel: number;
    averageCost: number;
    lastPurchaseRate: number;
    supplier?: {
        vendorId: mongoose.Types.ObjectId;
        vendorName: string;
        lastPurchaseDate: Date;
    };
    location: {
        godown: string;
        rack: string;
        bin: string;
    };
    hsnCode?: string;
    gstPercentage: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const RawMaterialSchema: Schema = new Schema({
    materialCode: {
        type: String,
        unique: true,
        required: true,
        uppercase: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    description: String,
    unit: {
        type: String,
        required: true,
        enum: ['kg', 'meter', 'liter', 'piece', 'box', 'roll', 'set']
    },
    currentStock: {
        type: Number,
        default: 0,
        min: 0
    },
    minStockLevel: {
        type: Number,
        required: true,
        min: 0
    },
    maxStockLevel: {
        type: Number,
        required: true,
        min: 0
    },
    reorderLevel: {
        type: Number,
        default: function () {
            // @ts-ignore
            return this.minStockLevel * 1.5;
        }
    },
    averageCost: {
        type: Number,
        default: 0
    },
    lastPurchaseRate: {
        type: Number,
        default: 0
    },
    supplier: {
        vendorId: {
            type: Schema.Types.ObjectId,
            ref: 'Vendor'
        },
        vendorName: String,
        lastPurchaseDate: Date
    },
    location: {
        godown: {
            type: String,
            default: 'Main Store'
        },
        rack: String,
        bin: String
    },
    hsnCode: String,
    gstPercentage: {
        type: Number,
        default: 18,
        min: 0,
        max: 28
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Finished Product Schema
export interface IFinishedProduct extends Document {
    productCode: string;
    name: string;
    category: string;
    description?: string;
    unit: string;
    sellingPrice: number;
    costPrice: number;
    mrp?: number;
    stock: {
        mainStore: number;
        dispatchArea: number;
        qualityHold: number;
    };
    bom: Array<{
        type: 'raw' | 'semi-finished';
        itemId: mongoose.Types.ObjectId;
        itemCode: string;
        itemName: string;
        quantity: number;
        unit: string;
        cost: number;
    }>;
    hsnCode?: string;
    gstPercentage: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const FinishedProductSchema: Schema = new Schema({
    productCode: {
        type: String,
        unique: true,
        required: true,
        uppercase: true
    },
    name: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    description: String,
    unit: {
        type: String,
        default: 'piece',
        enum: ['piece', 'box', 'set', 'kg', 'meter']
    },
    sellingPrice: {
        type: Number,
        default: 0,
        min: 0
    },
    costPrice: {
        type: Number,
        default: 0,
        min: 0
    },
    mrp: {
        type: Number,
        min: 0
    },
    stock: {
        mainStore: {
            type: Number,
            default: 0,
            min: 0
        },
        dispatchArea: {
            type: Number,
            default: 0,
            min: 0
        },
        qualityHold: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    bom: [{
        type: {
            type: String,
            enum: ['raw', 'semi-finished'],
            required: true
        },
        itemId: {
            type: Schema.Types.ObjectId,
            required: true
        },
        itemCode: String,
        itemName: String,
        quantity: {
            type: Number,
            required: true,
            min: 0.01
        },
        unit: String,
        cost: {
            type: Number,
            default: 0
        }
    }],
    hsnCode: String,
    gstPercentage: {
        type: Number,
        default: 18,
        min: 0,
        max: 28
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Stock Movement Schema
export interface IStockMovement extends Document {
    referenceNo: string;
    date: Date;
    itemType: 'raw' | 'semi-finished' | 'finished';
    itemId: mongoose.Types.ObjectId;
    itemCode: string;
    itemName: string;
    quantity: number;
    unit: string;
    fromLocation: string;
    toLocation: string;
    movementType: 'production_issue' | 'production_receipt' | 'transfer' |
    'sales' | 'purchase' | 'wastage' | 'quality_reject' |
    'return' | 'adjustment';
    issuedBy: mongoose.Types.ObjectId;
    receivedBy?: mongoose.Types.ObjectId;
    department: string;
    productionOrderId?: mongoose.Types.ObjectId;
    invoiceId?: mongoose.Types.ObjectId;
    purchaseOrderId?: mongoose.Types.ObjectId;
    remarks?: string;
    createdAt: Date;
}

const StockMovementSchema: Schema = new Schema({
    referenceNo: {
        type: String,
        unique: true,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    itemType: {
        type: String,
        enum: ['raw', 'semi-finished', 'finished'],
        required: true
    },
    itemId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    itemCode: String,
    itemName: String,
    quantity: {
        type: Number,
        required: true,
        min: 0.01
    },
    unit: String,
    fromLocation: {
        type: String,
        enum: ['main_store', 'godown_1', 'godown_2', 'assembly_line_1',
            'assembly_line_2', 'packing_area', 'dispatch', 'supplier', 'customer'],
        required: true
    },
    toLocation: {
        type: String,
        enum: ['main_store', 'godown_1', 'godown_2', 'assembly_line_1',
            'assembly_line_2', 'packing_area', 'dispatch', 'supplier', 'customer'],
        required: true
    },
    movementType: {
        type: String,
        enum: ['production_issue', 'production_receipt', 'transfer', 'sales',
            'purchase', 'wastage', 'quality_reject', 'return', 'adjustment'],
        required: true
    },
    issuedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receivedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    department: String,
    productionOrderId: {
        type: Schema.Types.ObjectId,
        ref: 'ProductionOrder'
    },
    invoiceId: {
        type: Schema.Types.ObjectId,
        ref: 'Invoice'
    },
    purchaseOrderId: {
        type: Schema.Types.ObjectId,
        ref: 'PurchaseOrder'
    },
    remarks: String
}, {
    timestamps: true
});

// Indexes
RawMaterialSchema.index({ materialCode: 1 });
RawMaterialSchema.index({ category: 1 });
RawMaterialSchema.index({ currentStock: 1 });
RawMaterialSchema.index({ isActive: 1 });

FinishedProductSchema.index({ productCode: 1 });
FinishedProductSchema.index({ category: 1 });
FinishedProductSchema.index({ isActive: 1 });

StockMovementSchema.index({ referenceNo: 1 });
StockMovementSchema.index({ date: 1 });
StockMovementSchema.index({ itemType: 1, itemId: 1 });
StockMovementSchema.index({ movementType: 1 });
StockMovementSchema.index({ fromLocation: 1, toLocation: 1 });

export const RawMaterial = mongoose.model<IRawMaterial>('RawMaterial', RawMaterialSchema);
export const FinishedProduct = mongoose.model<IFinishedProduct>('FinishedProduct', FinishedProductSchema);
export const StockMovement = mongoose.model<IStockMovement>('StockMovement', StockMovementSchema);
