function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login?message=Please login first.");
  }

  next();
}

function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.redirect("/login?message=Please login first.");
    }

    if (!roles.includes(req.session.user.role)) {
      return res.status(403).send("Access denied for this role.");
    }

    next();
  };
}

module.exports = {
  requireAuth,
  allowRoles,
};
