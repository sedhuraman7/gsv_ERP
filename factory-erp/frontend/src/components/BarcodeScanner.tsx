import React, { useState, useEffect, useRef } from 'react';
import { Camera, Scan, X, CheckCircle, AlertCircle, Package, RefreshCw } from 'lucide-react';
import Quagga from 'quagga';
import toast from 'react-hot-toast';

interface BarcodeScannerProps {
    onScan: (barcode: string) => void;
    onClose: () => void;
    mode?: 'inbound' | 'outbound' | 'inventory';
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
    onScan,
    onClose,
    mode = 'inventory'
}) => {
    const [isScanning, setIsScanning] = useState(false);
    const [scannedCodes, setScannedCodes] = useState<string[]>([]);
    const [lastScanTime, setLastScanTime] = useState<number>(0);
    const scannerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (isScanning && scannerRef.current) {
            initScanner();
        }

        return () => {
            if (isScanning) {
                Quagga.stop();
            }
        };
    }, [isScanning]);

    const initScanner = () => {
        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: scannerRef.current,
                constraints: {
                    width: 640,
                    height: 480,
                    facingMode: "environment"
                },
            },
            decoder: {
                readers: [
                    "code_128_reader",
                    "ean_reader",
                    "ean_8_reader",
                    "code_39_reader",
                    "code_39_vin_reader",
                    "codabar_reader",
                    "upc_reader",
                    "upc_e_reader",
                    "i2of5_reader"
                ],
                multiple: false
            },
            locate: true
        }, (err: any) => {
            if (err) {
                console.error("Scanner initialization failed:", err);
                toast.error("Failed to initialize scanner");
                return;
            }

            Quagga.start();
            Quagga.onDetected(onBarcodeDetected);
        });
    };

    const onBarcodeDetected = (result: any) => {
        const now = Date.now();

        // Prevent multiple scans in quick succession
        if (now - lastScanTime < 1000) {
            return;
        }

        const code = result.codeResult.code;
        setLastScanTime(now);

        // Play scan sound
        playScanSound();

        // Add to scanned codes
        setScannedCodes(prev => [...prev, code]);

        // Notify parent
        onScan(code);

        // Show success feedback
        toast.success(`Scanned: ${code}`);

        // Auto-stop after scan in single mode
        if (mode === 'inbound' || mode === 'outbound') {
            setTimeout(() => {
                Quagga.stop();
                setIsScanning(false);
            }, 1000);
        }
    };

    const playScanSound = () => {
        const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ');
        audio.play().catch(() => { });
    };

    const startScanning = () => {
        setIsScanning(true);
    };

    const stopScanning = () => {
        Quagga.stop();
        setIsScanning(false);
    };

    const clearScanned = () => {
        setScannedCodes([]);
    };

    const handleManualEntry = () => {
        const code = prompt('Enter barcode manually:');
        if (code) {
            onScan(code);
            setScannedCodes(prev => [...prev, code]);
            toast.success(`Manual entry: ${code}`);
        }
    };

    const getModeTitle = () => {
        switch (mode) {
            case 'inbound': return 'Inbound Scanning';
            case 'outbound': return 'Outbound Scanning';
            default: return 'Inventory Scanning';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl">
                {/* Header */}
                <div className="p-6 border-b flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            <Scan className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">{getModeTitle()}</h2>
                            <p className="text-sm text-gray-600">Scan barcodes using camera or manual entry</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <X className="h-5 w-5 text-gray-600" />
                    </button>
                </div>

                {/* Scanner Area */}
                <div className="p-6">
                    {isScanning ? (
                        <div className="relative">
                            <div
                                ref={scannerRef}
                                className="w-full h-64 bg-black rounded-lg overflow-hidden relative"
                            >
                                {/* Scanner overlay */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-48 h-48 border-2 border-primary-500 border-dashed rounded-lg relative">
                                        {/* Scanning animation */}
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent animate-pulse" />
                                    </div>
                                </div>

                                {/* Scanning instructions */}
                                <div className="absolute bottom-4 left-0 right-0 text-center">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-black bg-opacity-75 text-white rounded-full text-sm">
                                        <Camera className="h-4 w-4" />
                                        Point camera at barcode
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-center gap-4 mt-4">
                                <button
                                    onClick={stopScanning}
                                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    Stop Scanning
                                </button>
                                <button
                                    onClick={handleManualEntry}
                                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                                >
                                    Manual Entry
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary-100 to-primary-50 rounded-full flex items-center justify-center">
                                <Package className="h-12 w-12 text-primary-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Ready to Scan</h3>
                            <p className="text-gray-600 mb-6">Click start to begin scanning barcodes</p>
                            <button
                                onClick={startScanning}
                                className="btn-primary px-8 py-3 text-lg"
                            >
                                <Camera className="h-5 w-5 inline mr-2" />
                                Start Scanning
                            </button>

                            <div className="mt-6">
                                <button
                                    onClick={handleManualEntry}
                                    className="text-primary-600 hover:text-primary-700 font-medium"
                                >
                                    Or enter barcode manually
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Scanned Items List */}
                {scannedCodes.length > 0 && (
                    <div className="border-t p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <h3 className="font-semibold text-gray-800">
                                    Scanned Items ({scannedCodes.length})
                                </h3>
                            </div>
                            <button
                                onClick={clearScanned}
                                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Clear All
                            </button>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {scannedCodes.map((code, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-white rounded-lg border"
                                    >
                                        <div className="font-mono font-medium">{code}</div>
                                        <span className="text-xs text-gray-500">
                                            #{index + 1}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="p-6 border-t bg-gray-50">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-bold text-primary-600">{scannedCodes.length}</div>
                            <div className="text-sm text-gray-600">Items Scanned</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-800">
                                {mode === 'inbound' ? 'IN' : mode === 'outbound' ? 'OUT' : 'INV'}
                            </div>
                            <div className="text-sm text-gray-600">Scan Mode</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-green-600">
                                {isScanning ? 'LIVE' : 'READY'}
                            </div>
                            <div className="text-sm text-gray-600">Scanner Status</div>
                        </div>
                    </div>

                    {mode === 'inventory' && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-blue-800">
                                    <strong>Tip:</strong> Move camera slowly over barcode. Ensure good lighting for best results.
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BarcodeScanner;
