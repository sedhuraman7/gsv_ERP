import { Request, Response } from 'express';
import Invoice from '../models/Invoice';
import { RawMaterial, FinishedProduct } from '../models/Inventory';
import ProductionOrder from '../models/ProductionOrder';

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Sales Stats
        const todaysInvoices = await Invoice.find({
            date: { $gte: today },
            isActive: true
        });
        const todaysSales = todaysInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

        // 2. Production Stats (Efficiency)
        const totalProductionOrders = await ProductionOrder.countDocuments();
        const completedProductionOrders = await ProductionOrder.countDocuments({ status: 'completed' });
        const productionEfficiency = totalProductionOrders > 0
            ? Math.round((completedProductionOrders / totalProductionOrders) * 100)
            : 0;

        // 3. GST Collection
        const todaysGst = todaysInvoices.reduce((sum, inv) => sum + inv.totalGst, 0);

        // 4. Pending Payments
        const pendingInvoices = await Invoice.find({ paymentStatus: 'pending', isActive: true });
        const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

        // 5. Inventory Value
        const rawMaterials = await RawMaterial.find({ isActive: true });
        const finishedProducts = await FinishedProduct.find({ isActive: true });

        const rawValue = rawMaterials.reduce((sum, item) => sum + (item.currentStock * (item.averageCost || 0)), 0);
        const finishedValue = finishedProducts.reduce((sum, item) => {
            const totalStock = (item.stock?.mainStore || 0) + (item.stock?.dispatchArea || 0);
            return sum + (totalStock * (item.costPrice || 0));
        }, 0);
        const totalInventoryValue = rawValue + finishedValue;

        // 6. Active Users (Mocked as we don't track online status strictly yet)
        const activeUsersCount = 1;

        // --- NEW: Populate Trends & Lists ---

        // Sales Trend (Last 7 Days)
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 6);
        last7Days.setHours(0, 0, 0, 0);

        const lastWeekInvoices = await Invoice.find({
            date: { $gte: last7Days },
            isActive: true
        });

        const salesTrend = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(last7Days);
            d.setDate(d.getDate() + i);
            const dateStr = d.toLocaleDateString('en-US', { weekday: 'short' });

            const daysSales = lastWeekInvoices
                .filter(inv => {
                    const invDate = new Date(inv.date);
                    return invDate.getDate() === d.getDate() && invDate.getMonth() === d.getMonth();
                })
                .reduce((sum, inv) => sum + inv.grandTotal, 0);

            salesTrend.push({ day: dateStr, sales: daysSales, target: 50000 }); // Target is static for now
        }

        // Production Trend (By Status)
        const productionCounts = await ProductionOrder.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        // Map status to "stage" for the chart
        const productionTrend = [
            { stage: 'Planned', efficiency: 100, target: 100, count: productionCounts.find(p => p._id === 'planned')?.count || 0 },
            { stage: 'In Prod', efficiency: 80, target: 90, count: productionCounts.find(p => p._id === 'in_production')?.count || 0 }, // Mock efficiency for now
            { stage: 'Completed', efficiency: 95, target: 95, count: productionCounts.find(p => p._id === 'completed')?.count || 0 },
        ];


        // Pending Payments List (Top 5 Oldest)
        const pendingPaymentsList = pendingInvoices
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 5)
            .map(inv => ({
                customer: inv.customer.name,
                days: Math.floor((Date.now() - new Date(inv.date).getTime()) / (1000 * 60 * 60 * 24)),
                amount: inv.balanceDue
            }));

        // Low Stock Items (Top 5)
        const lowStockList = rawMaterials
            .filter(item => item.currentStock <= item.minStockLevel)
            .slice(0, 5)
            .map(item => ({
                name: item.name,
                id: item.materialCode,
                current: item.currentStock,
                min: item.minStockLevel
            }));

        res.status(200).json({
            sales: { value: todaysSales, change: 0 },
            production: { value: productionEfficiency, change: 0 },
            gst: { value: todaysGst, change: 0 },
            pendingPayments: { value: pendingAmount, change: 0 },
            inventoryValue: { value: totalInventoryValue, change: 0 },
            activeUsers: { value: activeUsersCount, change: 0 },

            // Populated Data
            salesTrend,
            productionTrend,
            inventoryDistribution: [
                { category: 'Raw Materials', value: rawMaterials.length, color: '#f97316' },
                { category: 'Finished Goods', value: finishedProducts.length, color: '#fb923c' }
            ],
            lowStockItems: lowStockList,
            pendingPaymentsList
        });

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
