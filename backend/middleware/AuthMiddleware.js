const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

/**
 * Middleware to authenticate users using JWT
 */
const authenticateUser = (req, res, next) => {
  // Get the token from the request header
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Access denied. Token is missing." });
  }

  // Extract the token from the header
  const token = authHeader.split(" ")[1];

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach decoded user info to the request
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token." });
  }
};

/**
 * Middleware to restrict access based on user roles
 * @param {Array} allowedRoles - List of roles allowed to access the route
 */
const authorizeRoles = (allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res
      .status(403)
      .json({ message: "Forbidden. You do not have permission." });
  }
  next();
};

module.exports = { authenticateUser, authorizeRoles };
