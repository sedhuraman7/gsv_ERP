import React, { useState } from 'react';
import {
    Factory,
    Clock,
    CheckCircle,
    AlertTriangle,
    Play,
    Pause,
    RotateCcw,
    Users,
    Calendar,
    ChevronRight,
    Search,
    LayoutDashboard,
    List,
    MoreVertical,
    Package,
    TrendingUp
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ProductionManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState('active');
    const [productionOrders, setProductionOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
    const [newOrder, setNewOrder] = useState({
        product: '',
        quantity: 0,
        dueDate: '',
        priority: 'normal',
        assignedTo: ''
    });

    const fetchProductionOrders = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/production`);
            if (response.ok) {
                const data = await response.json();
                // Map backend data to frontend structure
                const mappedOrders = data.map((order: any) => ({
                    _id: order._id, // Store real DB ID for updates
                    id: order.orderNo || order._id,
                    product: order.productName,
                    status: order.status,
                    currentStage: order.currentStage, // Map currentStage
                    dueDate: new Date(order.targetDate).toLocaleDateString(),
                    completed: order.producedQuantity,
                    quantity: order.quantityToProduce
                }));
                setProductionOrders(mappedOrders);
            }
        } catch (error) {
            console.error('Error fetching production orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/production/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (response.ok) {
                fetchProductionOrders();
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_BASE_URL}/api/production`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newOrder, status: 'planned', completed: 0 })
            });

            if (response.ok) {
                setShowCreateModal(false);
                fetchProductionOrders();
                setNewOrder({
                    product: '',
                    quantity: 0,
                    dueDate: '',
                    priority: 'normal',
                    assignedTo: ''
                });
            } else {
                alert('Failed to create production order');
            }
        } catch (error) {
            console.error('Create order error:', error);
        }
    };

    React.useEffect(() => {
        fetchProductionOrders();
    }, []);

    const stages = [
        {
            name: 'Raw Material',
            count: productionOrders.filter(o => o.status === 'planned' || o.status === 'pending').length,
            status: 'ok'
        },
        {
            name: 'In Production',
            // Count in-production BUT exclude testing stage
            count: productionOrders.filter(o => (o.status === 'in-progress' || o.status === 'in_production') && o.currentStage !== 'testing').length,
            status: 'ok'
        },
        {
            name: 'Quality Check',
            // Count strictly testing stage
            count: productionOrders.filter(o => o.status === 'qa-check' || (o.status === 'in_production' && o.currentStage === 'testing')).length,
            status: 'ok'
        },
        {
            name: 'Completed',
            count: productionOrders.filter(o => o.status === 'completed').length,
            status: 'ok'
        },
        { name: 'Dispatched', count: 0, status: 'ok' }
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'in-progress':
            case 'in_production': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'completed': return 'bg-green-100 text-green-700 border-green-200';
            case 'planned':
            case 'pending': return 'bg-gray-100 text-gray-700 border-gray-200';
            case 'qa-check': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'delayed': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Production Management</h1>
                    <p className="text-gray-600">Track orders, manage workflows, and monitor efficiency</p>
                </div>
                <div className="mt-4 md:mt-0 flex gap-3">
                    <div className="flex bg-gray-200 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500'}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('board')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'board' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500'}`}
                        >
                            <LayoutDashboard className="w-4 h-4" />
                        </button>
                    </div>
                    <button
                        onClick={() => setActiveTab('scheduled')}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <Calendar className="w-4 h-4" />
                        Schedule
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Play className="w-4 h-4" />
                        New Production Order
                    </button>
                </div>
            </div>

            {/* Production Stages Overview - Only Visible in List Mode */}
            {viewMode === 'list' && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                    {stages.map((stage, index) => (
                        <div
                            key={index}
                            onClick={() => {
                                if (stage.name === 'Completed') setActiveTab('completed');
                                else if (stage.name === 'Raw Material') setActiveTab('scheduled');
                                else setActiveTab('active');
                            }}
                            className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden cursor-pointer hover:shadow-md transition-all"
                        >
                            {stage.status === 'delay' && (
                                <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full m-2 animate-pulse" />
                            )}
                            <h3 className="text-sm font-medium text-gray-500 mb-1">{stage.name}</h3>
                            <div className="flex items-end justify-between">
                                <span className="text-2xl font-bold text-gray-800">{stage.count}</span>
                                <span className="text-xs text-gray-400 mb-1">Orders</span>
                            </div>
                            {index < stages.length - 1 && (
                                <div className="hidden md:block absolute top-1/2 -right-3 z-10 bg-gray-50 rounded-full p-1 border border-gray-200">
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* View Switching Logic */}
            {
                viewMode === 'board' ? (
                    <div className="overflow-x-auto pb-4">
                        <div className="flex gap-6 min-w-[1200px]">
                            {['Planned', 'In Production', 'Quality Check', 'Completed'].map((boardStage) => {
                                const stageOrders = productionOrders.filter(o => {
                                    if (boardStage === 'Planned') return o.status === 'planned' || o.status === 'pending';
                                    if (boardStage === 'In Production') return (o.status === 'in-progress' || o.status === 'in_production') && o.currentStage !== 'testing';
                                    if (boardStage === 'Quality Check') return o.status === 'qa-check' || (o.status === 'in_production' && o.currentStage === 'testing');
                                    if (boardStage === 'Completed') return o.status === 'completed';
                                    return false;
                                });

                                return (
                                    <div key={boardStage} className="flex-1 bg-gray-100 rounded-xl p-4 flex flex-col h-[calc(100vh-380px)] min-h-[500px]">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-bold text-gray-700">{boardStage}</h3>
                                            <span className="bg-white px-2 py-1 rounded-full text-xs font-bold shadow-sm">{stageOrders.length}</span>
                                        </div>
                                        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                                            {stageOrders.map(order => (
                                                <div key={order.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all group">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <h4 className="font-bold text-gray-800">{order.product}</h4>
                                                            <p className="text-xs text-gray-500">{order.id}</p>
                                                        </div>
                                                        <button className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="mb-3">
                                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                            <span>Progress</span>
                                                            <span>{Math.round((order.completed / order.quantity) * 100)}%</span>
                                                        </div>
                                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${order.status === 'completed' ? 'bg-green-500' : 'bg-primary-500'}`}
                                                                style={{ width: `${(order.completed / order.quantity) * 100}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className={`px-2 py-1 rounded bg-gray-50 text-gray-600 font-medium`}>
                                                            {order.quantity} Units
                                                        </span>
                                                        {boardStage === 'Planned' && (
                                                            <button
                                                                onClick={() => handleUpdateStatus(order._id, 'in-progress')}
                                                                className="text-primary-600 hover:text-primary-700 font-bold"
                                                            >
                                                                Start →
                                                            </button>
                                                        )}
                                                        {boardStage === 'In Production' && (
                                                            <button
                                                                onClick={() => handleUpdateStatus(order._id, 'qa-check')}
                                                                className="text-purple-600 hover:text-purple-700 font-bold"
                                                            >
                                                                To QC →
                                                            </button>
                                                        )}
                                                        {boardStage === 'Quality Check' && (
                                                            <button
                                                                onClick={() => handleUpdateStatus(order._id, 'completed')}
                                                                className="text-green-600 hover:text-green-700 font-bold"
                                                            >
                                                                Finish ✓
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    /* ListView Logic Wrapper (Start) */
                    <>

                        {/* Main Content Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Column: Orders List */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Tabs */}
                                <div className="flex items-center gap-4 border-b border-gray-200">
                                    {['Active', 'Scheduled', 'Completed'].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab.toLowerCase())}
                                            className={`pb-3 text-sm font-medium transition-colors ${activeTab === tab.toLowerCase()
                                                ? 'text-primary-600 border-b-2 border-primary-600'
                                                : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            {tab} Orders
                                        </button>
                                    ))}
                                </div>

                                {/* Orders */}
                                <div className="space-y-4">
                                    {productionOrders
                                        .filter(order => {
                                            if (activeTab === 'active') {
                                                return ['planned', 'pending', 'in-progress', 'in_production', 'qa-check'].includes(order.status);
                                            } else if (activeTab === 'completed') {
                                                return order.status === 'completed';
                                            } else if (activeTab === 'scheduled') {
                                                return order.status === 'planned';
                                            }
                                            return true;
                                        })
                                        .map((order) => (
                                            <div key={order.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                                    <div className="flex items-start gap-4">
                                                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                                            <Factory className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h3 className="text-lg font-bold text-gray-800">{order.product}</h3>
                                                                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(order.status)}`}>
                                                                    {order.status.replace('-', ' ').toUpperCase()}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-500 flex items-center gap-2">
                                                                <span>ID: {order.id}</span>
                                                                <span>•</span>
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3" /> Due: {order.dueDate}
                                                                </span>
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <button className="text-gray-500 hover:text-primary-600 border border-gray-200 p-2 rounded-lg" title="Request Materials">
                                                            <Package className="w-4 h-4" />
                                                        </button>
                                                        {order.status === 'in-progress' || order.status === 'in_production' ? (
                                                            <div className="flex gap-2">
                                                                {order.currentStage !== 'testing' && (
                                                                    <button
                                                                        onClick={() => handleUpdateStatus(order._id, 'qa-check')} // or handle stage update
                                                                        className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 flex items-center gap-2"
                                                                    >
                                                                        <CheckCircle className="w-4 h-4" /> QC
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleUpdateStatus(order._id, 'completed')}
                                                                    className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium hover:bg-yellow-200 flex items-center gap-2"
                                                                >
                                                                    <Pause className="w-4 h-4" /> Finish
                                                                </button>
                                                            </div>
                                                        ) : (order.status === 'pending' || order.status === 'planned') ? (
                                                            <button
                                                                onClick={() => handleUpdateStatus(order._id, 'in-progress')}
                                                                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 flex items-center gap-2"
                                                            >
                                                                <Play className="w-4 h-4" /> Start
                                                            </button>
                                                        ) : (
                                                            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 flex items-center gap-2">
                                                                <RotateCcw className="w-4 h-4" /> Archive
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600">Progress ({order.status === 'completed' ? 100 : Math.round((order.completed / order.quantity) * 100)}%)</span>
                                                        <span className="font-medium text-gray-900">{order.status === 'completed' ? order.quantity : order.completed} / {order.quantity} Units</span>
                                                    </div>
                                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${order.status === 'completed' ? 'bg-green-500' : 'bg-gradient-to-r from-primary-500 to-indigo-500'}`}
                                                            style={{ width: `${order.status === 'completed' ? 100 : (order.completed / order.quantity) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>

                            {/* Right Column: Stats & Alerts */}
                            <div className="space-y-6">
                                {/* Production Summary (Real Data) */}
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-gray-800">Production Summary</h3>
                                        <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs font-bold rounded-full">
                                            {productionOrders.length} Total
                                        </span>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <span className="text-gray-600">Completed Orders</span>
                                            <span className="font-bold text-green-600">
                                                {productionOrders.filter(o => o.status === 'completed').length}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <span className="text-gray-600">In Progress</span>
                                            <span className="font-bold text-blue-600">
                                                {productionOrders.filter(o => o.status === 'in_production' || o.status === 'in-progress').length}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <span className="text-gray-600">Planned / Pending</span>
                                            <span className="font-bold text-gray-700">
                                                {productionOrders.filter(o => o.status === 'planned' || o.status === 'pending').length}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="w-4 h-4 text-blue-600" />
                                                <span className="text-blue-900 font-medium">Efficiency</span>
                                            </div>
                                            <span className="font-bold text-blue-700">94%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            {/* Create Order Modal */}
            {
                showCreateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-800">New Production Order</h2>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ×
                                </button>
                            </div>
                            <form onSubmit={handleCreateOrder} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="Enter product name (e.g. Solar Inverter)"
                                        value={newOrder.product}
                                        onChange={(e) => setNewOrder({ ...newOrder, product: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        value={newOrder.quantity}
                                        onChange={(e) => setNewOrder({ ...newOrder, quantity: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        value={newOrder.dueDate}
                                        onChange={(e) => setNewOrder({ ...newOrder, dueDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        value={newOrder.priority}
                                        onChange={(e) => setNewOrder({ ...newOrder, priority: e.target.value })}
                                    >
                                        <option value="normal">Normal</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign Supervisor</label>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        value={newOrder.assignedTo}
                                        onChange={(e) => setNewOrder({ ...newOrder, assignedTo: e.target.value })}
                                    >
                                        <option value="">Select Supervisor...</option>
                                        <option value="John Doe">John Doe</option>
                                        <option value="Jane Smith">Jane Smith</option>
                                        <option value="Mike Johnson">Mike Johnson</option>
                                    </select>
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
                                    >
                                        Create Order
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
        </div>
    );
};

export default ProductionManagement;
