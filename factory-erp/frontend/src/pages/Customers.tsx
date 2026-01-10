import React, { useState } from 'react';
import {
    Search,
    Plus,
    Phone,
    Mail,
    MapPin,
    MoreVertical,
    FileText,
    Star,
    Filter,
    Download
} from 'lucide-react';

const Customers: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [customers, setCustomers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        location: '',
        gstin: '',
        category: ''
    });

    const [categories, setCategories] = useState<string[]>(['all']);
    const [activeCategory, setActiveCategory] = useState('all');

    const fetchCategories = async () => {
        try {
            const types = 'dealer,retailer,wholesaler,distributor,end_user,corporate';
            const response = await fetch(`http://localhost:5000/api/categories?type=${types}`);
            if (response.ok) {
                const data = await response.json();
                const categoryNames = Array.from(new Set(data.map((c: any) => c.name)));
                setCategories(['all', ...categoryNames as string[]]);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            setCategories(['all', 'Retailer', 'Corporate']);
        }
    };

    const fetchCustomers = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/customers');
            if (response.ok) {
                const data = await response.json();
                setCustomers(data);
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCustomer)
            });

            if (response.ok) {
                setShowAddModal(false);
                fetchCustomers();
                setNewCustomer({
                    name: '',
                    contactPerson: '',
                    email: '',
                    phone: '',
                    location: '',
                    gstin: '',
                    category: ''
                });
            } else {
                alert('Failed to add customer');
            }
        } catch (error) {
            console.error('Error adding customer:', error);
        }
    };

    React.useEffect(() => {
        fetchCustomers();
        fetchCategories();
    }, []);

    // Filter logic
    const filteredCustomers = customers.filter(c => {
        const matchesSearch = c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.email?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = activeCategory === 'all' || c.category === activeCategory;

        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Customer Management</h1>
                    <p className="text-gray-600">Manage client relationships and track history</p>
                </div>
                <div className="mt-4 md:mt-0 flex gap-3">
                    <button className="btn-secondary flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Export List
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add New Customer
                    </button>
                </div>
            </div>

            {/* Stats Cards - Calculated from REAL data */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-gray-500 text-sm font-medium">Total Customers</h3>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-800">{customers.length}</span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-gray-500 text-sm font-medium">Active Clients</h3>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-800">
                            {customers.filter(c => c.status === 'active').length}
                        </span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-gray-500 text-sm font-medium">Total Revenue</h3>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-800">
                            ₹{customers.reduce((acc, curr) => acc + (curr.totalValue || 0), 0).toLocaleString()}
                        </span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-gray-500 text-sm font-medium">Avg Rating</h3>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-800">
                            {customers.length > 0
                                ? (customers.reduce((acc, curr) => acc + (curr.rating || 0), 0) / customers.length).toFixed(1)
                                : '0.0'
                            }
                        </span>
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search customers..."
                        className="input-field pl-10 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        Filters
                    </button>
                    <select
                        className="input-field w-auto"
                        value={activeCategory}
                        onChange={(e) => setActiveCategory(e.target.value)}
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>
                                {cat === 'all' ? 'All Categories' : cat}
                            </option>
                        ))}
                    </select>
                    <select className="input-field w-auto">
                        <option>Sort by: Name</option>
                        <option>Sort by: Revenue</option>
                        <option>Sort by: Recent</option>
                    </select>
                </div>
            </div>

            {/* Customers Grid */}
            {
                isLoading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    </div>
                ) : customers.length === 0 ? (
                    <div className="text-center p-12 bg-white rounded-xl border border-gray-200 border-dashed">
                        <p className="text-gray-500 mb-4">No customers found. Add your first customer!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredCustomers.map((customer) => (
                            <div key={customer.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-orange-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-lg">
                                                {customer.name?.charAt(0) || 'C'}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-800 group-hover:text-primary-600 transition-colors">
                                                    {customer.name}
                                                </h3>
                                                <p className="text-xs text-gray-500">{customer.id}</p>
                                            </div>
                                        </div>
                                        <button className="text-gray-400 hover:text-gray-600">
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-3 text-sm text-gray-600">
                                            <User className="w-4 h-4 text-gray-400" />
                                            <span>{customer.contactPerson}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-gray-600">
                                            <Mail className="w-4 h-4 text-gray-400" />
                                            <span>{customer.email}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-gray-600">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            <span>{customer.phone}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-gray-600">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                            <span>{customer.location}</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
                                            <p className="font-bold text-gray-800">₹{(customer.totalValue || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-1 text-yellow-500 mb-1 justify-end">
                                                <Star className="w-3 h-3 fill-current" />
                                                <span className="text-xs font-bold text-gray-700">{customer.rating || 0}.0</span>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${customer.status === 'active'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {customer.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-6 py-3 rounded-b-xl flex justify-between items-center border-t border-gray-100">
                                    <button className="text-sm text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1">
                                        <FileText className="w-4 h-4" /> View Orders
                                    </button>
                                    <button className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 max-w-fit">
                                        Edit Profile
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            }
            {/* Add Customer Modal */}
            {
                showAddModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">Add New Customer</h2>
                                <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">×</button>
                            </div>
                            <form onSubmit={handleAddCustomer} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Company Name</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            required
                                            value={newCustomer.name}
                                            onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Contact Person</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            required
                                            value={newCustomer.contactPerson}
                                            onChange={(e) => setNewCustomer({ ...newCustomer, contactPerson: e.target.value })}
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
                                            value={newCustomer.email}
                                            onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Phone</label>
                                        <input
                                            type="tel"
                                            className="input-field"
                                            required
                                            value={newCustomer.phone}
                                            onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Location</label>
                                    <textarea
                                        className="input-field"
                                        rows={2}
                                        required
                                        value={newCustomer.location}
                                        onChange={(e) => setNewCustomer({ ...newCustomer, location: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">GSTIN</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        required
                                        value={newCustomer.gstin}
                                        onChange={(e) => setNewCustomer({ ...newCustomer, gstin: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Category</label>
                                    <select
                                        className="input-field"
                                        value={newCustomer.category}
                                        onChange={(e) => setNewCustomer({ ...newCustomer, category: e.target.value })}
                                    >
                                        <option value="">Select Category</option>
                                        {categories.filter(c => c !== 'all').map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
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
                                        Save Customer
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

// Helper Icon for this component
const User = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);


export default Customers;
