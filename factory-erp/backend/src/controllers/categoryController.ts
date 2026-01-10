import { Request, Response } from 'express';
import Category from '../models/Category';

// Get all categories (optional filter by type)
export const getCategories = async (req: Request, res: Response) => {
    try {
        const { type } = req.query;
        // If type is provided, split by comma to allow multiple types
        const types = type ? (type as string).split(',') : null;

        const query = types
            ? { type: { $in: types }, isActive: true }
            : { isActive: true };

        const categories = await Category.find(query).sort({ name: 1 });
        res.status(200).json(categories);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new category
export const createCategory = async (req: Request, res: Response) => {
    try {
        const { code, name, type, description, gstRate, unit, minStock, maxStock, attributes } = req.body;

        // Check if code exists
        const existingCode = await Category.findOne({ code: code.toUpperCase() });
        if (existingCode) {
            return res.status(400).json({ message: `Category code '${code}' already exists` });
        }

        // Check if name exists in type
        const existingName = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, type });
        if (existingName) {
            return res.status(400).json({ message: `Category '${name}' already exists in ${type}` });
        }

        const category = new Category({
            code,
            name,
            type,
            description,
            gstRate,
            unit,
            minStock,
            maxStock,
            attributes
        });

        await category.save();
        res.status(201).json(category);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// Update a category
export const updateCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const category = await Category.findByIdAndUpdate(
            id,
            { ...updates, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.status(200).json(category);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a category
export const deleteCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Soft delete instead of hard delete
        category.isActive = false;
        await category.save();

        res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
