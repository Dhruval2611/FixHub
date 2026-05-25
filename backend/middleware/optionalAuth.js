const jwt = require('jsonwebtoken');

const optionalAuth = (req, res, next) => {
  const token = req.header('x-auth-token');

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    // If token is invalid, we just proceed as guest
    next();
  }
};

module.exports = optionalAuth;
