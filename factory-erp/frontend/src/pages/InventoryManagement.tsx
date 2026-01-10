import React, { useState } from 'react';
import {
    Search,
    Plus,
    Filter,
    Download,
    Upload,
    Package,
    AlertCircle,
    Edit,
    Trash2,
    Eye,
    BarChart3,
    RefreshCw,
    Scan
} from 'lucide-react';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import BarcodeScanner from '../components/BarcodeScanner';

const InventoryManagement: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [lowStockFilter, setLowStockFilter] = useState(false);
    const [inventoryItems, setInventoryItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showScanner, setShowScanner] = useState(false);

    // New State for Edit Mode
    const [editingItem, setEditingItem] = useState<any>(null);

    const [newItem, setNewItem] = useState({
        id: '', // Added id
        name: '',
        category: 'Raw Material',
        unit: 'kg',
        currentStock: 0,
        minStockLevel: 0,
        maxStockLevel: 0,
        type: 'raw' // 'raw' or 'finished'
    });

    // Transfer State
    const [transferData, setTransferData] = useState({ itemId: '', quantity: '', from: 'Main Store', to: 'Assembly Line 1' });
    const [transactions, setTransactions] = useState<any[]>([]);

    const handleTransfer = async () => {
        if (!transferData.itemId || !transferData.quantity) {
            alert('Please select an item and quantity');
            return;
        }

        const item = inventoryItems.find(i => i.id === transferData.itemId);
        if (!item) return;

        const qty = parseInt(transferData.quantity);
        if (qty > item.currentStock) {
            alert('Insufficient stock! You only have ' + item.currentStock + ' ' + item.unit);
            return;
        }

        try {
            // 1. Update Backend (Deduct Stock)
            const response = await fetch(`http://localhost:5000/api/inventory/${item._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: item.type,
                    currentStock: item.currentStock - qty
                })
            });

            if (response.ok) {
                // 2. Add to Local History
                const newTransaction = {
                    id: Date.now(),
                    item: item.name,
                    qty: qty,
                    from: transferData.from,
                    to: transferData.to,
                    time: new Date().toLocaleTimeString()
                };
                setTransactions([newTransaction, ...transactions]);

                // 3. Refresh Data
                await fetchInventory();
                setTransferData({ ...transferData, itemId: '', quantity: '' });
                // alert('Stock Transferred Successfully!'); // Optional: removed to rely on UI feedback
            } else {
                alert('Transfer Failed. Server Error.');
            }
        } catch (error) {
            console.error(error);
            alert('Error transferring stock');
        }
    };

    const handleQuickReorder = (itemName: string) => {
        alert(`Reorder request initiated for ${itemName}. Procurement team notified.`);
    };

    const fetchInventory = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/inventory');
            if (response.ok) {
                const data = await response.json();
                setInventoryItems(data);
            }
        } catch (error) {
            console.error('Error fetching inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    // Categories State
    const [categories, setCategories] = useState<string[]>(['all']);

    const fetchCategories = async () => {
        try {
            // Fetch all inventory related categories
            const types = 'raw_material,semi_finished,finished_product,spare_parts,consumables';
            const response = await fetch(`http://localhost:5000/api/categories?type=${types}`);
            if (response.ok) {
                const data = await response.json();
                // Extract unique category names
                const categoryNames = Array.from(new Set(data.map((c: any) => c.name)));
                setCategories(['all', ...categoryNames as string[]]);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            // Fallback
            setCategories(['all', 'Raw Material', 'Finished Product']);
        }
    };

    React.useEffect(() => {
        fetchInventory();
        fetchCategories();
    }, []);

    // Handle Delete
    const handleDelete = async (item: any) => {
        if (!window.confirm(`Are you sure you want to delete ${item.name}?`)) return;

        try {
            await fetch(`http://localhost:5000/api/inventory/${item._id}?type=${item.type}`, {
                method: 'DELETE'
            });
            fetchInventory();
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    };

    // Handle Edit (Open Modal with Data)
    const handleEdit = (item: any) => {
        setEditingItem(item);
        setNewItem({
            id: item.id || '', // Populate ID
            name: item.name,
            category: item.category,
            unit: item.unit,
            currentStock: item.currentStock,
            minStockLevel: item.minStock || item.minStockLevel, // Handle variations if any
            maxStockLevel: item.maxStock || item.maxStockLevel,
            type: item.type
        });
        setShowAddModal(true);
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingItem
                ? `http://localhost:5000/api/inventory/${editingItem._id}`
                : 'http://localhost:5000/api/inventory';

            const method = editingItem ? 'PUT' : 'POST';

            // If editing, include type in body so backend knows which collection to update
            const body = editingItem
                ? { ...newItem, type: editingItem.type }
                : newItem;

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (response.ok) {
                setShowAddModal(false);
                setEditingItem(null); // Reset
                fetchInventory();
                setNewItem({
                    id: '', // Reset id
                    name: '',
                    category: categories[1] || 'Raw Material', // Default to first available
                    unit: 'kg',
                    currentStock: 0,
                    minStockLevel: 0,
                    maxStockLevel: 0,
                    type: 'raw'
                });
            } else {
                alert('Failed to save item: ' + (data.message || 'Unknown Error'));
            }
        } catch (error) {
            console.error('Error saving item:', error);
        }
    };

    const handleScan = (code: string) => {
        setSearchQuery(code);
        setShowScanner(false);
    };

    // Filter items
    const filteredItems = inventoryItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.id && item.id.toLowerCase().includes(searchQuery.toLowerCase())); // Check item.id exist
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
        const matchesLowStock = !lowStockFilter || item.status === 'low';

        return matchesSearch && matchesCategory && matchesLowStock;
    });

    // Excel Import Logic
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleImportClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet);

                setLoading(true);
                let successCount = 0;
                let failCount = 0;

                for (const row of (jsonData as any[])) {
                    // Map Excel columns to API fields
                    const payload = {
                        id: row['Item ID'] || row['ID'] || '',
                        name: row['Name'] || row['Item Name'],
                        category: row['Category'] || 'Raw Material',
                        unit: row['Unit'] || 'kg',
                        currentStock: Number(row['Current Stock'] || row['Stock'] || 0),
                        minStockLevel: Number(row['Min Stock'] || row['Minimum'] || 0),
                        maxStockLevel: Number(row['Max Stock'] || row['Maximum'] || 0),
                        type: (row['Type'] || 'raw').toLowerCase().includes('finished') ? 'finished' : 'raw'
                    };

                    if (!payload.name) continue; // Skip empty rows

                    try {
                        const response = await fetch('http://localhost:5000/api/inventory', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });
                        if (response.ok) successCount++;
                        else failCount++;
                    } catch (err) {
                        failCount++;
                    }
                }

                alert(`Import Complete!\nSuccess: ${successCount}\nFailed: ${failCount}`);
                fetchInventory();
            } catch (error) {
                console.error('Import error:', error);
                alert('Failed to process file. Ensure it is a valid Excel file.');
            } finally {
                setLoading(false);
                if (fileInputRef.current) {
                    fileInputRef.current.value = ''; // Reset input
                }
            }
        };
        reader.readAsArrayBuffer(file);
    };

    // Download Excel
    const downloadExcelReport = () => {
        const ws = XLSX.utils.json_to_sheet(filteredItems.map(item => ({
            'Item ID': item.id,
            'Name': item.name,
            'Category': item.category,
            'Current Stock': item.currentStock,
            'Minimum Stock': item.minStock,
            'Maximum Stock': item.maxStock,
            'Location': item.location,
            'Status': item.status === 'low' ? 'Low Stock' : 'OK',
            'Last Updated': item.lastUpdated
        })));

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Inventory Report');
        XLSX.writeFile(wb, `inventory_report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // Calculate Statistics
    const stats = {
        totalItems: inventoryItems.length,
        lowStockItems: inventoryItems.filter(item => item.status === 'low').length,
        totalValue: '₹12.5L',
        reorderNeeded: inventoryItems.filter(item => item.currentStock < item.minStock).length
    };

    const getStockPercentage = (current: number, min: number, max: number) => {
        const range = max - min;
        const position = current - min;
        if (range <= 0) return 100; // Avoid divide by zero
        return Math.max(0, Math.min(100, (position / range) * 100));
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">GSV Inventory Management</h1>
                    <p className="text-gray-600">Monitor and manage raw materials and finished goods</p>
                </div>

                <div className="flex flex-wrap gap-3 mt-4 lg:mt-0">
                    <button
                        onClick={() => setShowScanner(true)}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <Scan className="h-4 w-4" />
                        Scan Barcode
                    </button>
                    <button
                        onClick={() => {
                            setEditingItem(null);
                            setNewItem({
                                id: '',
                                name: '',
                                category: 'Raw Material',
                                unit: 'kg',
                                currentStock: 0,
                                minStockLevel: 0,
                                maxStockLevel: 0,
                                type: 'raw'
                            });
                            setShowAddModal(true);
                        }}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add New Item
                    </button>
                    <button
                        onClick={downloadExcelReport}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Export Excel
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".xlsx, .xls"
                        className="hidden"
                    />
                    <button
                        onClick={handleImportClick}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <Upload className="h-4 w-4" />
                        Import Stock
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="card-orange p-6">
                    <div className="flex items-center justify-between mb-4">
                        <Package className="h-8 w-8 text-primary-600" />
                        <div className="text-2xl font-bold text-gray-800">{stats.totalItems}</div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700">Total Items</h3>
                    <p className="text-gray-600 text-sm">Across all categories</p>
                </div>

                <div className="card p-6 border-red-200">
                    <div className="flex items-center justify-between mb-4">
                        <AlertCircle className="h-8 w-8 text-red-500" />
                        <div className="text-2xl font-bold text-red-600">{stats.lowStockItems}</div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700">Low Stock Items</h3>
                    <p className="text-gray-600 text-sm">Require immediate attention</p>
                </div>

                <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <BarChart3 className="h-8 w-8 text-green-600" />
                        <div className="text-2xl font-bold text-gray-800">{stats.totalValue}</div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700">Total Inventory Value</h3>
                    <p className="text-gray-600 text-sm">Current stock valuation</p>
                </div>

                <div className="card p-6 border-orange-200">
                    <div className="flex items-center justify-between mb-4">
                        <RefreshCw className="h-8 w-8 text-orange-500" />
                        <div className="text-2xl font-bold text-orange-600">{stats.reorderNeeded}</div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700">Reorder Needed</h3>
                    <p className="text-gray-600 text-sm">Below minimum level</p>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="card p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search Items</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by name or code..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input-field pl-10"
                            />
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="input-field"
                        >
                            {categories.map(category => (
                                <option key={category} value={category}>
                                    {category === 'all' ? 'All Categories' : category}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Low Stock Filter */}
                    <div className="flex items-end">
                        <label className="flex items-center space-x-3 cursor-pointer">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={lowStockFilter}
                                    onChange={(e) => setLowStockFilter(e.target.checked)}
                                    className="sr-only"
                                />
                                <div className={`w-10 h-6 rounded-full transition-colors ${lowStockFilter ? 'bg-red-500' : 'bg-gray-300'
                                    }`}>
                                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${lowStockFilter ? 'translate-x-4' : ''
                                        }`} />
                                </div>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">Show Low Stock Only</span>
                                <p className="text-sm text-gray-600">Items below minimum level</p>
                            </div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-primary-500 to-orange-500">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                    Item ID
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                    Category
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                    Stock Level
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                    Location
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredItems.map((item, index) => {
                                const stockPercentage = getStockPercentage(
                                    item.currentStock,
                                    item.minStock,
                                    item.maxStock
                                );

                                return (
                                    <tr key={index} className="hover:bg-orange-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-mono font-bold text-primary-700">{item.id}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{item.name}</div>
                                            <div className="text-sm text-gray-600">{item.unit}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.category === 'Raw Material' ? 'bg-blue-100 text-blue-800' :
                                                item.category === 'Semi-Finished' ? 'bg-purple-100 text-purple-800' :
                                                    item.category === 'Finished' ? 'bg-green-100 text-green-800' :
                                                        'bg-gray-100 text-gray-800'
                                                }`}>
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Available</span>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-2xl font-bold ${item.currentStock < item.minStock ? 'text-red-600' : 'text-gray-800'}`}>
                                                        {item.currentStock}
                                                    </span>
                                                    <span className="text-sm font-medium text-gray-500">{item.unit}</span>
                                                </div>

                                                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                                                    <div
                                                        className={`h-1.5 rounded-full ${stockPercentage < 30 ? 'bg-red-500' :
                                                            stockPercentage < 70 ? 'bg-yellow-500' :
                                                                'bg-green-500'
                                                            }`}
                                                        style={{ width: `${stockPercentage}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between text-xs text-gray-400 mt-1">
                                                    <span>Min: {item.minStock}</span>
                                                    <span>Max: {item.maxStock}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-gray-900">{item.location}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.status === 'low'
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-green-100 text-green-800'
                                                }`}>
                                                {item.status === 'low' ? 'Low Stock' : 'In Stock'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    onClick={() => handleEdit(item)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    className="p-2 text-primary-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                    onClick={() => handleEdit(item)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    onClick={() => handleDelete(item)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Table Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    {/* ... (Existing Footer code) */}
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Showing <span className="font-semibold">{filteredItems.length}</span> of{' '}
                            <span className="font-semibold">{inventoryItems.length}</span> items
                        </div>
                        <div className="flex items-center space-x-2">
                            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                                Previous
                            </button>
                            <span className="px-3 py-2 text-sm font-medium text-primary-700">
                                Page 1 of 3
                            </span>
                            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions Panel */}
            {/* ... (Existing Quick Actions code) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">

                <div className="card p-6 flex flex-col h-full">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Stock Transfer</h3>
                    <div className="space-y-4 mb-6">
                        <select
                            className="input-field"
                            value={transferData.itemId}
                            onChange={(e) => setTransferData({ ...transferData, itemId: e.target.value })}
                        >
                            <option value="">Select Item</option>
                            {inventoryItems.map(item => (
                                <option key={item.id} value={item.id}>{item.name} ({item.currentStock})</option>
                            ))}
                        </select>
                        <input
                            type="number"
                            placeholder="Quantity"
                            className="input-field"
                            value={transferData.quantity}
                            onChange={(e) => setTransferData({ ...transferData, quantity: e.target.value })}
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <select
                                className="input-field"
                                value={transferData.from}
                                onChange={(e) => setTransferData({ ...transferData, from: e.target.value })}
                            >
                                <option>Main Store</option>
                                <option>Godown 1</option>
                            </select>
                            <select
                                className="input-field"
                                value={transferData.to}
                                onChange={(e) => setTransferData({ ...transferData, to: e.target.value })}
                            >
                                <option>Assembly</option>
                                <option>Packing</option>
                            </select>
                        </div>

                        <button
                            className="w-full btn-primary"
                            onClick={handleTransfer}
                        >
                            Transfer Stock
                        </button>
                    </div>

                    {/* Transaction History Section */}
                    {transactions.length > 0 && (
                        <div className="mt-auto pt-4 border-t border-gray-100">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Recent Activity</h4>
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                {transactions.map(tx => (
                                    <div key={tx.id} className="text-xs bg-gray-50 p-2 rounded border border-gray-100">
                                        <div className="flex justify-between font-medium text-gray-800">
                                            <span>{tx.item}</span>
                                            <span className="text-orange-600">-{tx.qty}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-500 mt-1">
                                            <span>{tx.to}</span>
                                            <span>{tx.time}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Reorder</h3>
                    <div className="space-y-3">
                        {inventoryItems
                            .filter(item => item.status === 'low')
                            .slice(0, 3)
                            .map((item, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                    <div>
                                        <div className="font-medium">{item.name}</div>
                                        <div className="text-sm text-gray-600">Current: {item.currentStock} {item.unit}</div>
                                    </div>
                                    <button
                                        className="px-3 py-1 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"
                                        onClick={() => handleQuickReorder(item.name)}
                                    >
                                        Reorder
                                    </button>
                                </div>
                            ))}
                        <button className="w-full btn-secondary mt-4">
                            View All Low Stock Items
                        </button>
                    </div>
                </div>

                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Inventory Summary</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-700">Total Items Value</span>
                            <span className="font-bold text-primary-600">₹12,50,000</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-700">Monthly Consumption</span>
                            <span className="font-bold text-green-600">₹3,20,000</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-700">Reorder Value</span>
                            <span className="font-bold text-red-600">₹1,80,000</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-700">Stock Turnover Ratio</span>
                            <span className="font-bold text-blue-600">4.2</span>
                        </div>
                        <button className="w-full btn-primary flex items-center justify-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            View Detailed Report
                        </button>
                    </div>
                </div>
            </div>

            {/* Add Item Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">×</button>
                        </div>
                        <form onSubmit={handleAddItem} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Item Type</label>
                                <select
                                    className="input-field"
                                    value={newItem.type}
                                    onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
                                    disabled={!!editingItem} // Disable Type change on Edit
                                >
                                    <option value="raw">Raw Material</option>
                                    <option value="finished">Finished Product</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Item ID / Code</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    required
                                    placeholder="e.g. RM-001 or ELEC-CPU-005"
                                    value={newItem.id}
                                    onChange={(e) => setNewItem({ ...newItem, id: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    required
                                    value={newItem.name}
                                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Category</label>
                                <select
                                    className="input-field"
                                    value={newItem.category}
                                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                                >
                                    <option value="Raw Material">Raw Material</option>
                                    <option value="Electronic">Electronic</option>
                                    <option value="Metal">Metal</option>
                                    <option value="Plastic">Plastic</option>
                                    <option value="Packaging">Packaging</option>
                                    <option value="Consumer Goods">Consumer Goods</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Unit</label>
                                    <select
                                        className="input-field"
                                        value={newItem.unit}
                                        onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                                    >
                                        <option value="kg">kg</option>
                                        <option value="liter">liter</option>
                                        <option value="piece">piece</option>
                                        <option value="meter">meter</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Current Stock</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        value={newItem.currentStock}
                                        onChange={(e) => setNewItem({ ...newItem, currentStock: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Min Stock</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        value={newItem.minStockLevel}
                                        onChange={(e) => setNewItem({ ...newItem, minStockLevel: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Max Stock</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        value={newItem.maxStockLevel}
                                        onChange={(e) => setNewItem({ ...newItem, maxStockLevel: Number(e.target.value) })}
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
                                    {editingItem ? 'Update Item' : 'Save Item'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {showScanner && (
                <BarcodeScanner
                    onScan={handleScan}
                    onClose={() => setShowScanner(false)}
                />
            )}
        </div>
    );
};

export default InventoryManagement;
