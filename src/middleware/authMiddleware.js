const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token && req.session && req.session.jwtToken) {
      token = req.session.jwtToken;
    }

    if (token) {
      if (!process.env.JWT_SECRET) {
        return res.status(500).json({ message: "JWT secret is not configured." });
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.auth = payload;
      return next();
    }

    if (req.user && req.user._id) {
      req.auth = {
        userId: req.user._id.toString(),
        email: req.user.email || null,
        authProvider: "github-session",
      };
      return next();
    }

    return res.status(401).json({ message: "Authentication required." });
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

module.exports = {
  authenticateToken,
};
