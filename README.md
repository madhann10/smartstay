# SmartStay — Hotel Booking & Dynamic Pricing

A modern, full-stack hotel reservation platform featuring algorithmic dynamic pricing, responsive customer booking interfaces, and a database-driven administrative dashboard for hotel inventory, bookings, analytics, pricing rules, and security audits.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Key Features](#key-features)
3. [Technology Stack](#technology-stack)
4. [Architecture & System Design](#architecture--system-design)
   - [Frontend Architecture](#frontend-architecture)
   - [Backend Architecture](#backend-architecture)
   - [Database & Data Models](#database--data-models)
5. [Authentication & Authorization](#authentication--authorization)
6. [Dynamic Pricing Engine](#dynamic-pricing-engine)
7. [Admin Management Dashboard](#admin-management-dashboard)
8. [Project Structure](#project-structure)
9. [Installation & Setup](#installation--setup)
10. [Environment Variables](#environment-variables)
11. [Running the Application](#running-the-application)
    - [Running Backend](#running-the-backend)
    - [Running Frontend](#running-the-frontend)
12. [API Reference](#api-reference)
13. [Testing & Verification](#testing--verification)
14. [Security Notes](#important-security-notes)

---

## Project Overview

SmartStay bridges the gap between hotel operations and modern customer booking expectations. By combining an intuitive customer discovery interface with a machine-learning-informed dynamic pricing engine and a MongoDB-backed administrative control center, SmartStay enables hotels to maximize occupancy, optimize revenue, and streamline booking workflows.

---

## Key Features

- **Customer Hotel Discovery & Booking**: Interactive search, filtering by city and amenities, room type selection, and instant booking reservation.
- **Dynamic Pricing Engine**: Automated room rate calculation adapting to city demand, hotel occupancy rates, weekend surges, seasonality, and booking lead time.
- **Real-Time Admin Dashboard**: Executive KPIs displaying total hotels, available rooms, today's reservations, total revenue, and live booking feeds directly from MongoDB.
- **Hotel & Room Inventory CRUD**: Complete administrator management to create, edit, list (with search & pagination), and remove hotel properties and individual rooms.
- **Booking Management**: Live status monitoring (Confirmed, Completed, Cancelled), reservation lookup, and administrative status transitions.
- **Dynamic Price Override**: Administrative control to inspect calculated dynamic prices and update base room rates with instant re-calculation.
- **Executive Analytics & Reporting**: Interactive charts illustrating revenue trends, occupancy percentages, room-type distributions, and top-performing hotels.
- **Audit & Login Activity**: Detailed security logs tracking user login attempts, IP addresses, user agents, and authentication timestamps.
- **Vite Proxy & Seamless Integration**: Unified development workflow where frontend requests are seamlessly proxied to the Express backend.

---

## Technology Stack

### Frontend
- **React 18** (`react`, `react-dom`): Component-driven user interface
- **Vite 8**: High-performance dev server and production bundler
- **Tailwind CSS v4** (`@tailwindcss/vite`): Modern utility-first styling
- **React Router 7** (`react-router-dom`): Client-side routing and protected routes
- **Axios**: HTTP client with request and response interceptors
- **Recharts**: Responsive charting library for revenue and booking analytics
- **Lucide React**: Clean and modern UI iconography

### Backend
- **Node.js** (ES Modules): Scalable asynchronous runtime
- **Express 4**: RESTful API framework
- **Mongoose 8**: Object Data Modeling (ODM) for MongoDB
- **JSON Web Tokens (JWT)**: Stateless token authentication
- **Bcryptjs**: Salted password hashing
- **Express Rate Limit**: Brute-force and DDoS mitigation
- **Nodemailer**: Email and invoice delivery service
- **PDFKit**: Automated invoice and booking voucher generation

### Database
- **MongoDB** (Atlas or Local): Document-oriented NoSQL database

---

## Architecture & System Design

### Frontend Architecture
- **API Client Layer** (`src/services/api.js`): Single point of communication using Axios with automatic authorization token injection and automatic 401 session expiration handling.
- **State & Route Protection**: Role-based access controls directing customers to their dashboard and administrators to `/admin/*`.
- **Modular Components**: Reusable UI cards, modal dialogs, search bars, and statistics widgets.

### Backend Architecture
- **MVC Architecture**: Segregated controllers (`controllers/`), data models (`models/`), route definitions (`routes/`), and middlewares (`middleware/`).
- **Middleware Pipeline**: Security headers, rate limiting, JSON body parsing, CORS policies, authentication guards, and role verifiers.

### Database & Data Models
- **`User`**: Account identity, contact info, hashed credentials, role (`customer`, `admin`), and status.
- **`Hotel`**: Property details, address, city, state, amenities, ratings, and embedded `rooms` schema.
- **`Booking`**: Unique `bookingId`, guest details, hotel snapshot, date ranges, total price breakdown, and payment status.
- **`LoginActivity`**: Security audit entries recording email, timestamp, IP, device, and result.

---

## Authentication & Authorization

- **Standard Authentication**: Simplified, high-reliability Email and Password authentication for customers and administrators.
- **Token Security**: Tokens are generated using `jsonwebtoken` signed with a secure `JWT_SECRET`.
- **Protected Endpoints**: Admin endpoints require valid Bearer tokens and an `admin` role verified via `isAuthenticated` and `isAdmin` middlewares.
- **Audit Trail**: Every authentication attempt triggers an asynchronous entry in the `LoginActivity` collection for security review.

---

## Dynamic Pricing Engine

SmartStay's dynamic pricing model recalculates room rates based on real-world market variables:

$$\text{Final Price} = \text{Base Price} \times (1 + \text{Demand Factor} + \text{Occupancy Factor} + \text{Season Factor} + \text{Weekend Factor})$$

- **Demand Index**: Market search interest in the property's destination city.
- **Occupancy Rate**: Real-time ratio of occupied rooms to total property capacity.
- **Lead Days**: Discount or surge pricing based on advance booking window.
- **Weekend / Season Surcharge**: Peak pricing applied to high-traffic calendar windows.

Admins can inspect the dynamic prices directly from the **Dynamic Pricing** tab in the dashboard and adjust base rates on demand.

---

## Admin Management Dashboard

Accessible under `/admin`:

1. **Dashboard Overview**: Real-time MongoDB metrics (Hotels, Available Rooms, Today's Bookings, Revenue).
2. **Hotels Manager**: Add new hotels, update existing amenities/ratings, and remove hotels.
3. **Rooms Manager**: Manage rooms per hotel, room capacities, room types, base prices, and availability flags.
4. **Bookings Manager**: Filter by status, search by booking code or guest name, and manage booking statuses.
5. **Dynamic Pricing**: Inspect calculated dynamic multipliers and update room base pricing.
6. **Analytics & Trends**: Revenue charts, booking volume graphs, occupancy breakdowns, and top hotel rankings.
7. **Login Activity**: Live log of all login events with IP and device metadata.
8. **Users Directory**: View registered customer and administrator accounts.

---

## Project Structure

```
Hotel Booking & Dynamic Pricing/
├── config/
│   └── db.js                   # MongoDB connection logic
├── controllers/
│   ├── adminController.js      # Admin CRUD, overview, pricing, analytics
│   ├── authController.js       # Customer and admin authentication
│   ├── bookingController.js    # Reservation workflows and invoices
│   └── hotelController.js      # Public hotel browsing and search
├── middleware/
│   ├── auth.js                 # JWT verification and role enforcement
│   └── rateLimiter.js          # API rate limiting
├── models/
│   ├── Booking.js              # Booking reservation schema
│   ├── Hotel.js                # Hotel and embedded Room schema
│   ├── LoginActivity.js        # Audit logging schema
│   ├── OtpChallenge.js         # Verification challenges schema
│   └── User.js                 # User credentials and profiles
├── routes/
│   ├── adminRoutes.js          # /api/admin endpoints
│   ├── authRoutes.js           # /api/auth endpoints
│   ├── bookingRoutes.js        # /api/bookings endpoints
│   └── hotelRoutes.js          # /api/hotels endpoints
├── scripts/
│   ├── seedAdmin.js            # Admin account seeder
│   ├── seedHotels.js           # Hotel catalog seeder
│   ├── resetAuth.js            # Auth reset utility
│   └── verifyAdminE2E.js       # Automated end-to-end admin tests
├── src/
│   ├── components/             # Reusable UI components & layouts
│   ├── data/                   # Mock data fallbacks for offline dev
│   ├── pages/
│   │   ├── admin/
│   │   │   └── AdminPages.jsx  # Admin dashboard views & modals
│   │   ├── Auth.jsx            # Authentication page
│   │   ├── Booking.jsx         # Booking checkout flow
│   │   ├── CustomerDashboard.jsx # Guest booking history
│   │   └── HotelList.jsx       # Public hotel search
│   ├── services/
│   │   └── api.js              # Centralized Axios client & services
│   ├── App.jsx                 # Application routes & navigation
│   └── main.jsx                # React DOM entry point
├── .env.example                # Sample environment configuration
├── .gitignore                  # Git exclusion rules
├── package.json                # Project dependencies and scripts
├── server.js                   # Express server entry point
├── vite.config.js              # Vite configuration with /api proxy
└── README.md                   # Project documentation
```

---

## Installation & Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Local MongoDB instance or MongoDB Atlas cluster URI

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/madhann10/smartstay.git
   cd smartstay
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment configuration file to create your local `.env`:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` to configure your MongoDB connection string and secrets.

---

## Environment Variables

Configure the following variables in your `.env` file:

| Variable | Description | Example / Default |
| --- | --- | --- |
| `DATABASE_URL` | MongoDB connection URI | `mongodb://localhost:27017/hotel_booking` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `your-secure-jwt-secret-string` |
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Runtime environment (`development` / `production`) | `development` |
| `ALLOWED_ORIGINS` | Comma-separated CORS allowed origins | `http://localhost:5173` |
| `FRONTEND_URL` | Frontend client application URL | `http://localhost:5173` |
| `VITE_API_URL` | (Optional) Remote backend URL for production Vite build | `https://your-backend.onrender.com` |
| `EMAIL_PROVIDER` | Nodemailer provider (`smtp` / `sendgrid`) | `smtp` |
| `EMAIL_HOST` | SMTP server host | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP server port | `587` |
| `EMAIL_USER` | SMTP username / sender email | `your_email@gmail.com` |
| `EMAIL_PASSWORD` | SMTP app password | `your_app_password` |

---

## Running the Application

### Running the Backend

1. **Seed the initial database (Optional):**
   ```bash
   npm run seed:admin
   npm run seed:hotels
   ```

2. **Start the backend server:**
   - With nodemon (hot reloading):
     ```bash
     npm run server
     ```
   - Standard node execution:
     ```bash
     npm run start
     ```
   The backend API will be running on `http://localhost:5000`.

### Running the Frontend

1. **Start the Vite development server:**
   ```bash
   npm run dev
   ```
   The frontend will be accessible at `http://localhost:5173`. Requests to `/api` are automatically proxied to `http://localhost:5000`.

2. **Build for production:**
   ```bash
   npm run build
   ```

---

## API Reference

### Authentication Endpoints (`/api/auth`)
- `POST /api/auth/register` — Register a customer account
- `POST /api/auth/login` — Sign in with email and password
- `POST /api/auth/google` — Google OAuth token exchange
- `POST /api/auth/change-password` — Update user password
- `POST /api/auth/logout` — Logout user session

### Administrator Endpoints (`/api/admin`)
- `GET /api/admin/overview` — Dashboard summary statistics and recent bookings
- `GET /api/admin/profile` — Authenticated admin profile details
- `GET /api/admin/analytics` — Revenue trends, occupancy rates, and room distributions
- `GET /api/admin/hotels` — List hotels with pagination and search
- `POST /api/admin/hotels` — Create a new hotel
- `GET /api/admin/hotels/:id` — Get single hotel details
- `PUT /api/admin/hotels/:id` — Update hotel details
- `DELETE /api/admin/hotels/:id` — Delete hotel
- `GET /api/admin/rooms` — List rooms across hotels
- `POST /api/admin/rooms` — Add room to a hotel
- `PUT /api/admin/rooms/:hotelId/:roomId` — Update room details
- `DELETE /api/admin/rooms/:hotelId/:roomId` — Delete room
- `GET /api/admin/bookings` — List all reservations with search & filter
- `GET /api/admin/bookings/:id` — Get single reservation details
- `PUT /api/admin/bookings/:id/status` — Update booking status
- `DELETE /api/admin/bookings/:id` — Cancel booking
- `GET /api/admin/pricing` — List room rates and dynamic pricing factors
- `PUT /api/admin/pricing/:hotelId/:roomId` — Update room base price
- `GET /api/admin/users` — List registered users
- `GET /api/admin/login-activity` — Audit trail of login events

### Public Hotel Endpoints (`/api/hotels`)
- `GET /api/hotels` — Search and filter available hotels
- `GET /api/hotels/:id` — Get hotel details and room availability

### Booking Endpoints (`/api/bookings`)
- `POST /api/bookings` — Create a room reservation
- `GET /api/bookings/my` — Get current customer's booking history
- `GET /api/bookings/:id/invoice` — Download booking invoice (PDF)

---

## Testing & Verification

SmartStay includes an automated end-to-end verification suite that tests:
- Admin login authentication
- Profile API retrieval
- Overview statistics calculation
- Hotel creation, updating, and cleanup
- Room creation, updating, and cleanup
- Dynamic pricing updates and recalculations
- Database analytics aggregations
- Login activity recording

To execute the verification suite:
```bash
npm run test:e2e
```

To run frontend build checks:
```bash
npm run build
```

---

## Important Security Notes

- **Never Commit Secrets**: Do not commit `.env`, `.env.local`, or any private database credentials to version control. The repository `.gitignore` is configured to exclude these files.
- **Environment Placeholders**: Use `.env.example` as a template for environment configuration. Never populate `.env.example` with production passwords or tokens.
- **Role Verification**: Administrative routes are protected by both `isAuthenticated` and `isAdmin` middleware layers, verifying JWT signatures and user roles in MongoDB on every request.
- **Password Protection**: All passwords are encrypted with `bcryptjs` using salted rounds before storage. Plaintext passwords are never logged or stored.
