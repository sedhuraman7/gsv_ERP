import { Request, Response } from 'express';
import Customer from '../models/Customer';

export const getCustomers = async (req: Request, res: Response) => {
    try {
        const customers = await Customer.find().sort({ createdAt: -1 });
        res.status(200).json(customers);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createCustomer = async (req: Request, res: Response) => {
    try {
        const count = await Customer.countDocuments();
        const id = `CUST-${(count + 1).toString().padStart(3, '0')}`;

        const newCustomer = new Customer({
            ...req.body,
            id
        });

        const savedCustomer = await newCustomer.save();
        res.status(201).json(savedCustomer);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const updateCustomer = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updatedCustomer = await Customer.findOneAndUpdate({ id: id }, req.body, { new: true });
        if (!updatedCustomer) return res.status(404).json({ message: "Customer not found" });
        res.status(200).json(updatedCustomer);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteCustomer = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await Customer.findOneAndDelete({ id: id });
        res.status(200).json({ message: "Customer deleted successfully" });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
