function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    // Authentication check
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    // Normalize user's role
    const userRole = String(req.user.role || "").toLowerCase();

    // Normalize allowed roles
    const roles = allowedRoles.map((role) =>
      String(role).toLowerCase()
    );

    // Authorization check
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        message: "You are not authorized to perform this action",
      });
    }

    next();
  };
}

module.exports = authorizeRoles;