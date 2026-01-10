import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Package, Layers, Filter, Save, Users, Building, DollarSign, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';

interface Category {
    _id?: string;
    id?: string; // For backward compatibility if needed
    code: string;
    name: string;
    type: string;
    description: string;
    gstRate?: number;
    unit?: string;
    minStock?: number;
    maxStock?: number;
    isActive: boolean;
    attributes: string[];
}

const MODULES = [
    { id: 'inventory', label: 'Products', icon: Package, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
    { id: 'vendor', label: 'Vendors', icon: Users, color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
    { id: 'client', label: 'Clients', icon: Briefcase, color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
    { id: 'expense', label: 'Expenses', icon: DollarSign, color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' }
];

const MODULE_TYPES: any = {
    inventory: [
        { value: 'raw_material', label: 'Raw Material' },
        { value: 'semi_finished', label: 'Semi-Finished' },
        { value: 'finished_product', label: 'Finished Product' },
        { value: 'spare_parts', label: 'Spare Parts' },
        { value: 'consumables', label: 'Consumables' }
    ],
    vendor: [
        { value: 'local_vendor', label: 'Local Vendor' },
        { value: 'import_vendor', label: 'Import Vendor' },
        { value: 'manufacturer', label: 'Manufacturer' },
        { value: 'distributor', label: 'Distributor' },
        { value: 'service_provider', label: 'Service Provider' }
    ],
    client: [
        { value: 'dealer', label: 'Dealer' },
        { value: 'distributor', label: 'Distributor' },
        { value: 'wholesaler', label: 'Wholesaler' },
        { value: 'retailer', label: 'Retailer' },
        { value: 'corporate', label: 'Corporate' },
        { value: 'end_user', label: 'End User' }
    ],
    expense: [
        { value: 'operational', label: 'Operational' },
        { value: 'capital', label: 'Capital' },
        { value: 'payroll', label: 'Payroll' },
        { value: 'maintenance', label: 'Maintenance' }
    ]
};

const CategoryManager: React.FC = () => {
    const [currentModule, setCurrentModule] = useState('inventory');
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [newCategory, setNewCategory] = useState<Category>({
        code: '',
        name: '',
        type: MODULE_TYPES['inventory'][0].value,
        description: '',
        gstRate: 18,
        unit: 'piece',
        minStock: 0,
        maxStock: 0,
        isActive: true,
        attributes: []
    });

    const [editingId, setEditingId] = useState<string | null>(null);
    const [newAttribute, setNewAttribute] = useState('');

    useEffect(() => {
        fetchCategories();
    }, [currentModule]);

    // Reset form type when module changes
    useEffect(() => {
        setNewCategory(prev => ({
            ...prev,
            type: MODULE_TYPES[currentModule][0].value
        }));
    }, [currentModule]);

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            // Get all types for the current module
            const types = MODULE_TYPES[currentModule].map((t: any) => t.value).join(',');
            const response = await fetch(`http://localhost:5000/api/categories?type=${types}`);

            if (!response.ok) throw new Error('Failed to fetch categories');

            const data = await response.json();
            setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Could not load categories');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddCategory = async () => {
        if (!newCategory.code || !newCategory.name) {
            toast.error('Code and Name are required');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCategory)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to add category');
            }

            toast.success('Category added successfully');
            fetchCategories();
            resetForm();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleUpdateCategory = async (id: string) => {
        try {
            const response = await fetch(`http://localhost:5000/api/categories/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCategory)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to update category');
            }

            toast.success('Category updated successfully');
            fetchCategories();
            setEditingId(null);
            resetForm();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                const response = await fetch(`http://localhost:5000/api/categories/${id}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    throw new Error('Failed to delete category');
                }

                toast.success('Category deleted successfully');
                fetchCategories();
            } catch (error: any) {
                toast.error(error.message);
            }
        }
    };

    const resetForm = () => {
        setNewCategory({
            code: '',
            name: '',
            type: MODULE_TYPES[currentModule][0].value,
            description: '',
            gstRate: 18,
            unit: 'piece',
            minStock: 0,
            maxStock: 0,
            isActive: true,
            attributes: []
        });
    };

    const addAttribute = () => {
        if (newAttribute && !newCategory.attributes.includes(newAttribute)) {
            setNewCategory({
                ...newCategory,
                attributes: [...newCategory.attributes, newAttribute]
            });
            setNewAttribute('');
        }
    };

    const removeAttribute = (attr: string) => {
        setNewCategory({
            ...newCategory,
            attributes: newCategory.attributes.filter(a => a !== attr)
        });
    };

    const getModuleColor = (id: string) => {
        const module = MODULES.find(m => m.id === id);
        return module ? module.color : 'text-gray-600';
    };

    return (
        <div className="space-y-6">
            {/* Header & Module Selection */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Category Manager</h2>
                    <p className="text-gray-600">Manage categories across different modules</p>
                </div>

                <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
                    {MODULES.map(module => (
                        <button
                            key={module.id}
                            onClick={() => setCurrentModule(module.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${currentModule === module.id
                                ? `${module.bgColor} ${module.color}`
                                : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            <module.icon className="w-4 h-4" />
                            {module.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Add/Edit Form */}
            <div className={`card p-6 border-t-4 ${MODULES.find(m => m.id === currentModule)?.borderColor}`}>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    {editingId ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    {editingId ? 'Edit Category' : 'Add New Category'}
                    <span className={`text-sm font-normal ml-2 px-2 py-0.5 rounded-full ${MODULES.find(m => m.id === currentModule)?.bgColor} ${MODULES.find(m => m.id === currentModule)?.color}`}>
                        {MODULES.find(m => m.id === currentModule)?.label}
                    </span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category Code *
                            </label>
                            <input
                                type="text"
                                value={newCategory.code}
                                onChange={(e) => setNewCategory({ ...newCategory, code: e.target.value.toUpperCase() })}
                                placeholder="e.g., RM-001"
                                className="input-field font-mono"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category Name *
                            </label>
                            <input
                                type="text"
                                value={newCategory.name}
                                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                placeholder="Category Name"
                                className="input-field"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category Type
                            </label>
                            <select
                                value={newCategory.type}
                                onChange={(e) => setNewCategory({ ...newCategory, type: e.target.value })}
                                className="input-field"
                            >
                                {MODULE_TYPES[currentModule]?.map((type: any) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Inventory Specific Fields */}
                        {currentModule === 'inventory' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    GST Rate (%)
                                </label>
                                <select
                                    value={newCategory.gstRate}
                                    onChange={(e) => setNewCategory({ ...newCategory, gstRate: Number(e.target.value) })}
                                    className="input-field"
                                >
                                    <option value={0}>0% (Exempt)</option>
                                    <option value={5}>5%</option>
                                    <option value={12}>12%</option>
                                    <option value={18}>18%</option>
                                    <option value={28}>28%</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                value={newCategory.description}
                                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                                rows={3}
                                className="input-field"
                                placeholder="Category description..."
                            />
                        </div>

                        {currentModule === 'inventory' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Unit
                                    </label>
                                    <select
                                        value={newCategory.unit}
                                        onChange={(e) => setNewCategory({ ...newCategory, unit: e.target.value })}
                                        className="input-field"
                                    >
                                        <option value="piece">Piece</option>
                                        <option value="kg">Kilogram</option>
                                        <option value="meter">Meter</option>
                                        <option value="liter">Liter</option>
                                        <option value="box">Box</option>
                                        <option value="set">Set</option>
                                        <option value="roll">Roll</option>
                                    </select>
                                </div>

                                <div className='grid grid-cols-2 gap-2'>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Min Stock
                                        </label>
                                        <input
                                            type="number"
                                            value={newCategory.minStock}
                                            onChange={(e) => setNewCategory({ ...newCategory, minStock: Number(e.target.value) })}
                                            className="input-field"
                                            min="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Max Stock
                                        </label>
                                        <input
                                            type="number"
                                            value={newCategory.maxStock}
                                            onChange={(e) => setNewCategory({ ...newCategory, maxStock: Number(e.target.value) })}
                                            className="input-field"
                                            min="0"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Attributes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Custom Attributes
                            </label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={newAttribute}
                                    onChange={(e) => setNewAttribute(e.target.value)}
                                    placeholder="e.g., materialGrade"
                                    className="input-field flex-1"
                                    onKeyPress={(e) => e.key === 'Enter' && addAttribute()}
                                />
                                <button
                                    onClick={addAttribute}
                                    className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
                                >
                                    Add
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {newCategory.attributes.map(attr => (
                                    <span
                                        key={attr}
                                        className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm flex items-center gap-1"
                                    >
                                        {attr}
                                        <button
                                            onClick={() => removeAttribute(attr)}
                                            className="text-gray-500 hover:text-red-500"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                    {editingId && (
                        <button
                            onClick={() => {
                                setEditingId(null);
                                resetForm();
                            }}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        onClick={editingId ? () => handleUpdateCategory(editingId) : handleAddCategory}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Save className="h-4 w-4" />
                        {editingId ? 'Update Category' : 'Add Category'}
                    </button>
                </div>
            </div>

            {/* Categories List */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500">Loading categories...</div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Code
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    {currentModule === 'inventory' && (
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Details
                                        </th>
                                    )}
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {categories.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                            No categories found for {MODULES.find(m => m.id === currentModule)?.label}.
                                        </td>
                                    </tr>
                                ) : (
                                    categories.map((category) => {
                                        const typeLabel = MODULE_TYPES[currentModule]?.find((t: any) => t.value === category.type)?.label || category.type;

                                        return (
                                            <tr key={category._id || category.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="font-mono font-medium text-gray-900">
                                                        {category.code}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900">{category.name}</div>
                                                    {category.description && (
                                                        <div className="text-sm text-gray-500 truncate max-w-xs">{category.description}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800`}>
                                                        {typeLabel}
                                                    </span>
                                                </td>
                                                {currentModule === 'inventory' && (
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <div>GST: {category.gstRate}%</div>
                                                        <div>Unit: {category.unit}</div>
                                                    </td>
                                                )}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${category.isActive
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {category.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setNewCategory(category);
                                                                setEditingId(category._id || category.id || null);
                                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                                            }}
                                                            className="text-primary-600 hover:text-primary-900"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteCategory(category._id || category.id!)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CategoryManager;
