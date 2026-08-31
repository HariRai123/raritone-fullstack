function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const userRole = String(req.user.role || "").toLowerCase();

    const roles = allowedRoles.map((role) =>
      String(role).toLowerCase()
    );

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        message: "You are not authorized to perform this action",
      });
    }

    next();
  };
}

module.exports = authorizeRoles;