import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
    FileText,
    Plus,
    Printer,
    Send,
    Search,
    Download,
    CreditCard,
    User,
    Calendar,
    CheckCircle,
    Truck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const BillingSystem: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newInvoice, setNewInvoice] = useState({
        customerName: '',
        customerId: '',
        gstin: '',
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
        selectedProductId: '',
        quantity: 1,
        unitPrice: 0
    });

    const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const prodId = e.target.value;
        const product = products.find(p => p.id === prodId);
        setNewInvoice({
            ...newInvoice,
            selectedProductId: prodId,
            unitPrice: product ? (product.sellingPrice || 100) : 0 // Fallback price if missing
        });
    };

    const fetchInvoices = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/billing`);
            if (response.ok) {
                const data = await response.json();
                setInvoices(data);
            }
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Mock submission for now as backend might need full object structure
            // In a real app, this would match the Invoice model exactly
            // Calculate total amount from quantity * price
            const payload = {
                ...newInvoice,
                amount: newInvoice.quantity * newInvoice.unitPrice,
                // Pass items count for backend compatibility if needed
                items: newInvoice.quantity
            };

            const response = await fetch(`${API_BASE_URL}/api/billing`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setShowCreateModal(false);
                fetchInvoices();
                setNewInvoice({
                    customerName: '',
                    customerId: '',
                    gstin: '',
                    status: 'pending',
                    date: new Date().toISOString().split('T')[0],
                    selectedProductId: '',
                    quantity: 1,
                    unitPrice: 0
                });
            } else {
                alert('Failed to create invoice');
            }
        } catch (error) {
            console.error('Error creating invoice:', error);
        }
    };

    const [products, setProducts] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);

    const fetchCustomers = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/customers`);
            if (response.ok) {
                const data = await response.json();
                setCustomers(data);
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/inventory`);
            if (response.ok) {
                const data = await response.json();
                // Filter only Finished Products for billing
                const finished = data.filter((item: any) => item.type === 'finished');
                setProducts(finished);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const [deliveryMen, setDeliveryMen] = useState<any[]>([]);
    const [showAssignModal, setShowAssignModal] = useState<string | null>(null);

    const fetchDeliveryMen = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/users?role=delivery_man`); // We might need this endpoint or a general users endpoint
            if (response.ok) {
                const data = await response.json();
                setDeliveryMen(data);
            } else {
                // Fallback for demo if endpoint doesn't exist yet
                setDeliveryMen([
                    { _id: 'dm1', name: 'John Delivery', employeeId: 'DLV-001' },
                    { _id: 'dm2', name: 'Mike Express', employeeId: 'DLV-002' }
                ]);
            }
        } catch (error) {
            console.error('Error fetching delivery men:', error);
        }
    };

    const handleAssignDelivery = async (invoiceId: string, deliveryManId: string) => {
        try {
            const userStr = localStorage.getItem('factory_user');
            const token = JSON.parse(userStr!).token;

            const response = await fetch(`${API_BASE_URL}/api/deliveries/assign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ invoiceId, deliveryManId })
            });

            if (response.ok) {
                toast.success('Delivery assigned successfully');
                setShowAssignModal(null);
            } else {
                const err = await response.json();
                toast.error(err.message || 'Assignment failed');
            }
        } catch (error) {
            toast.error('Network error');
        }
    };

    React.useEffect(() => {
        fetchInvoices();
        fetchProducts();
        fetchCustomers(); // Fetch customers
        fetchDeliveryMen();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'overdue': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const downloadPDF = (invoice: any) => {
        const doc = new jsPDF();
        const id = invoice.invoiceNo || invoice._id || 'Unknown';

        doc.setFontSize(20);
        doc.text(`Invoice: ${id}`, 10, 20);

        doc.setFontSize(12);
        doc.text(`Customer: ${invoice.customer?.name || invoice.client || 'N/A'}`, 10, 30);
        doc.text(`Date: ${invoice.date ? new Date(invoice.date).toLocaleDateString() : 'N/A'}`, 10, 40);
        doc.text(`Total Amount: ${Number(invoice.grandTotal || invoice.amount || 0).toLocaleString()}`, 10, 50);

        doc.save(`${id}.pdf`);
    };

    const stats = {
        revenue: invoices.reduce((sum, inv) => sum + ((inv.status === 'paid' && (inv.grandTotal || inv.amount)) || 0), 0),
        pending: invoices.reduce((sum, inv) => sum + ((inv.status === 'pending' && (inv.grandTotal || inv.amount)) || 0), 0),
        overdue: invoices.reduce((sum, inv) => sum + ((inv.status === 'overdue' && (inv.grandTotal || inv.amount)) || 0), 0),
        count: invoices.length
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Billing & Invoicing</h1>
                    <p className="text-gray-600">Manage invoices, specialized GST reports, and payments</p>
                </div>
                <div className="mt-4 md:mt-0 flex gap-3">
                    <button className="btn-secondary flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Export Report
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Create New Invoice
                    </button>
                </div>
            </div>

            {/* Quick Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Revenue (Jan)</p>
                            <p className="text-2xl font-bold text-gray-800">₹{stats.revenue.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-100 text-yellow-600 rounded-lg">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Pending</p>
                            <p className="text-2xl font-bold text-gray-800">₹{stats.pending.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-100 text-red-600 rounded-lg">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Overdue</p>
                            <p className="text-2xl font-bold text-gray-800">₹{stats.overdue.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Invoices Generated</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.count}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Invoice List */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Search & Filter */}
                <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row gap-4 justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search invoices by client or ID..."
                            className="input-field pl-10 w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <select className="input-field">
                            <option>All Status</option>
                            <option>Paid</option>
                            <option>Pending</option>
                            <option>Overdue</option>
                        </select>
                        <input type="date" className="input-field" />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">Invoice ID</th>
                                <th className="px-6 py-4">Client</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {invoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-primary-600 font-medium">{inv.invoiceNo || inv.id || 'N/A'}</span>
                                        <p className="text-xs text-gray-400">{inv.items ? (Array.isArray(inv.items) ? inv.items.length : inv.items) : 1} Items</p>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-800">{inv.customer?.name || inv.client || 'Unknown'}</td>
                                    <td className="px-6 py-4 text-gray-600">{inv.date ? new Date(inv.date).toLocaleDateString() : 'N/A'}</td>
                                    <td className="px-6 py-4 font-bold text-gray-800">₹{(inv.grandTotal || inv.amount || 0).toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${getStatusColor(inv.status)}`}>
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="p-2 text-gray-500 hover:text-primary-600 hover:bg-orange-50 rounded-lg transition-colors">
                                                <Printer className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                <Send className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => downloadPDF(inv)}
                                                className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                                                title="Download PDF"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setShowAssignModal(inv._id || inv.id)}
                                                className="p-2 text-gray-500 hover:text-primary-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                title="Assign Delivery"
                                            >
                                                <Truck className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination (Visual Only) */}
                <div className="p-4 border-t border-gray-200 flex justify-between items-center text-sm text-gray-500">
                    <p>Showing 3 of 142 Invoices</p>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50" disabled>Prev</button>
                        <button className="px-3 py-1 border rounded hover:bg-gray-50">Next</button>
                    </div>
                </div>
            </div>
            {/* Create Invoice Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Create New Invoice</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">×</button>
                        </div>
                        <form onSubmit={handleCreateInvoice} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Customer Name</label>
                                    <select
                                        className="input-field"
                                        required
                                        value={newInvoice.customerId || ''}
                                        onChange={(e) => {
                                            const cust = customers.find(c => c._id === e.target.value);
                                            setNewInvoice({
                                                ...newInvoice,
                                                customerId: e.target.value,
                                                customerName: cust ? cust.name : '',
                                                gstin: cust ? (cust.gstNumber || '') : ''
                                            });
                                        }}
                                    >
                                        <option value="">Select Customer</option>
                                        {customers.map(c => (
                                            <option key={c._id} value={c._id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">GSTIN</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={newInvoice.gstin}
                                        onChange={(e) => setNewInvoice({ ...newInvoice, gstin: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Date</label>
                                    <input
                                        type="date"
                                        className="input-field"
                                        required
                                        value={newInvoice.date}
                                        onChange={(e) => setNewInvoice({ ...newInvoice, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Status</label>
                                    <select
                                        className="input-field"
                                        value={newInvoice.status}
                                        onChange={(e) => setNewInvoice({ ...newInvoice, status: e.target.value })}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="paid">Paid</option>
                                        <option value="overdue">Overdue</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Select Product</label>
                                    <select
                                        className="input-field"
                                        value={newInvoice.selectedProductId}
                                        onChange={handleProductChange}
                                        required
                                    >
                                        <option value="">Select a Product</option>
                                        {products.length > 0 ? products.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} (Stock: {p.currentStock}) - ₹{p.sellingPrice}
                                            </option>
                                        )) : <option disabled>No Finished Products Available</option>}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Quantity</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        required
                                        min="1"
                                        value={newInvoice.quantity}
                                        onChange={(e) => setNewInvoice({ ...newInvoice, quantity: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Unit Price (₹)</label>
                                    <input
                                        type="number"
                                        className="input-field bg-gray-100"
                                        readOnly
                                        value={newInvoice.unitPrice}
                                    />
                                </div>
                                <div className="flex items-center">
                                    <p className="text-lg font-bold text-gray-800 mt-6">
                                        Total: ₹{(newInvoice.quantity * newInvoice.unitPrice).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Generate Invoice
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Delivery Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Assign Delivery Man</h2>
                            <button onClick={() => setShowAssignModal(null)} className="text-gray-500 hover:text-gray-700">×</button>
                        </div>
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600">Select a delivery person for Invoice {showAssignModal}</p>
                            <div className="grid grid-cols-1 gap-2">
                                {deliveryMen.map(dm => (
                                    <button
                                        key={dm._id}
                                        onClick={() => handleAssignDelivery(showAssignModal, dm._id)}
                                        className="flex items-center justify-between p-4 border rounded-xl hover:border-primary-500 hover:bg-orange-50 transition-all text-left"
                                    >
                                        <div>
                                            <p className="font-bold text-gray-800">{dm.name}</p>
                                            <p className="text-xs text-gray-500">{dm.employeeId}</p>
                                        </div>
                                        <Truck className="w-5 h-5 text-primary-500" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Simple Icon Components for specific usage in this file
const Clock = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);
const AlertCircle = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
);


export default BillingSystem;
