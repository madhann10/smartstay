# Authentication & User API

All request and response bodies use JSON. Protected endpoints require `Authorization: Bearer <token>`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Register a customer with name, email, phone, password, and optional `confirmPassword` |
| POST | `/api/auth/login` | Email/password login |
| POST | `/api/auth/send-otp` | Send a rate-limited, expiring OTP to a valid Indian mobile number |
| POST | `/api/auth/verify-otp` | Verify a single-use OTP and log in an existing user |
| POST | `/api/auth/logout` | Mark the current login session as logged out |
| POST | `/api/auth/change-password` | Change the authenticated user’s password |
| POST | `/api/auth/forgot-password` | Start the password-reset flow using a generic response |
| POST | `/api/auth/reset-password` | Reset a password with an unexpired reset token |
| GET | `/api/users/me` | Retrieve the authenticated user profile |
| PATCH | `/api/users/me` | Update name, email, phone, and profile fields; role is never accepted |

## Roles

- `customer` — regular user
- `hotel_admin` — hotel-level administrator; does not receive system-admin access
- `admin` — system administrator, created or updated by `npm run seed:admin`

Existing admin routes remain protected by `isAuthenticated` followed by `isAdmin`. New controllers can use `requireRole('hotel_admin', 'admin')` for hotel-level permissions.

## Development notes

`SMS_PROVIDER=mock` does not send a real SMS. For a local OTP test only, set `DEV_OTP_LOGGING=true`, read the OTP from the backend terminal, then set it back to `false`.

Password-reset delivery is an adapter in `services/passwordResetService.js`. It does not return reset tokens to clients. Set `DEV_PASSWORD_RESET_LOGGING=true` only for local testing; replace the adapter with the team’s email provider before deployment.
