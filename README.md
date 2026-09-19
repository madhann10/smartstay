# SmartStay — Hotel Booking & Dynamic Pricing

A responsive React frontend for a hotel-booking system. It provides customer discovery and booking screens plus a protected administration workspace for hotels, rooms, bookings, pricing, users, and analytics.

## Run locally

```bash
npm run dev
```

The project folder contains an ampersand, so the npm scripts deliberately invoke Vite through Node. This keeps the commands working on Windows.

## Main routes

| Area | Routes |
| --- | --- |
| Customer | `/`, `/hotels`, `/hotels/:id`, `/booking`, `/booking/confirmation`, `/dashboard` |
| Authentication | `/login`, `/register` |
| Admin | `/admin`, `/admin/hotels`, `/admin/rooms`, `/admin/bookings`, `/admin/pricing`, `/admin/users`, `/admin/analytics`, `/admin/settings` |

For the demonstration login, tick **Sign in as administrator** to access the protected admin workspace.

## API integration

All frontend requests are centralized in `src/services/api.js` and use Axios. Set the backend endpoint with:

```bash
VITE_API_BASE_URL=http://localhost:5000/api
```

The service is already prepared for hotel, booking, pricing, and analytics endpoints. When an endpoint is unavailable during frontend development, realistic display-only mock data from `src/data/mockData.js` is used as a fallback. Dynamic prices are never calculated by the React interface; the pricing screen is structured to display API values supplied by the pricing service.

## Authentication and login activity

Copy `.env.example` to `.env`, configure MongoDB and long random secrets, then create the first administrator:

```bash
npm run seed:admin
npm run server
npm run dev
```

Email/password and mobile OTP use `/api/auth`. Successful and failed authentication attempts are stored in MongoDB as login-activity records. The protected admin Login Activity screen reads those records from `/api/admin/login-activity`; it has no mock fallback.

`SMS_PROVIDER=mock` is explicitly a development-only no-delivery mode. It does not send an OTP to the browser. For a local OTP test, set `DEV_OTP_LOGGING=true`, use the code printed by the server only in your local terminal, then reset it to `false`. Configure a real provider through the `SMS_PROVIDER_*` environment variables before deployment.

## Stack

- React + Vite + React Router
- Tailwind CSS
- Axios
- Recharts
- Lucide React
