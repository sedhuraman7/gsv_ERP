import express from 'express';
import { login, register, getAllUsers } from '../controllers/authController';

const router = express.Router();

router.post('/login', login);
router.post('/register', register); // Optional, for creating users via API if needed
router.get('/users', getAllUsers);

export default router;
