import { Request, Response } from 'express';
import { User } from '../models/User';
import jwt from 'jsonwebtoken';

// Generate Token
const generateToken = (id: string) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
        expiresIn: '30d'
    });
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { employeeId, password, role } = req.body;

        if (!employeeId || !password) {
            res.status(400).json({ message: 'Please provide employeeId and password' });
            return;
        }

        // Find user by employeeId or email
        const user = await User.findOne({
            $or: [
                { employeeId: employeeId },
                { email: employeeId.toLowerCase() }
            ]
        }).select('+password');

        if (!user) {
            res.status(401).json({ message: 'Invalid credentials. User not found.' });
            return;
        }

        // Check if password is correct
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        // Optional: Check if role matches what they selected (if we want to enforce it)
        // Or we just return their actual role and let frontend handle it.
        // If frontend sends 'role', we can verify it matches user.role
        if (role && user.role !== role) {
            res.status(403).json({ message: `Access denied. Pass specified role ${role} does not match user account role.` });
            return;
        }

        if (!user.isActive) {
            res.status(403).json({ message: 'Account is deactivated' });
            return;
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        const token = generateToken(user._id as string);

        res.status(200).json({
            _id: user._id,
            employeeId: user.employeeId,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

export const register = async (req: Request, res: Response): Promise<void> => {
    // Basic register for testing creating users if needed
    try {
        const { employeeId, name, email, password, role, department } = req.body;

        const userExists = await User.findOne({ $or: [{ employeeId }, { email }] });
        if (userExists) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }

        const user = await User.create({
            employeeId,
            name,
            email,
            password,
            role,
            department
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                employeeId: user.employeeId,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id as string)
            });
        }
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { role } = req.query;
        const query = role ? { role } : {};
        const users = await User.find(query).select('-password').sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Server error fetching users' });
    }
};
