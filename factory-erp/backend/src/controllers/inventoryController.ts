import { Request, Response } from 'express';
import { RawMaterial, FinishedProduct } from '../models/Inventory';

// Get all inventory items (Raw Materials + Finished Products)
export const getInventory = async (req: Request, res: Response) => {
    try {
        const rawMaterials = await RawMaterial.find({ isActive: true });
        const finishedProducts = await FinishedProduct.find({ isActive: true });

        // Normalize data for frontend
        const normalizedRaw = rawMaterials.map(item => ({
            _id: item._id,
            id: item.materialCode,
            name: item.name,
            category: item.category,
            unit: item.unit,
            currentStock: item.currentStock,
            minStock: item.minStockLevel,
            maxStock: item.maxStockLevel,
            location: item.location.godown,
            lastUpdated: item.updatedAt.toISOString().split('T')[0],
            status: item.currentStock < item.minStockLevel ? 'low' : 'ok',
            type: 'raw'
        }));

        const normalizedFinished = finishedProducts.map(item => ({
            _id: item._id,
            id: item.productCode,
            name: item.name,
            category: item.category,
            unit: item.unit,
            // Sum all stock locations for total current stock
            currentStock: (item.stock.mainStore || 0) + (item.stock.dispatchArea || 0),
            minStock: 0, // Finished products might not have simple min/max in this schema variant, defaulting
            maxStock: 0,
            location: 'Main Store', // Default for now
            lastUpdated: item.updatedAt.toISOString().split('T')[0],
            status: 'ok', // Logic can be improved
            type: 'finished'
        }));

        res.status(200).json([...normalizedRaw, ...normalizedFinished]);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Create new Inventory Item
export const createInventoryItem = async (req: Request, res: Response) => {
    try {
        const { type, ...data } = req.body;

        let newItem;
        if (type === 'raw') {
            let materialCode = data.id;
            if (!materialCode) {
                const count = await RawMaterial.countDocuments();
                materialCode = `RM-${(count + 1).toString().padStart(3, '0')}`;
            }
            newItem = new RawMaterial({
                ...data,
                materialCode,
                location: { godown: data.location || 'Main Store' }
            });
        } else {
            let productCode = data.id;
            if (!productCode) {
                const count = await FinishedProduct.countDocuments();
                productCode = `FP-${(count + 1).toString().padStart(3, '0')}`;
            }
            newItem = new FinishedProduct({
                ...data,
                productCode,
                // Initialize stock object if needed
                stock: { mainStore: data.currentStock || 0 }
            });
        }

        const savedItem = await newItem.save();
        res.status(201).json(savedItem);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// Delete Inventory Item
export const deleteInventoryItem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { type } = req.query; // 'raw' or 'finished'

        if (type === 'raw') {
            await RawMaterial.findByIdAndDelete(id);
        } else {
            await FinishedProduct.findByIdAndDelete(id);
        }
        res.status(200).json({ message: 'Item deleted' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Update Inventory Item
export const updateInventoryItem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { type, ...data } = req.body;

        let updatedItem;
        if (type === 'raw') {
            updatedItem = await RawMaterial.findByIdAndUpdate(id, data, { new: true });
        } else {
            // Mapping flattened data back to FinishedProduct schema structure if needed
            // For now assuming simple updates match schema or ignoring complex nested stock updates
            const updateData = {
                ...data,
                ...(data.currentStock !== undefined && { 'stock.mainStore': data.currentStock })
            };
            updatedItem = await FinishedProduct.findByIdAndUpdate(id, updateData, { new: true });
        }

        res.status(200).json(updatedItem);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};
