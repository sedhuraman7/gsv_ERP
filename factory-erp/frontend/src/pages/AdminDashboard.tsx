import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BarChart3,
    Package,
    Users,
    DollarSign,
    TrendingUp,
    Factory,
    FileText,
    ShoppingCart,
    AlertCircle,
    Download,
    Printer,
    Filter
} from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [timeRange, setTimeRange] = useState('today');
    const [statsData, setStatsData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchDashboardStats = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/dashboard');
            if (response.ok) {
                const data = await response.json();
                setStatsData(data);
            }
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchDashboardStats();
    }, []);

    // Connect real data
    const salesData: any[] = statsData?.salesTrend || [];
    const productionData: any[] = statsData?.productionTrend || [];
    const inventoryData: any[] = statsData?.inventoryDistribution || [];
    const lowStockItems: any[] = statsData?.lowStockItems || [];
    const pendingPayments: any[] = statsData?.pendingPaymentsList || [];

    // Download Reports (Connected to real data)
    const downloadExcel = () => {
        if (!statsData) return;
        const ws = XLSX.utils.json_to_sheet(statsData.salesTrend);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sales Trend");
        XLSX.writeFile(wb, "dashboard_report.xlsx");
    };

    const downloadPDF = () => {
        if (!statsData) return;
        const doc = new jsPDF();
        doc.text("Factory Dashboard Report", 20, 10);
        // @ts-ignore
        doc.autoTable({
            head: [['Day', 'Sales', 'Target']],
            body: statsData.salesTrend.map((s: any) => [s.day, s.sales, s.target]),
        });
        doc.save("dashboard_report.pdf");
    };

    const stats = [
        {
            title: 'Today\'s Sales',
            value: statsData ? `₹${statsData.sales.value.toLocaleString()}` : '₹0',
            change: '+0%', // Placeholder
            icon: <DollarSign className="h-8 w-8" />,
            color: 'bg-green-100 text-green-800',
            iconColor: 'text-green-600'
        },
        {
            title: 'Production Output',
            value: statsData ? `${statsData.production.value}%` : '0%',
            change: '+0%',
            icon: <Factory className="h-8 w-8" />,
            color: 'bg-blue-100 text-blue-800',
            iconColor: 'text-blue-600'
        },
        {
            title: 'GST Collection',
            value: statsData ? `₹${statsData.gst.value.toLocaleString()}` : '₹0',
            change: '+0%',
            icon: <FileText className="h-8 w-8" />,
            color: 'bg-purple-100 text-purple-800',
            iconColor: 'text-purple-600'
        },
        {
            title: 'Pending Payments',
            value: statsData ? `₹${(statsData.pendingPayments.value / 1000).toFixed(1)}K` : '₹0',
            change: '0%',
            icon: <AlertCircle className="h-8 w-8" />,
            color: 'bg-red-100 text-red-800',
            iconColor: 'text-red-600'
        },
        {
            title: 'Active Users',
            value: statsData ? statsData.activeUsers.value : '0',
            change: '+0%',
            icon: <Users className="h-8 w-8" />,
            color: 'bg-orange-100 text-orange-800',
            iconColor: 'text-orange-600'
        },
        {
            title: 'Inventory Value',
            value: statsData ? `₹${(statsData.inventoryValue.value / 100000).toFixed(2)}L` : '₹0',
            change: '+0%',
            icon: <Package className="h-8 w-8" />,
            color: 'bg-indigo-100 text-indigo-800',
            iconColor: 'text-indigo-600'
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Factory Dashboard</h1>
                    <p className="text-gray-600">Welcome back, Admin! Here's your overview.</p>
                </div>

                <div className="flex items-center space-x-4 mt-4 md:mt-0">
                    <select
                        className="input-field w-40"
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                    >
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="quarter">This Quarter</option>
                    </select>

                    <button
                        onClick={downloadExcel}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Excel
                    </button>

                    <button
                        onClick={downloadPDF}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Printer className="h-4 w-4" />
                        PDF Report
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <div key={index} className="card-orange p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-lg ${stat.color.split(' ')[0]}`}>
                                <div className={stat.iconColor}>{stat.icon}</div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${stat.change.startsWith('+') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {stat.change}
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-1">{stat.value}</h3>
                        <p className="text-gray-600 text-sm">{stat.title}</p>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Sales Trend */}
                <div className="card">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-800">Sales Trend</h3>
                            <p className="text-gray-600">Last 7 days performance</p>
                        </div>
                        <BarChart3 className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={salesData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Tooltip
                                    formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Amount']}
                                    labelStyle={{ color: '#1f2937', fontWeight: 'bold' }}
                                />
                                <Legend />
                                <Bar dataKey="sales" name="Actual Sales" fill="#f97316" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="target" name="Target" fill="#d1d5db" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Production Efficiency */}
                <div className="card">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-800">Production Efficiency</h3>
                            <p className="text-gray-600">Stage-wise completion rate</p>
                        </div>
                        <TrendingUp className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={productionData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="stage" />
                                <YAxis domain={[0, 100]} />
                                <Tooltip formatter={(value) => [`${value}%`, 'Efficiency']} />
                                <Legend />
                                <Bar dataKey="efficiency" name="Efficiency %" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="target" name="Target %" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Lower Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Inventory Distribution */}
                <div className="card">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-800">Inventory Distribution</h3>
                            <p className="text-gray-600">Stock category breakdown</p>
                        </div>
                        <Package className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={inventoryData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {inventoryData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => [`${value}%`, 'Share']} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Low Stock Alerts */}
                <div className="card">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-800">Low Stock Alerts</h3>
                            <p className="text-gray-600">Items below minimum level</p>
                        </div>
                        <AlertCircle className="h-6 w-6 text-red-500" />
                    </div>
                    <div className="space-y-4">
                        {lowStockItems.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                                <div>
                                    <div className="font-medium text-gray-800">{item.name}</div>
                                    <div className="text-sm text-gray-600">{item.id}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-red-600">{item.current}/{item.min}</div>
                                    <div className="text-sm text-gray-600">
                                        {item.current < item.min ? 'Reorder needed' : 'Stock okay'}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button className="w-full btn-secondary mt-4" onClick={() => navigate('/inventory')}>
                            View All Inventory
                        </button>
                    </div>
                </div>

                {/* Pending Payments */}
                <div className="card">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-800">Pending Payments</h3>
                            <p className="text-gray-600">Outstanding customer payments</p>
                        </div>
                        <ShoppingCart className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="space-y-4">
                        {pendingPayments.map((payment, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                                <div>
                                    <div className="font-medium text-gray-800">{payment.customer}</div>
                                    <div className="text-sm text-gray-600">{payment.days} days overdue</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-primary-600">₹{payment.amount.toLocaleString()}</div>
                                    <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                                        Send Reminder
                                    </button>
                                </div>
                            </div>
                        ))}
                        <div className="flex justify-between items-center pt-4 border-t">
                            <span className="font-semibold text-gray-800">Total Outstanding:</span>
                            <span className="text-2xl font-bold text-primary-600">
                                ₹{statsData ? statsData.pendingPayments.value.toLocaleString() : '0'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Create Invoice', icon: FileText, color: 'bg-blue-100 text-blue-600', path: '/billing' },
                        { label: 'Add Production Order', icon: Factory, color: 'bg-green-100 text-green-600', path: '/production' },
                        { label: 'Stock Transfer', icon: Package, color: 'bg-purple-100 text-purple-600', path: '/inventory' },
                        { label: 'Generate GST Report', icon: Filter, color: 'bg-orange-100 text-orange-600', path: '/reports' },
                    ].map((action, index) => (
                        <button
                            key={index}
                            onClick={() => navigate(action.path)}
                            className="flex flex-col items-center justify-center p-6 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all"
                        >
                            <div className={`p-3 rounded-lg ${action.color.split(' ')[0]} mb-3`}>
                                <action.icon className="h-6 w-6" />
                            </div>
                            <span className="font-medium text-gray-800">{action.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
