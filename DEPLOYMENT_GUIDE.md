# 🚀 Deployment Guide (Free & Zero Error Strategy)

This guide explains how to host your Factory ERP system for **FREE** using the best reliable platforms.

## 📦 Stack Overview
*   **Frontend**: [Vercel](https://vercel.com) (Best for React/Vite)
*   **Backend**: [Render](https://render.com) (Best free Node.js hosting)
*   **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas) (Free Cloud DB)

---

## ✅ Step 1: Prepare Database (MongoDB Atlas)
1.  Log in to [MongoDB Atlas](https://account.mongodb.com/account/login).
2.  Go to **Database** -> **Connect** -> **Drivers**.
3.  Copy your **Connection String** (e.g., `mongodb+srv://user:pass@cluster0.mongodb.net/factory_erp?retryWrites=true&w=majority`).
4.  Replace `<password>` with your actual database password.
5.  **Important**: Go to **Network Access** -> **Add IP Address** -> **Allow Access from Anywhere (0.0.0.0/0)**. This allows Render to connect.

---

## ✅ Step 2: Deploy Backend (Render.com)
1.  Push your latest code to GitHub (Done).
2.  Sign up at [Render.com](https://render.com) using GitHub.
3.  Click **New +** -> **Web Service**.
4.  Select your repository (`gsv_ERP` or similar).
5.  **Settings**:
    *   **Root Directory**: `backend` (Important!)
    *   **Environment**: Node
    *   **Build Command**: `npm install && npm run build`
    *   **Start Command**: `npm start`
6.  **Environment Variables** (Scroll down to 'Advanced'):
    *   Key: `MONGODB_URI` | Value: (Your MongoDB Connection String from Step 1)
    *   Key: `PORT`        | Value: `10000` (Render default)
    *   Key: `JWT_SECRET`  | Value: (Any secret string, e.g., `mysecretkey123`)
7.  Click **Create Web Service**.
8.  **Wait** for it to deploy. Once done, copy the **URL** (e.g., `https://factory-erp-api.onrender.com`).
    *   *Note: Free tier spins down after 15 mins of inactivity. It will take 50s to wake up on first request.*

---

## ✅ Step 3: Deploy Frontend (Vercel)
1.  Sign up at [Vercel.com](https://vercel.com) using GitHub.
2.  Click **Add New...** -> **Project**.
3.  Import your GitHub repository.
4.  **Configure Project**:
    *   **Framework Preset**: Vite (should auto-detect).
    *   **Root Directory**: Click 'Edit' and select `frontend`.
5.  **Environment Variables**:
    *   Key: `VITE_API_URL`
    *   Value: (Your Render Backend URL from Step 2, e.g., `https://factory-erp-api.onrender.com`)
    *   *Do NOT add a trailing slash `/` at the end.*
6.  Click **Deploy**.

---

## 🔍 Troubleshooting Common Issues

### 1. "Network Error" or "Failed to fetch"
*   **Cause**: The Frontend cannot reach the Backend.
*   **Fix**: Check if `VITE_API_URL` in Vercel is correct (no trailing slash).
*   **Fix**: Check if Render backend is "Live". If it's asleep, the first request might time out. Refresh the page after 1 minute.

### 2. "CORS Error"
*   **Cause**: Backend is blocking the Vercel domain.
*   **Fix**: In `backend/src/app.ts`, we already have `app.use(cors())`, so this should work fine.

### 3. White Screen on Frontend
*   **Cause**: Routing issue.
*   **Fix**: Vercel handles Vite apps well, but if you see 404 on refresh, you might need a `vercel.json` rewrites file (usually strictly not needed for generic Vite, but good to know).

### 4. "MongoDB Connection Error"
*   **Cause**: IP Whitelist.
*   **Fix**: Ensure Network Access in MongoDB Atlas is set to `0.0.0.0/0`.

---

## 🚀 Final Check
Once both are Green/Live:
1. Open your **Vercel URL**.
2. Try to **Login**.
3. Go to **Inventory** (This triggers a backend call).
4. If you see data, **Success!** 🎉
