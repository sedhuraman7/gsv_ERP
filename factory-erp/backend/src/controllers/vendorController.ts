import { Request, Response } from 'express';
import Vendor from '../models/Vendor';

export const getVendors = async (req: Request, res: Response) => {
    try {
        const vendors = await Vendor.find().sort({ createdAt: -1 });
        res.status(200).json(vendors);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createVendor = async (req: Request, res: Response) => {
    try {
        const count = await Vendor.countDocuments();
        const id = `VEND-${(count + 1).toString().padStart(3, '0')}`;

        const newVendor = new Vendor({
            ...req.body,
            id
        });

        const savedVendor = await newVendor.save();
        res.status(201).json(savedVendor);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const updateVendor = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updatedVendor = await Vendor.findOneAndUpdate({ id: id }, req.body, { new: true });
        if (!updatedVendor) return res.status(404).json({ message: "Vendor not found" });
        res.status(200).json(updatedVendor);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteVendor = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await Vendor.findOneAndDelete({ id: id });
        res.status(200).json({ message: "Vendor deleted successfully" });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
