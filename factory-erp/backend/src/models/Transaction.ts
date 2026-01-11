import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
    transactionId: string;
    date: Date;
    type: 'invoice' | 'payment' | 'expense' | 'refund';
    partyType: 'customer' | 'vendor';
    partyId: mongoose.Types.ObjectId;
    partyName: string;
    description: string;
    amount: number; // Positive for Debit, Negative for Credit (or utilize isDebit flag)
    isDebit: boolean; // True = Receivable/Debit, False = Payable/Credit
    referenceId?: mongoose.Types.ObjectId; // Link to Invoice or Payment ID
    category?: string; // e.g., 'Sales Account', 'Cash', 'Bank'
    createdAt: Date;
    updatedAt: Date;
}

const TransactionSchema: Schema = new Schema({
    transactionId: { type: String, required: true, unique: true },
    date: { type: Date, default: Date.now },
    type: {
        type: String,
        required: true,
        enum: ['invoice', 'payment', 'expense', 'refund']
    },
    partyType: {
        type: String,
        required: true,
        enum: ['customer', 'vendor']
    },
    partyId: { type: Schema.Types.ObjectId, required: true, refPath: 'partyType' }, // Dynamic ref
    partyName: { type: String, required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    isDebit: { type: Boolean, required: true }, // For Customer: Invoice = Debit (They owe us), Payment = Credit (They paid us)
    referenceId: { type: Schema.Types.ObjectId },
    category: { type: String, default: 'General' }
}, {
    timestamps: true
});

// Indexes for Reports
TransactionSchema.index({ partyId: 1 });
TransactionSchema.index({ date: 1 });
TransactionSchema.index({ type: 1 });

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
