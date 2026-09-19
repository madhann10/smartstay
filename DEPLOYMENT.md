# SmartStay — Production Deployment Guide

This guide provides step-by-step instructions for deploying the **SmartStay Hotel Booking & Dynamic Pricing System** to public HTTPS hosting (e.g. Render/Railway for backend, Vercel/Netlify for frontend) using your existing MongoDB Atlas cluster.

---

## Architecture Overview

```text
Customer & Admin Browsers (Laptops / Phones)
                     │
                     ▼
  Public HTTPS Frontend (Vercel / Netlify / Render)
  [VITE_API_URL = https://smartstay-api.onrender.com]
                     │
                     ▼
  Public HTTPS Backend API (Render / Railway / AWS)
  [Listens on PORT, CORS enabled for frontend domain]
                     │
                     ▼
         MongoDB Atlas Database Cluster
     [Shared database between Customer & Admin]
```

---

## 1. What to Upload to GitHub vs What NOT to Upload

### Upload to GitHub:
- Source code files (`server.js`, `models/`, `controllers/`, `routes/`, `src/`, `scripts/`, `services/`, `middleware/`, `config/`)
- `package.json` & `package-lock.json`
- `.env.example`
- `.gitignore`
- Documentation files (`README.md`, `DEPLOYMENT.md`)

### DO NOT Upload (Keep Private / In .gitignore):
- `.env` (contains your database credentials, JWT secrets, email passwords)
- `node_modules/`
- `dist/` (build output)

---

## 2. Deployment Steps

### A. Deploy Backend (Node.js API) — Recommended: Render / Railway

1. Push your repository to GitHub.
2. Log into **Render** (render.com) or **Railway** (railway.app).
3. Create a **New Web Service** and connect your GitHub repository.
4. Set the configuration:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start` (or `node server.js`)
5. In the **Environment Variables** section of Render/Railway, add:
   - `DATABASE_URL` = `mongodb+srv://<user>:<password>@cluster.mongodb.net/hotel_booking?retryWrites=true&w=majority`
   - `JWT_SECRET` = `your-secure-random-jwt-secret`
   - `OTP_HASH_SECRET` = `your-secure-random-otp-secret`
   - `NODE_ENV` = `production`
   - `ALLOWED_ORIGINS` = `https://your-frontend-domain.vercel.app`
   - `FRONTEND_URL` = `https://your-frontend-domain.vercel.app`
   - `EMAIL_PROVIDER` = `smtp` (or `mock` for testing)
   - `EMAIL_HOST` = `smtp.gmail.com`
   - `EMAIL_PORT` = `587`
   - `EMAIL_USER` = `your-email@gmail.com`
   - `EMAIL_PASSWORD` = `your-app-password`
   - `EMAIL_FROM` = `SmartStay <noreply@smartstay.com>`
6. Deploy the web service and copy your public backend URL (e.g. `https://smartstay-backend.onrender.com`).

---

### B. Deploy Frontend (React + Vite) — Recommended: Vercel / Netlify

1. Log into **Vercel** (vercel.com) or **Netlify** (netlify.com).
2. Create a **New Project** and select your GitHub repository.
3. Set the build settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add **Environment Variables**:
   - `VITE_API_URL` = `https://smartstay-backend.onrender.com`
   - `VITE_GOOGLE_CLIENT_ID` = `your-google-client-id.apps.googleusercontent.com`
5. Click **Deploy**. Vercel/Netlify will assign a public HTTPS domain (e.g. `https://smartstay.vercel.app`).

---

## 3. MongoDB Atlas Configuration

1. Log into **MongoDB Atlas** (cloud.mongodb.com).
2. Go to **Network Access** under Security.
3. Click **Add IP Address**.
4. Choose **Allow Access from Anywhere** (`0.0.0.0/0`) so your deployed backend service (Render/Railway) can connect.
5. Your database string in `.env` or Render environment settings is:
   `DATABASE_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/hotel_booking?retryWrites=true&w=majority`

---

## 4. Google OAuth Production Configuration

1. Go to **Google Cloud Console** (console.cloud.google.com).
2. Select your project -> **APIs & Services** -> **Credentials**.
3. Edit your OAuth 2.0 Client ID.
4. Under **Authorized JavaScript origins**, add:
   - `https://your-frontend-domain.vercel.app`
   - `http://localhost:5173` (keep for dev)
5. Save changes.

---

## 5. Verification & End-to-End Testing

1. Open your deployed website from another laptop or phone (`https://your-frontend-domain.vercel.app`).
2. Register a new user or log in.
3. Search hotels, pick a room, select dates, and click **Confirm Booking**.
4. Verify invoice generation & check your email for the confirmation email + attached PDF invoice.
5. Log into the **Admin Dashboard** (`https://your-frontend-domain.vercel.app/admin`).
6. Confirm the customer's booking appears live in **Admin Bookings** and **Overview Revenue**.
