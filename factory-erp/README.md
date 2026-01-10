# Factory ERP System

A comprehensive Enterprise Resource Planning (ERP) system designed for manufacturing industries, featuring Inventory Management, Production Tracking, GST Invoicing, and Barcode/RFID integration.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- MongoDB (v6.0+)
- Docker (Optional, for easy deployment)

### Option 1: Run with Docker (Recommended)
This will set up the Database, Backend, and Frontend automatically.

```bash
# Build and start services
docker-compose up -d --build
```

Access the application:
- **Frontend:** http://localhost:80
- **Backend API:** http://localhost:5000

### Option 2: Run Locally (Manual)

#### 1. Backend Setup
```bash
cd backend
npm install
npm run dev
```
*Backend will run on http://localhost:5000*

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend will run on http://localhost:5173*

## 🔑 Default Credentials

- **Employee ID:** `MFG-001`
- **Password:** `admin123`
- **Role:** `Admin`

## 📦 Key Features

- **Inventory:** Track raw materials, semi-finished, and finished goods.
- **Production:** Manage production orders and stages.
- **Sales & GST:** Generate GST-compliant invoices (B2B/B2C).
- **Barcode/RFID:** Integrated scanning for stock movements.
- **Reports:** Export Stock, Sales, and GST reports in Excel/PDF.

## 🛠Configuration

- **Backend:** Update `backend/.env` for Database URL, Email (SendGrid/SMTP), and Cloudinary keys.
- **Frontend:** Update `frontend/.env` for API URL and feature flags.
- **Branding:** Update `tailwind.config.js` and `branding/` folder for logos/colors.

## 🤝 Support

For technical support, contact the IT department or raise an issue in the repository.
