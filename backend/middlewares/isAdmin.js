// middlewares/isAdmin.js
export const isAdmin = (req, res, next) => {
  try {
    // Check if user is authenticated (assuming this comes from isAuthenticated middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required. Insufficient permissions.'
      });
    }

    // User is admin, proceed to next middleware/route handler
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error checking admin permissions',
      error: error.message
    });
  }
};