import React, { useState } from 'react';
import {
    User,
    Lock,
    Bell,
    Globe,
    Shield,
    Database,
    Save,
    Trash2,
    PlusCircle,
    Mail
} from 'lucide-react';

const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState('profile');

    // Get user from localStorage
    const [currentUser, setCurrentUser] = useState(() => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : { name: 'Admin', email: 'admin@gsv.com' };
    });

    const getUserInitials = (name: string) => {
        return name ? name.charAt(0).toUpperCase() : 'A';
    };

    const tabs = [
        { id: 'profile', label: 'My Profile', icon: User },
        { id: 'security', label: 'Security', icon: Lock },
        // { id: 'notifications', label: 'Notifications', icon: Bell },
        // { id: 'system', label: 'System', icon: Database },
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 flex-shrink-0">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50">
                            <h2 className="font-bold text-gray-800">Settings</h2>
                            <p className="text-xs text-gray-500">Manage your workspace</p>
                        </div>
                        <nav className="p-2 space-y-1">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === tab.id
                                        ? 'bg-primary-50 text-primary-700'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-primary-600' : 'text-gray-400'}`} />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1">
                    {/* Profile Settings */}
                    {activeTab === 'profile' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-800">Profile Information</h2>
                                    <p className="text-sm text-gray-500">Update your account details</p>
                                </div>
                                <button className="btn-primary flex items-center gap-2">
                                    <Save className="w-4 h-4" /> Save Changes
                                </button>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="flex items-center gap-6">
                                    <div className="relative">
                                        <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-orange-500 rounded-full flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-md">
                                            {getUserInitials(currentUser.name)}
                                        </div>
                                        <button className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full border border-gray-200 shadow-sm text-gray-600 hover:text-primary-600">
                                            <Globe className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800">{currentUser.name}</h3>
                                        <p className="text-sm text-gray-500">Administrator</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input type="text" defaultValue={currentUser.name} className="input-field pl-10" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input type="email" defaultValue={currentUser.email} className="input-field pl-10" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                                        <input type="text" defaultValue="System Administrator" disabled className="input-field bg-gray-50 text-gray-500 cursor-not-allowed" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                                        <input type="text" defaultValue="Management" className="input-field" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Placeholder for others */}
                    {activeTab !== 'profile' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Lock className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Restricted Access</h3>
                            <p className="text-gray-500 max-w-md mx-auto">
                                The {activeTab} settings are currently locked or under maintenance. Please contact system administrator for advanced configuration.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
