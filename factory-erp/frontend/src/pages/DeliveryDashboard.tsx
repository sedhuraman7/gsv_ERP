import React, { useState, useEffect } from 'react';
import {
    Truck,
    CheckCircle,
    XCircle,
    MapPin,
    User,
    Phone,
    Camera,
    Clock,
    ExternalLink,
    AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Delivery {
    _id: string;
    invoiceId: any;
    status: 'assigned' | 'out_for_delivery' | 'delivered' | 'failed';
    customerName: string;
    customerAddress: string;
    customerContact: string;
    assignedAt: string;
}

const DeliveryDashboard: React.FC = () => {
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showStatusModal, setShowStatusModal] = useState<string | null>(null);
    const [failedReason, setFailedReason] = useState('');
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchMyDeliveries();
    }, []);

    const fetchMyDeliveries = async () => {
        try {
            const userStr = localStorage.getItem('factory_user');
            if (!userStr) return;
            const token = JSON.parse(userStr).token; // If token is stored inside user object

            const response = await fetch('http://localhost:5000/api/deliveries/mine', {
                headers: {
                    'Authorization': `Bearer ${JSON.parse(userStr).token || ''}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setDeliveries(data);
            }
        } catch (error) {
            console.error('Error fetching deliveries:', error);
            toast.error('Failed to load deliveries');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, status: string, reason?: string) => {
        setUpdating(true);
        try {
            const userStr = localStorage.getItem('factory_user');
            const token = JSON.parse(userStr!).token;

            const response = await fetch(`http://localhost:5000/api/deliveries/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token || ''}`
                },
                body: JSON.stringify({
                    status,
                    failedReason: reason,
                    // In a real app, proof would be uploaded to S3/Cloudinary first
                    proof: status === 'delivered' ? { photoUrl: 'https://placehold.co/400x300?text=Proof+of+Delivery' } : undefined
                })
            });

            if (response.ok) {
                toast.success(`Marked as ${status.replace('_', ' ')}`);
                setShowStatusModal(null);
                setFailedReason('');
                fetchMyDeliveries();
            } else {
                const err = await response.json();
                toast.error(err.message || 'Update failed');
            }
        } catch (error) {
            toast.error('Network error');
        } finally {
            setUpdating(false);
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'assigned': return 'bg-blue-100 text-blue-700';
            case 'out_for_delivery': return 'bg-yellow-100 text-yellow-700';
            case 'delivered': return 'bg-green-100 text-green-700';
            case 'failed': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-6 px-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">My Deliveries</h1>
                    <p className="text-gray-600">Track and update your assigned shipments</p>
                </div>
                <div className="p-3 bg-primary-100 text-primary-600 rounded-full">
                    <Truck className="w-8 h-8" />
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-gray-500 text-sm">Assigned</p>
                    <p className="text-2xl font-bold text-blue-600">{deliveries.filter(d => d.status === 'assigned').length}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-gray-500 text-sm">In Transit</p>
                    <p className="text-2xl font-bold text-yellow-600">{deliveries.filter(d => d.status === 'out_for_delivery').length}</p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            ) : deliveries.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No active deliveries assigned to you.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {deliveries.map((delivery) => (
                        <div key={delivery._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-slide-up">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusStyles(delivery.status)}`}>
                                            {delivery.status.replace('_', ' ')}
                                        </span>
                                        <h3 className="text-xl font-bold text-gray-800 mt-2">{delivery.customerName}</h3>
                                    </div>
                                    <button className="p-2 bg-gray-50 text-gray-400 rounded-lg">
                                        <ExternalLink className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                                        <p className="text-gray-600 text-sm">{delivery.customerAddress}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Phone className="w-5 h-5 text-gray-400" />
                                        <a href={`tel:${delivery.customerContact}`} className="text-primary-600 font-medium">{delivery.customerContact}</a>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    {delivery.status === 'assigned' && (
                                        <button
                                            onClick={() => handleUpdateStatus(delivery._id, 'out_for_delivery')}
                                            disabled={updating}
                                            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                                        >
                                            <Truck className="w-5 h-5" />
                                            Start Delivery
                                        </button>
                                    )}
                                    {delivery.status === 'out_for_delivery' && (
                                        <>
                                            <button
                                                onClick={() => handleUpdateStatus(delivery._id, 'delivered')}
                                                disabled={updating}
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle className="w-5 h-5" />
                                                Delivered
                                            </button>
                                            <button
                                                onClick={() => setShowStatusModal(delivery._id)}
                                                disabled={updating}
                                                className="bg-red-100 text-red-600 font-bold px-6 py-3 rounded-xl hover:bg-red-200 transition-all"
                                            >
                                                <XCircle className="w-5 h-5" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Failed Delivery Modal */}
            {showStatusModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-slide-up">
                        <div className="flex items-center gap-3 text-red-600 mb-4">
                            <AlertCircle className="w-6 h-6" />
                            <h2 className="text-xl font-bold">Failed Delivery</h2>
                        </div>
                        <p className="text-gray-600 mb-4 text-sm">Please tell us why this delivery could not be completed. This is required.</p>

                        <textarea
                            className="input-field w-full h-32 mb-6"
                            placeholder="e.g., Customer not available, Address not found..."
                            value={failedReason}
                            onChange={(e) => setFailedReason(e.target.value)}
                        />

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowStatusModal(null)}
                                className="flex-1 py-4 text-gray-500 font-bold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleUpdateStatus(showStatusModal, 'failed', failedReason)}
                                disabled={!failedReason || updating}
                                className="flex-2 bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-50"
                            >
                                Submit & Notify Admin
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeliveryDashboard;
