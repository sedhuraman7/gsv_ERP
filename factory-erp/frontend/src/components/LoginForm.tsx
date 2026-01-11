import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Factory,
    User,
    Lock,
    Eye,
    EyeOff,
    Building,
    Shield
} from 'lucide-react';
import toast from 'react-hot-toast';

const loginSchema = z.object({
    employeeId: z.string().min(3, 'Employee ID is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum([
        'admin',
        'hr',
        'sales_man',
        'dealer',
        'accounts',
        'store_manager',
        'assembly_area1',
        'assembly_area2',
        'packing_area',
        'quality_check',
        'production_head',
        'delivery_man'
    ])
});

type LoginFormData = z.infer<typeof loginSchema>;

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const LoginForm: React.FC = () => {
    const navigate = useNavigate();
    // Assuming useAuth is a custom hook that provides a login function
    // This part of the code was not provided in the original document,
    // so I'm commenting it out or assuming it's part of the user's setup.
    // const { login } = useAuth(); 
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'admin',
        employeeId: '',
        department: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // The original code used react-hook-form, but the provided snippet
    // replaces it with a manual state management and handleSubmit.
    // I will keep the react-hook-form setup for now and adapt the submit logic.
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit: hookFormHandleSubmit, // Renamed to avoid conflict
        formState: { errors },
        watch
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            role: 'store_manager'
        }
    });

    const selectedRole = watch('role');

    // Adapting the new handleSubmit logic to work with react-hook-form's onSubmit
    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        setError(''); // Clear previous errors

        try {
            const endpoint = '/api/auth/login'; // Always login for this form
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data) // Use data from react-hook-form
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Login failed');
            }

            // SAVE USER TO LOCAL STORAGE
            const userData = {
                employeeId: result.employeeId,
                role: result.role,
                name: result.name,
                email: result.email,
                token: result.token
            };

            localStorage.setItem('user', JSON.stringify(userData)); // For Settings page
            localStorage.setItem('factory_user', JSON.stringify(userData)); // Identify consistency

            // Dispatch a storage event so other tabs/components might pick it up
            window.dispatchEvent(new Event('storage'));

            toast.success(`Welcome back, ${result.name}!`);

            // Small delay to ensure storage is set before navigation
            setTimeout(() => {
                const targetRole = result.role; // Use verified role from backend
                switch (targetRole) {
                    case 'admin':
                        window.location.href = '/dashboard';
                        break;
                    case 'hr':
                        window.location.href = '/hr-management';
                        break;
                    case 'accounts':
                        window.location.href = '/billing';
                        break;
                    case 'store_manager':
                        window.location.href = '/inventory';
                        break;
                    case 'assembly_area1':
                    case 'assembly_area2':
                    case 'production_head':
                    case 'packing_area':
                        window.location.href = '/production';
                        break;
                    case 'sales_man':
                    case 'dealer':
                        window.location.href = '/dashboard'; // Or sales page if exists
                        break;
                    case 'delivery_man':
                        window.location.href = '/delivery-dashboard';
                        break;
                    default:
                        window.location.href = '/dashboard';
                }
            }, 500);
        } catch (error: any) {
            console.error('Login error:', error);
            toast.error(error.message || 'Invalid credentials. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const getRoleName = (role: string): string => {
        const roleNames: Record<string, string> = {
            admin: 'Admin',
            hr: 'HR Manager',
            sales_man: 'Sales Manager',
            dealer: 'Dealer',
            accounts: 'Accounts',
            store_manager: 'Store Manager',
            assembly_area1: 'PSB Assembly',
            assembly_area2: 'Kit Assembly',
            packing_area: 'Packing Area',
            quality_check: 'Quality Check',
            production_head: 'Production Head',
            delivery_man: 'Delivery Man'
        };
        return roleNames[role] || role;
    };

    const getRoleDescription = (role: string): string => {
        const descriptions: Record<string, string> = {
            admin: 'Full system access and control',
            hr: 'Employee management and recruitment',
            accounts: 'Financial management and GST',
            store_manager: 'Inventory and stock management',
            assembly_area1: 'PSB Assembly line operations',
            assembly_area2: 'Kit Assembly line operations',
            packing_area: 'Packing and dispatch operations',
            quality_check: 'Quality control and inspection',
            delivery_man: 'Execute and update deliveries'
        };
        return descriptions[role] || 'Access to specific modules';
    };

    const roleDepartments: Record<string, string> = {
        admin: 'Administration',
        hr: 'Human Resources',
        sales_man: 'Sales',
        dealer: 'Sales',
        accounts: 'Finance',
        store_manager: 'Store',
        assembly_area1: 'Production',
        assembly_area2: 'Production',
        packing_area: 'Production',
        quality_check: 'Quality',
        production_head: 'Production',
        delivery_man: 'Logistics'
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-4">
            <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Side - Branding */}
                <div className="hidden lg:flex flex-col justify-center p-8">
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-orange-600 rounded-xl flex items-center justify-center">
                                <Factory className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-primary-700">GSV Manufacturing</h1>
                                <p className="text-gray-600">Industrial ERP System</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-2xl font-semibold text-gray-800">
                                Streamline Your Manufacturing Operations
                            </h2>
                            <ul className="space-y-3">
                                {[
                                    'Real-time Inventory Tracking',
                                    'Production Line Monitoring',
                                    'GST Compliant Billing',
                                    'Role-Based Access Control',
                                    'Advanced Reporting & Analytics',
                                    'Mobile Responsive Design'
                                ].map((feature, index) => (
                                    <li key={index} className="flex items-center gap-3">
                                        <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                                            <Shield className="w-3 h-3 text-primary-600" />
                                        </div>
                                        <span className="text-gray-700">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mt-8">
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-orange-100">
                            <div className="text-2xl font-bold text-primary-600">250+</div>
                            <div className="text-sm text-gray-600">Daily Production</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-orange-100">
                            <div className="text-2xl font-bold text-primary-600">18%</div>
                            <div className="text-sm text-gray-600">GST Collection</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-orange-100">
                            <div className="text-2xl font-bold text-primary-600">99.2%</div>
                            <div className="text-sm text-gray-600">System Uptime</div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-orange-100">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-orange-600 rounded-2xl mb-4">
                            <Building className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">Factory Login</h2>
                        <p className="text-gray-600">Enter your credentials to access the system</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Role Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Your Role
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {[
                                    { value: 'admin', label: 'Admin' },
                                    { value: 'hr', label: 'HR Manager' },
                                    { value: 'accounts', label: 'Accounts' },
                                    { value: 'store_manager', label: 'Store' },
                                    { value: 'assembly_area1', label: 'PSB Assembly' },
                                    { value: 'assembly_area2', label: 'Kit Assembly' },
                                    { value: 'packing_area', label: 'Packing' },
                                    { value: 'sales_man', label: 'Sales' },
                                    { value: 'dealer', label: 'Dealer' },
                                    { value: 'quality_check', label: 'Quality' },
                                    { value: 'production_head', label: 'Production Head' },
                                    { value: 'delivery_man', label: 'Delivery' }
                                ].map((role) => (
                                    <label
                                        key={role.value}
                                        className={`flex flex-col items-center justify-center p-3 border rounded-lg cursor-pointer transition-all ${selectedRole === role.value
                                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                                            : 'border-gray-200 hover:border-primary-300 hover:bg-orange-50'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            value={role.value}
                                            {...register('role')}
                                            className="sr-only"
                                        />
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${selectedRole === role.value ? 'bg-primary-100' : 'bg-gray-100'
                                            }`}>
                                            <User className={`w-4 h-4 ${selectedRole === role.value ? 'text-primary-600' : 'text-gray-500'
                                                }`} />
                                        </div>
                                        <span className="text-sm font-medium text-center">{role.label}</span>
                                    </label>
                                ))}
                            </div>
                            {errors.role && (
                                <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                            )}
                        </div>

                        {/* Selected Role Info */}
                        <div className="bg-gradient-to-r from-orange-50 to-primary-50 p-4 rounded-lg border border-orange-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-gray-800">{getRoleName(selectedRole)}</h3>
                                    <p className="text-sm text-gray-600">{getRoleDescription(selectedRole)}</p>
                                </div>
                                <div className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                                    {roleDepartments[selectedRole]}
                                </div>
                            </div>
                        </div>

                        {/* Employee ID */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Employee ID
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="e.g., MFG-001"
                                    {...register('employeeId')}
                                    className="input-field pl-10"
                                />
                            </div>
                            {errors.employeeId && (
                                <p className="mt-1 text-sm text-red-600">{errors.employeeId.message}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    {...register('password')}
                                    className="input-field pl-10 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5 text-gray-400" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-gray-400" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">Remember me</span>
                            </label>
                            <button
                                type="button"
                                className="text-sm font-medium text-primary-600 hover:text-primary-500"
                            >
                                Forgot password?
                            </button>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full btn-primary py-3 text-lg font-semibold relative"
                        >
                            {isLoading ? (
                                <>
                                    <span className="opacity-0">Sign In</span>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    </div>
                                </>
                            ) : (
                                'Sign In to Factory ERP'
                            )}
                        </button>

                        {/* Demo Credentials */}
                        <div className="text-center text-sm text-gray-500 pt-4 border-t">
                            <p>Demo Credentials:</p>
                            <p className="font-mono text-xs bg-gray-100 p-2 rounded mt-1">
                                Admin: MFG-001 / password123
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;
