import React, { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    Phone,
    Mail,
    MapPin,
    Truck,
    Package,
    Clock,
    AlertCircle,
    MoreHorizontal
} from 'lucide-react';

const Vendors: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState('all');
    const [vendors, setVendors] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newVendor, setNewVendor] = useState({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        category: 'Raw Material',
        gstin: '',
        paymentTerms: '30_days'
    });

    const fetchVendors = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/vendors');
            if (response.ok) {
                const data = await response.json();
                setVendors(data);
            }
        } catch (error) {
            console.error('Error fetching vendors:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddVendor = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/api/vendors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newVendor)
            });

            if (response.ok) {
                setShowAddModal(false);
                fetchVendors();
                setNewVendor({
                    name: '',
                    contactPerson: '',
                    email: '',
                    phone: '',
                    address: '',
                    category: 'Raw Material',
                    gstin: '',
                    paymentTerms: '30_days'
                });
            } else {
                alert('Failed to add vendor');
            }
        } catch (error) {
            console.error('Error adding vendor:', error);
        }
    };

    // Dynamic Categories
    const [categories, setCategories] = useState<string[]>(['all']);

    const fetchCategories = async () => {
        try {
            const types = 'local_vendor,import_vendor,manufacturer,distributor,service_provider';
            const response = await fetch(`http://localhost:5000/api/categories?type=${types}`);
            if (response.ok) {
                const data = await response.json();
                const categoryNames = Array.from(new Set(data.map((c: any) => c.name)));
                setCategories(['all', ...categoryNames as string[]]);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            // Fallback
            setCategories(['all', 'Raw Material', 'Electronics', 'Packaging']);
        }
    };

    useEffect(() => {
        fetchVendors();
        fetchCategories();
    }, []);

    const filteredVendors = activeCategory === 'all'
        ? vendors
        : vendors.filter(v => v.category === activeCategory);

    // Stats are now 0 as they should be dynamic
    const stats = {
        activeVendors: vendors.filter(v => v.status === 'active').length,
        pendingOrders: 0, // Needs backend connection
        delayed: 0, // Needs backend connection
        monthlyExpense: 0 // Needs backend connection
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Vendor Management</h1>
                    <p className="text-gray-600">Suppliers and purchase order tracking</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary mt-4 md:mt-0 flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Onboard New Vendor
                </button>
            </div>

            {/* Procurement Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Active Vendors</p>
                            <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.activeVendors}</h3>
                        </div>
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <Truck className="w-5 h-5" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Pending Orders</p>
                            <h3 className="text-2xl font-bold text-gray-800 mt-1">₹{stats.pendingOrders}</h3>
                        </div>
                        <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Delayed Deliveries</p>
                            <h3 className="text-2xl font-bold text-red-600 mt-1">{stats.delayed}</h3>
                        </div>
                        <div className="p-2 bg-red-100 rounded-lg text-red-600">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Monthly Expense</p>
                            <h3 className="text-2xl font-bold text-gray-800 mt-1">₹{stats.monthlyExpense}</h3>
                        </div>
                        <div className="p-2 bg-green-100 rounded-lg text-green-600">
                            <Package className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Vendor Directory */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200 flex flex-col lg:flex-row justify-between gap-4">
                    {/* Categories */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === cat
                                    ? 'bg-primary-50 text-primary-700 border border-primary-200'
                                    : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                                    }`}
                            >
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative w-full lg:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Find vendor..."
                            className="input-field pl-9 py-2 text-sm"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                                <th className="px-6 py-4">Vendor</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4">Performance</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredVendors.map((vendor) => (
                                <tr key={vendor.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 font-bold">
                                                {vendor.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800">{vendor.name}</p>
                                                <p className="text-xs text-gray-500">{vendor.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 font-medium">
                                            {vendor.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        <div className="flex flex-col gap-1">
                                            <span className="flex items-center gap-2"><User className="w-3 h-3 text-gray-400" /> {vendor.contactPerson}</span>
                                            <span className="flex items-center gap-2"><Phone className="w-3 h-3 text-gray-400" /> {vendor.phone}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            <div className="text-sm font-medium text-gray-800">{vendor.rating}/5.0</div>
                                            <div className="w-20 bg-gray-200 rounded-full h-1">
                                                <div
                                                    className="bg-green-500 h-1 rounded-full"
                                                    style={{ width: `${(vendor.rating / 5) * 100}%` }}
                                                />
                                            </div>
                                            <div className="text-xs text-gray-500">{vendor.deliveryTime} avg</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${vendor.status === 'active'
                                            ? 'bg-green-50 text-green-700 border-green-200'
                                            : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${vendor.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                            {vendor.status === 'active' ? 'Active' : 'Review'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Add Vendor Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Onboard New Vendor</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">×</button>
                        </div>
                        <form onSubmit={handleAddVendor} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Company Name</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        required
                                        value={newVendor.name}
                                        onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Contact Person</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        required
                                        value={newVendor.contactPerson}
                                        onChange={(e) => setNewVendor({ ...newVendor, contactPerson: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Email</label>
                                    <input
                                        type="email"
                                        className="input-field"
                                        required
                                        value={newVendor.email}
                                        onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        className="input-field"
                                        required
                                        value={newVendor.phone}
                                        onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Address</label>
                                <textarea
                                    className="input-field"
                                    rows={2}
                                    required
                                    value={newVendor.address}
                                    onChange={(e) => setNewVendor({ ...newVendor, address: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Category</label>
                                    <select
                                        className="input-field"
                                        value={newVendor.category}
                                        onChange={(e) => setNewVendor({ ...newVendor, category: e.target.value })}
                                    >
                                        <option value="">Select Category</option>
                                        {categories.filter(c => c !== 'all').map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">GSTIN</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={newVendor.gstin}
                                        onChange={(e) => setNewVendor({ ...newVendor, gstin: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Register Vendor
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper Icon
const User = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);


export default Vendors;
