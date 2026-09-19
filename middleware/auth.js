import jwt from 'jsonwebtoken';

/**
 * Verifies the JWT from the Authorization header and attaches decoded
 * user data to req.user.
 *
 * Expected header: Authorization: Bearer <token>
 * Expected payload: { id, email, phone, role, sessionId }
 */
export const isAuthenticated = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
      message: 'Authentication required.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    if (decoded && decoded.id && !decoded._id) {
      req.user._id = decoded.id;
    }
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
    });
  }
};

/**
 * Must be used AFTER isAuthenticated.
 * Checks that the authenticated user has role === 'admin'.
 */
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to access this resource.',
    });
  }
  next();
};

// Kept for existing hotel/admin routes.
export const isAdmin = requireRole('admin');
export const isHotelAdmin = requireRole('hotel_admin', 'admin');
