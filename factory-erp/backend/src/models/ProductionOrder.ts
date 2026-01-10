import mongoose, { Document, Schema } from 'mongoose';

export interface IProductionStage {
    stage: 'psb_assembly' | 'kit_assembly' | 'testing' | 'packing';
    department: string;
    startTime?: Date;
    endTime?: Date;
    completedBy?: mongoose.Types.ObjectId;
    status: 'pending' | 'in_progress' | 'completed' | 'hold';
    outputQuantity: number;
    rejectQuantity: number;
    remarks?: string;
}

export interface IRequiredMaterial {
    materialId: mongoose.Types.ObjectId;
    materialCode: string;
    materialName: string;
    requiredQuantity: number;
    issuedQuantity: number;
    unit: string;
    status: 'pending' | 'issued' | 'short';
}

export interface IProductionOrder extends Document {
    orderNo: string;
    date: Date;
    targetDate: Date;
    finishedProductId: mongoose.Types.ObjectId;
    productCode: string;
    productName: string;
    quantityToProduce: number;
    requiredMaterials: IRequiredMaterial[];
    stages: IProductionStage[];
    currentStage: string;
    status: 'planned' | 'in_production' | 'completed' | 'cancelled';
    producedQuantity: number;
    passedQuantity: number;
    rejectedQuantity: number;
    createdBy: mongoose.Types.ObjectId;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ProductionOrderSchema: Schema = new Schema({
    orderNo: {
        type: String,
        unique: true,
        required: true,
        uppercase: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    targetDate: {
        type: Date,
        required: true
    },
    finishedProductId: {
        type: Schema.Types.ObjectId,
        ref: 'FinishedProduct',
        required: true
    },
    productCode: {
        type: String,
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    quantityToProduce: {
        type: Number,
        required: true,
        min: 1
    },
    requiredMaterials: [{
        materialId: {
            type: Schema.Types.ObjectId,
            ref: 'RawMaterial',
            required: true
        },
        materialCode: String,
        materialName: String,
        requiredQuantity: {
            type: Number,
            required: true,
            min: 0.01
        },
        issuedQuantity: {
            type: Number,
            default: 0,
            min: 0
        },
        unit: String,
        status: {
            type: String,
            enum: ['pending', 'issued', 'short'],
            default: 'pending'
        }
    }],
    stages: [{
        stage: {
            type: String,
            enum: ['psb_assembly', 'kit_assembly', 'testing', 'packing'],
            required: true
        },
        department: {
            type: String,
            required: true
        },
        startTime: Date,
        endTime: Date,
        completedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        status: {
            type: String,
            enum: ['pending', 'in_progress', 'completed', 'hold'],
            default: 'pending'
        },
        outputQuantity: {
            type: Number,
            default: 0,
            min: 0
        },
        rejectQuantity: {
            type: Number,
            default: 0,
            min: 0
        },
        remarks: String
    }],
    currentStage: {
        type: String,
        default: 'psb_assembly'
    },
    status: {
        type: String,
        enum: ['planned', 'in_production', 'completed', 'cancelled'],
        default: 'planned'
    },
    producedQuantity: {
        type: Number,
        default: 0,
        min: 0
    },
    passedQuantity: {
        type: Number,
        default: 0,
        min: 0
    },
    rejectedQuantity: {
        type: Number,
        default: 0,
        min: 0
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Pre-save middleware to update status based on stages
ProductionOrderSchema.pre('save', function (next) {
    // @ts-ignore
    const completedStages = this.stages.filter(stage => stage.status === 'completed').length;
    // @ts-ignore
    const totalStages = this.stages.length;

    // @ts-ignore
    if (this.stages.length > 0) {
        // Find first pending stage
        // @ts-ignore
        const currentStage = this.stages.find(stage => stage.status !== 'completed');
        if (currentStage) {
            this.currentStage = currentStage.stage;
        }

        // Update overall status
        if (completedStages === totalStages) {
            this.status = 'completed';
        } else if (completedStages > 0) {
            this.status = 'in_production';
        }
    }

    // Calculate total produced
    // @ts-ignore
    this.producedQuantity = this.stages.reduce((sum, stage) => sum + stage.outputQuantity, 0);
    // @ts-ignore
    this.rejectedQuantity = this.stages.reduce((sum, stage) => sum + stage.rejectQuantity, 0);
    this.passedQuantity = this.producedQuantity - this.rejectedQuantity;

    next();
});

// Indexes
ProductionOrderSchema.index({ orderNo: 1 });
ProductionOrderSchema.index({ date: 1 });
ProductionOrderSchema.index({ status: 1 });
ProductionOrderSchema.index({ finishedProductId: 1 });
ProductionOrderSchema.index({ createdBy: 1 });

export default mongoose.model<IProductionOrder>('ProductionOrder', ProductionOrderSchema);
