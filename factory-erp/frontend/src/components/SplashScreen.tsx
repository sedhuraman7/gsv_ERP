import React, { useEffect, useState } from 'react';
import { Factory } from 'lucide-react';

const SplashScreen: React.FC = () => {
    const [loadingText, setLoadingText] = useState('Loading...');
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const texts = [
            'Initializing Factory ERP System...',
            'Loading Inventory Module...',
            'Setting up Production Tracking...',
            'Configuring Billing System...',
            'Preparing Dashboard...',
            'Almost Ready...'
        ];

        let currentIndex = 0;
        const interval = setInterval(() => {
            setLoadingText(texts[currentIndex]);
            setProgress(((currentIndex + 1) / texts.length) * 100);
            currentIndex = (currentIndex + 1) % texts.length;
        }, 800);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex flex-col items-center justify-center">
            {/* Factory Logo */}
            <div className="mb-8 animate-bounce">
                <div className="relative">
                    <div className="w-32 h-32 bg-gradient-to-br from-primary-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-2xl">
                        <Factory className="w-16 h-16 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-10 h-10 bg-primary-400 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">ERP</span>
                    </div>
                </div>
            </div>

            {/* Company Name */}
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-primary-700 mb-2">
                    GSV Manufacturing
                </h1>
                <p className="text-gray-600 text-lg">Industrial ERP System</p>
            </div>

            {/* Loading Animation */}
            <div className="w-80 max-w-full">
                {/* Progress Bar */}
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-4">
                    <div
                        className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Loading Text */}
                <div className="text-center">
                    <p className="text-gray-700 mb-2 font-medium">{loadingText}</p>
                    <div className="flex items-center justify-center space-x-2">
                        {[...Array(3)].map((_, i) => (
                            <div
                                key={i}
                                className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"
                                style={{ animationDelay: `${i * 0.2}s` }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Version & Footer */}
            <div className="absolute bottom-8 text-center">
                <p className="text-gray-500 text-sm">Version 2.1.0</p>
                <p className="text-gray-400 text-xs mt-1">© 2026 GSV Manufacturing. All rights reserved.</p>
            </div>

            {/* Animated Factory Elements */}
            <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden opacity-20">
                <div className="flex justify-between px-8">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                            <div className="w-12 h-16 bg-gray-300 rounded-t-lg" />
                            <div className="w-16 h-2 bg-gray-400 mt-2" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SplashScreen;
