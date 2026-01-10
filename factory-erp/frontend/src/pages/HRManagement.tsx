import React, { useState, useEffect } from 'react';
import {
    Users,
    UserPlus,
    Mail,
    Lock,
    Briefcase,
    Shield,
    CheckCircle,
    User
} from 'lucide-react';

const HRManagement: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Form State
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        password: '',
        role: 'sales_man',
        department: 'sales',
        employeeId: ''
    });

    const [message, setMessage] = useState({ type: '', text: '' });

    // Fetch Users (simulated or real if endpoint exists)
    // Currently, I don't think I have a 'GET /api/users' endpoint for listing all users securely.
    // I will mock the list for now or implement the endpoint if needed.
    // Let's assume we can fetch them or just show the Create form primarily.
    // I previously saw authController has register/login. I don't recall a list users endpoint.
    // I'll add the list capability later. For now, focus on CREATION as requested.

    const roles = [
        { id: 'admin', label: 'Admin', dept: 'production' },
        { id: 'hr', label: 'HR Manager', dept: 'hr' },
        { id: 'sales_man', label: 'Sales Man', dept: 'sales' },
        { id: 'dealer', label: 'Dealer', dept: 'sales' },
        { id: 'accounts', label: 'Accounts', dept: 'accounts' },
        { id: 'store_manager', label: 'Store Manager', dept: 'store' },
        { id: 'production_head', label: 'Production Head', dept: 'production' },
        { id: 'quality_check', label: 'Quality Check', dept: 'production' },
        { id: 'assembly_area1', label: 'Assembly Line 1', dept: 'assembly' },
        { id: 'assembly_area2', label: 'Assembly Line 2', dept: 'assembly' },
        { id: 'packing_area', label: 'Packing Area', dept: 'packing' },
    ];

    const generateEmployeeId = () => {
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `EMP-${newUser.role.substring(0, 3).toUpperCase()}-${random}`;
    };

    // ... (inside component)
    const fetchUsers = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/auth/users');
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Fetch users error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        try {
            const empId = newUser.employeeId || generateEmployeeId();

            // Auto-fill department based on role if not set manually
            const selectedRole = roles.find(r => r.id === newUser.role);
            const dept = selectedRole ? selectedRole.dept : 'production';

            const payload = {
                ...newUser,
                employeeId: empId,
                department: dept
            };

            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: `User ${newUser.name} created successfully!` });
                setNewUser({
                    name: '',
                    email: '',
                    password: '',
                    role: 'sales_man',
                    department: 'sales',
                    employeeId: ''
                });
                setShowCreateModal(false);
                fetchUsers(); // Refresh list
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to create user' });
            }
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Server error' });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">HR Management</h1>
                    <p className="text-gray-600">Manage employee roles, access, and credentials</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <UserPlus className="w-5 h-5" />
                    Create New User
                </button>
            </div>

            {message.text && (
                <div className={`p-4 mb-6 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Total Employees</h3>
                            <p className="text-sm text-gray-500">Active personnel</p>
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{users.length}</div>
                </div>

                {/* More stats cards could go here */}
            </div>

            {/* List of Employees Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">Employee Directory</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {users.map((user: any) => (
                                <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{user.name}</div>
                                                <div className="text-xs text-gray-500">{user.email}</div>
                                                <div className="text-xs text-gray-400 font-mono">{user.employeeId}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-100">
                                            {roles.find(r => r.id === user.role)?.label || user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                                        {user.department}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {user.isActive ? <CheckCircle className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        No employees found. Create one to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-lg">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Create New Employee</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        required
                                        className="input-field pl-10 w-full"
                                        placeholder="John Doe"
                                        value={newUser.name}
                                        onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="email"
                                        required
                                        className="input-field pl-10 w-full"
                                        placeholder="john@gsv.com"
                                        value={newUser.email}
                                        onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="password"
                                        required
                                        className="input-field pl-10 w-full"
                                        placeholder="••••••••"
                                        value={newUser.password}
                                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role / Designation</label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <select
                                        className="input-field pl-10 w-full appearance-none"
                                        value={newUser.role}
                                        onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                    >
                                        {roles.map(role => (
                                            <option key={role.id} value={role.id}>{role.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <button type="submit" className="btn-primary w-full mt-6 py-3 text-lg">
                                Create Account
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HRManagement;
