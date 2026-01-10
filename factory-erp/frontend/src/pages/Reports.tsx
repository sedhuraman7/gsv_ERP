import React, { useState, useEffect } from 'react';
import {
    BarChart3,
    PieChart as PieChartIcon,
    TrendingUp,
    Calendar,
    Download,
    FileText,
    Printer,
    Filter
} from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';

const Reports: React.FC = () => {
    const [activeReport, setActiveReport] = useState('sales');
    const [loading, setLoading] = useState(true);
    const [monthlySales, setMonthlySales] = useState<any[]>([]);
    const [categoryDistribution, setCategoryDistribution] = useState<any[]>([]);
    const [productionEfficiency, setProductionEfficiency] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Invoices for Sales
                const billingRes = await fetch('http://localhost:5000/api/billing');
                const invoices = billingRes.ok ? await billingRes.json() : [];

                // Fetch Production Orders
                const prodRes = await fetch('http://localhost:5000/api/production');
                const production = prodRes.ok ? await prodRes.json() : [];

                // Fetch Inventory
                const invRes = await fetch('http://localhost:5000/api/inventory');
                const inventory = invRes.ok ? await invRes.json() : { rawMaterials: [], finishedProducts: [] };

                // Process Sales Data (Group by Month)
                const salesMap = new Map();
                invoices.forEach((inv: any) => {
                    const date = new Date(inv.date);
                    const month = date.toLocaleString('default', { month: 'short' });
                    if (!salesMap.has(month)) salesMap.set(month, { name: month, sales: 0, profit: 0 });
                    const record = salesMap.get(month);
                    record.sales += inv.grandTotal;
                    // Simple profit approximation (20% margin) until cost is tracked
                    record.profit += inv.grandTotal * 0.2;
                });
                setMonthlySales(Array.from(salesMap.values()));

                // Process Production Efficiency
                // Efficiency = (Passed / Total Produced) * 100
                const effMap = new Map();
                production.forEach((order: any) => {
                    // For simplicity, grouping by "Order" or just showing last 10
                    const name = order.orderNo.substring(order.orderNo.length - 4);
                    const efficiency = order.quantityToProduce > 0
                        ? (order.passedQuantity / order.quantityToProduce) * 100
                        : 0;
                    effMap.set(name, { name: `Ord ${name}`, efficiency: Math.round(efficiency), defects: order.rejectedQuantity });
                });
                setProductionEfficiency(Array.from(effMap.values()).slice(-10)); // Last 10 orders

                // Process Category Distribution
                const catMap = new Map();
                const addToMap = (items: any[]) => {
                    items.forEach((item: any) => {
                        const cat = item.category || 'Other';
                        if (!catMap.has(cat)) catMap.set(cat, { name: cat, value: 0 });
                        catMap.get(cat).value += 1;
                    });
                };
                addToMap(inventory.rawMaterials || []);
                addToMap(inventory.finishedProducts || []);

                const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
                setCategoryDistribution(Array.from(catMap.values()).map((c: any, i) => ({
                    ...c,
                    color: colors[i % colors.length]
                })));

            } catch (err) {
                console.error("Failed to fetch report data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <div className="p-10 text-center">Loading Data...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Advanced Analytics</h1>
                    <p className="text-gray-600">Deep dive into your business performance</p>
                </div>
                <div className="mt-4 md:mt-0 flex gap-3">
                    <div className="bg-white border border-gray-200 rounded-lg flex items-center px-3 py-2 text-sm text-gray-600 shadow-sm">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>All Time</span>
                    </div>
                    <button className="btn-secondary flex items-center gap-2">
                        <Filter className="w-4 h-4" /> Filter
                    </button>
                    <button className="btn-primary flex items-center gap-2">
                        <Download className="w-4 h-4" /> Export All
                    </button>
                </div>
            </div>

            {/* Report Tabs */}
            <div className="flex gap-4 border-b border-gray-200 mb-8 overflow-x-auto pb-1">
                {[
                    { id: 'sales', label: 'Sales & Revenue', icon: TrendingUp },
                    { id: 'production', label: 'Production Efficiency', icon: BarChart3 },
                    { id: 'inventory', label: 'Inventory Health', icon: PieChartIcon },
                    { id: 'financial', label: 'Financial Statements', icon: FileText }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveReport(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeReport === tab.id
                            ? 'border-primary-600 text-primary-700'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Sales Dashboard Content */}
            {activeReport === 'sales' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-800 mb-6">Revenue vs Profit Trend</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={monthlySales}>
                                        <defs>
                                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="name" stroke="#9ca3af" />
                                        <YAxis stroke="#9ca3af" />
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Legend />
                                        <Area type="monotone" dataKey="sales" stroke="#f97316" fillOpacity={1} fill="url(#colorSales)" />
                                        <Area type="monotone" dataKey="profit" stroke="#818cf8" fillOpacity={1} fill="url(#colorProfit)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Category Performance</h3>
                            <div className="flex-1 min-h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryDistribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {categoryDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Production Dashboard Content */}
            {activeReport === 'production' && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-800">Efficiency vs Defects</h3>
                        <button className="text-sm text-primary-600 font-medium hover:underline">View Detailed Report</button>
                    </div>
                    <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={productionEfficiency}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis yAxisId="left" orientation="left" stroke="#6366f1" />
                                <YAxis yAxisId="right" orientation="right" stroke="#ef4444" />
                                <RechartsTooltip cursor={{ fill: '#f3f4f6' }} />
                                <Legend />
                                <Bar yAxisId="left" dataKey="efficiency" name="Efficiency %" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                                <Bar yAxisId="right" dataKey="defects" name="Defect Count" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Placeholder for other tabs (to keep code concise but functional) */}
            {(activeReport === 'inventory' || activeReport === 'financial') && (
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-gray-200 border-dashed">
                    <div className="p-4 bg-gray-50 rounded-full mb-4">
                        <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Detailed Report Generation</h3>
                    <p className="text-gray-500 mb-6 text-center max-w-md">
                        Advanced reports for {activeReport} are generated on-demand to ensure the latest data accuracy.
                    </p>
                    <button className="btn-primary flex items-center gap-2">
                        <Printer className="w-4 h-4" />
                        Generate & Print {activeReport.charAt(0).toUpperCase() + activeReport.slice(1)} Report
                    </button>
                </div>
            )}
        </div>
    );
};

export default Reports;
