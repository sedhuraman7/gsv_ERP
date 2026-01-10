import mongoose, { Document, Schema } from 'mongoose';

export interface IInvoiceItem {
    productId: mongoose.Types.ObjectId;
    productCode: string;
    description: string;
    hsnCode?: string;
    quantity: number;
    unit: string;
    rate: number;
    gstPercentage: number;
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    discountPercentage: number;
    discountAmount: number;
    amount: number;
}

export interface IInvoice extends Document {
    invoiceNo: string;
    date: Date;
    customer: {
        customerId?: mongoose.Types.ObjectId;
        name: string;
        gstin?: string;
        state: string;
        address: string;
        contact: string;
        email?: string;
    };
    items: IInvoiceItem[];
    subTotal: number;
    totalDiscount: number;
    taxableAmount: number;
    cgstTotal: number;
    sgstTotal: number;
    igstTotal: number;
    totalGst: number;
    roundOff: number;
    grandTotal: number;
    paymentMode: 'cash' | 'cheque' | 'online' | 'credit';
    paymentStatus: 'paid' | 'pending' | 'partial';
    amountPaid: number;
    balanceDue: number;
    dispatchThrough?: string;
    deliveryNote?: string;
    supplierRef?: string;
    poNumber?: string;
    createdBy: mongoose.Types.ObjectId;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const InvoiceSchema: Schema = new Schema({
    invoiceNo: {
        type: String,
        unique: true,
        required: true,
        uppercase: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    customer: {
        customerId: {
            type: Schema.Types.ObjectId,
            ref: 'Customer'
        },
        name: {
            type: String,
            required: true
        },
        gstin: String,
        state: {
            type: String,
            required: true
        },
        address: {
            type: String,
            required: true
        },
        contact: {
            type: String,
            required: true
        },
        email: String
    },
    items: [{
        productId: {
            type: Schema.Types.ObjectId,
            required: true
        },
        productCode: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        hsnCode: String,
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        unit: {
            type: String,
            required: true
        },
        rate: {
            type: Number,
            required: true,
            min: 0
        },
        gstPercentage: {
            type: Number,
            default: 18,
            min: 0,
            max: 28
        },
        taxableValue: {
            type: Number,
            default: 0
        },
        cgst: {
            type: Number,
            default: 0
        },
        sgst: {
            type: Number,
            default: 0
        },
        igst: {
            type: Number,
            default: 0
        },
        discountPercentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        discountAmount: {
            type: Number,
            default: 0
        },
        amount: {
            type: Number,
            default: 0
        }
    }],
    subTotal: {
        type: Number,
        default: 0,
        min: 0
    },
    totalDiscount: {
        type: Number,
        default: 0,
        min: 0
    },
    taxableAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    cgstTotal: {
        type: Number,
        default: 0,
        min: 0
    },
    sgstTotal: {
        type: Number,
        default: 0,
        min: 0
    },
    igstTotal: {
        type: Number,
        default: 0,
        min: 0
    },
    totalGst: {
        type: Number,
        default: 0,
        min: 0
    },
    roundOff: {
        type: Number,
        default: 0
    },
    grandTotal: {
        type: Number,
        default: 0,
        min: 0
    },
    paymentMode: {
        type: String,
        enum: ['cash', 'cheque', 'online', 'credit'],
        default: 'cash'
    },
    paymentStatus: {
        type: String,
        enum: ['paid', 'pending', 'partial'],
        default: 'pending'
    },
    amountPaid: {
        type: Number,
        default: 0,
        min: 0
    },
    balanceDue: {
        type: Number,
        default: 0
    },
    dispatchThrough: String,
    deliveryNote: String,
    supplierRef: String,
    poNumber: String,
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

// Pre-save middleware to calculate totals
InvoiceSchema.pre('save', function (next) {
    // Calculate item totals
    // @ts-ignore
    this.items.forEach(item => {
        const itemTotal = item.quantity * item.rate;
        const discount = itemTotal * (item.discountPercentage / 100);
        const taxableValue = itemTotal - discount;

        item.discountAmount = discount;
        item.taxableValue = taxableValue;

        // @ts-ignore
        if (this.customer.state === 'Tamil Nadu') {
            // CGST + SGST for same state
            const gstAmount = taxableValue * (item.gstPercentage / 100);
            item.cgst = gstAmount / 2;
            item.sgst = gstAmount / 2;
            item.igst = 0;
        } else {
            // IGST for different state
            item.igst = taxableValue * (item.gstPercentage / 100);
            item.cgst = 0;
            item.sgst = 0;
        }

        item.amount = taxableValue + item.cgst + item.sgst + item.igst;
    });

    // Calculate invoice totals
    // @ts-ignore
    this.subTotal = this.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    // @ts-ignore
    this.totalDiscount = this.items.reduce((sum, item) => sum + item.discountAmount, 0);
    // @ts-ignore
    this.taxableAmount = this.items.reduce((sum, item) => sum + item.taxableValue, 0);
    // @ts-ignore
    this.cgstTotal = this.items.reduce((sum, item) => sum + item.cgst, 0);
    // @ts-ignore
    this.sgstTotal = this.items.reduce((sum, item) => sum + item.sgst, 0);
    // @ts-ignore
    this.igstTotal = this.items.reduce((sum, item) => sum + item.igst, 0);
    this.totalGst = this.cgstTotal + this.sgstTotal + this.igstTotal;
    this.grandTotal = this.taxableAmount + this.totalGst;

    // Round off to nearest rupee
    this.roundOff = Math.round(this.grandTotal) - this.grandTotal;
    this.grandTotal = Math.round(this.grandTotal);

    // Calculate balance due
    this.balanceDue = this.grandTotal - this.amountPaid;

    next();
});

// Indexes
InvoiceSchema.index({ invoiceNo: 1 });
InvoiceSchema.index({ date: 1 });
InvoiceSchema.index({ 'customer.name': 1 });
InvoiceSchema.index({ paymentStatus: 1 });
InvoiceSchema.index({ createdBy: 1 });
InvoiceSchema.index({ isActive: 1 });

export default mongoose.model<IInvoice>('Invoice', InvoiceSchema);
