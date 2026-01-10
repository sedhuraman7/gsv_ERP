import mongoose, { Document, Schema } from 'mongoose';

export interface IDelivery extends Document {
    invoiceId: mongoose.Types.ObjectId;
    deliveryManId: mongoose.Types.ObjectId;
    status: 'assigned' | 'out_for_delivery' | 'delivered' | 'failed';
    customerName: string;
    customerAddress: string;
    customerContact: string;
    proof?: {
        photoUrl?: string;
        signatureUrl?: string;
    };
    failedReason?: string;
    deliveredAt?: Date;
    assignedAt: Date;
    updatedAt: Date;
}

const DeliverySchema: Schema = new Schema({
    invoiceId: {
        type: Schema.Types.ObjectId,
        ref: 'Invoice',
        required: true
    },
    deliveryManId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['assigned', 'out_for_delivery', 'delivered', 'failed'],
        default: 'assigned'
    },
    customerName: {
        type: String,
        required: true
    },
    customerAddress: {
        type: String,
        required: true
    },
    customerContact: {
        type: String,
        required: true
    },
    proof: {
        photoUrl: String,
        signatureUrl: String
    },
    failedReason: String,
    deliveredAt: Date,
    assignedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes
DeliverySchema.index({ invoiceId: 1 });
DeliverySchema.index({ deliveryManId: 1 });
DeliverySchema.index({ status: 1 });

export const Delivery = mongoose.model<IDelivery>('Delivery', DeliverySchema);
