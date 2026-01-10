import React from 'react';

export const BrandTheme: React.FC = () => {
    return (
        <style>{`
      /* ABC Manufacturing Custom Fonts */
      @font-face {
        font-family: 'ABC Industrial';
        src: url('/fonts/ABCIndustrial-Bold.woff2') format('woff2');
        font-weight: 700;
        font-style: normal;
        font-display: swap;
      }
      
      @font-face {
        font-family: 'ABC Industrial';
        src: url('/fonts/ABCIndustrial-Regular.woff2') format('woff2');
        font-weight: 400;
        font-style: normal;
        font-display: swap;
      }
      
      /* Custom Scrollbar */
      ::-webkit-scrollbar {
        width: 10px;
        height: 10px;
      }
      
      ::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 5px;
      }
      
      ::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
        border-radius: 5px;
      }
      
      ::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
      }
      
      /* Selection Color */
      ::selection {
        background-color: rgba(249, 115, 22, 0.3);
        color: #1e293b;
      }
      
      /* Focus Styles */
      :focus-visible {
        outline: 2px solid #f97316;
        outline-offset: 2px;
      }
      
      /* ABC Brand Animations */
      @keyframes abc-spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
      
      .abc-spin {
        animation: abc-spin 1s linear infinite;
      }
      
      /* Factory Loading Animation */
      .factory-loader {
        position: relative;
        overflow: hidden;
      }
      
      .factory-loader::after {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
        animation: loading-shimmer 1.5s infinite;
      }
      
      @keyframes loading-shimmer {
        100% {
          left: 100%;
        }
      }
    `}</style>
    );
};
