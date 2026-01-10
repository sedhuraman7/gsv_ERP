import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Factory, Package, Users, FileText, Settings as SettingsIcon, LogOut, Menu, X, Layers, Truck } from 'lucide-react';

// Lazy load components
const SplashScreen = React.lazy(() => import('./components/SplashScreen'));
const LoginForm = React.lazy(() => import('./components/LoginForm'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const InventoryManagement = React.lazy(() => import('./pages/InventoryManagement'));
const ProductionManagement = React.lazy(() => import('./pages/ProductionManagement'));
const BillingSystem = React.lazy(() => import('./pages/BillingSystem'));
const Customers = React.lazy(() => import('./pages/Customers'));
const Vendors = React.lazy(() => import('./pages/Vendors'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Settings = React.lazy(() => import('./pages/Settings'));
const HRManagement = React.lazy(() => import('./pages/HRManagement'));
const CategoryManager = React.lazy(() => import('./components/CategoryManager'));
const DeliveryDashboard = React.lazy(() => import('./pages/DeliveryDashboard'));

// Auth Context
const AuthContext = React.createContext<{
    user: { role: string } | null;
    login: (userData: any) => void;
    logout: () => void;
    isLoading: boolean;
}>({
    user: null,
    login: () => { },
    logout: () => { },
    isLoading: true
});

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<{ role: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('factory_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const login = (userData: any) => {
        setUser(userData);
        localStorage.setItem('factory_user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('factory_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

const useAuth = () => React.useContext(AuthContext);

// Layout Component
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const { logout, user } = useAuth(); // Added user

    const navItems = [
        { icon: Factory, label: 'Dashboard', path: '/dashboard' },
        { icon: Package, label: 'Inventory', path: '/inventory' },
        { icon: Users, label: 'Production', path: '/production' },
        { icon: FileText, label: 'Billing', path: '/billing' },
        { icon: Users, label: 'Customers', path: '/customers' },
        { icon: Users, label: 'Vendors', path: '/vendors' },
        { icon: Layers, label: 'Categories', path: '/categories' },
        { icon: FileText, label: 'Reports', path: '/reports' },
        { icon: SettingsIcon, label: 'Settings', path: '/settings' },
    ].filter(item => {
        if (user?.role === 'delivery_man') return false; // Hide all standard items for delivery man
        return true;
    });

    if (user?.role === 'delivery_man') {
        navItems.push({ icon: Truck, label: 'My Deliveries', path: '/delivery-dashboard' });
    }

    if (user?.role === 'admin' || user?.role === 'hr') {
        navItems.push({ icon: Users, label: 'HR Management', path: '/hr-management' });
    }

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'w-64' : 'w-0'
                } bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden`}>
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-orange-600 rounded-lg flex items-center justify-center">
                            <Factory className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-primary-700">GSV MFG</h1>
                            <p className="text-xs text-gray-600">ERP System</p>
                        </div>
                    </div>

                    <nav className="space-y-1">
                        {navItems.map((item, index) => (
                            <a
                                key={index}
                                href={item.path}
                                className="nav-link"
                            >
                                <item.icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </a>
                        ))}
                    </nav>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 w-full p-3 text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Logout</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Topbar */}
                <header className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="p-2 rounded-lg hover:bg-gray-100"
                            >
                                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">GSV Manufacturing ERP</h2>
                                <p className="text-sm text-gray-600">Streamlined factory management</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-semibold text-gray-800">{(user as any)?.name || 'User'}</p>
                                <p className="text-xs text-gray-500 capitalize">{(user as any)?.role?.replace('_', ' ') || 'Staff'}</p>
                            </div>
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                                {(user as any)?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
    children,
    allowedRoles
}) => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" />;
    }

    return <Layout>{children}</Layout>;
};

function App() {
    const [showSplash, setShowSplash] = useState(true);

    useEffect(() => {
        // Only show splash screen on the VERY FIRST visit in a session
        const hasVisited = sessionStorage.getItem('hasVisited');

        if (!hasVisited) {
            setShowSplash(true);
            const timer = setTimeout(() => {
                setShowSplash(false);
                sessionStorage.setItem('hasVisited', 'true');
            }, 3000);
            return () => clearTimeout(timer);
        } else {
            setShowSplash(false);
        }
    }, []);

    if (showSplash) {
        return (
            <Suspense fallback={<div>Loading...</div>}>
                <SplashScreen />
            </Suspense>
        );
    }

    return (
        <AuthProvider>
            <Router>
                <Suspense fallback={
                    <div className="min-h-screen flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    </div>
                }>
                    <Routes>
                        <Route path="/" element={<Navigate to="/login" />} />
                        <Route path="/login" element={<LoginForm />} />

                        {/* Protected Routes */}
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute allowedRoles={['admin', 'production_head']}>
                                    <AdminDashboard />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/inventory"
                            element={
                                <ProtectedRoute allowedRoles={['admin', 'store_manager', 'production_head']}>
                                    <InventoryManagement />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/production"
                            element={
                                <ProtectedRoute allowedRoles={['admin', 'production_head', 'assembly_area1', 'assembly_area2', 'packing_area']}>
                                    <ProductionManagement />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/billing"
                            element={
                                <ProtectedRoute allowedRoles={['admin', 'accounts']}>
                                    <BillingSystem />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/customers"
                            element={
                                <ProtectedRoute allowedRoles={['admin', 'sales_man', 'dealer']}>
                                    <Customers />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/vendors"
                            element={
                                <ProtectedRoute allowedRoles={['admin', 'store_manager']}>
                                    <Vendors />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/reports"
                            element={
                                <ProtectedRoute allowedRoles={['admin', 'production_head', 'accounts']}>
                                    <Reports />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/settings"
                            element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <Settings />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/hr-management"
                            element={
                                <ProtectedRoute allowedRoles={['admin', 'hr']}>
                                    <HRManagement />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/categories"
                            element={
                                <ProtectedRoute allowedRoles={['admin', 'store_manager']}>
                                    <CategoryManager />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/delivery-dashboard"
                            element={
                                <ProtectedRoute allowedRoles={['delivery_man']}>
                                    <DeliveryDashboard />
                                </ProtectedRoute>
                            }
                        />

                        {/* Add more routes here */}
                        <Route path="*" element={<div>404 - Page Not Found</div>} />
                    </Routes>
                </Suspense>
            </Router>

            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#fff',
                        color: '#1f2937',
                        border: '1px solid #e5e7eb',
                    },
                    success: {
                        iconTheme: {
                            primary: '#10b981',
                            secondary: '#fff',
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: '#ef4444',
                            secondary: '#fff',
                        },
                    },
                }}
            />
        </AuthProvider>
    );
}

export default App;
