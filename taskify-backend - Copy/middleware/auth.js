const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const authHeader = req.header('Authorization'); // Get the Authorization header
  if (!authHeader) {
    return res.status(401).json({ message: 'No token, authorization denied!' });
  }

  // Extract the token part from "Bearer <token>"
  const token = authHeader.split(' ')[1]; // Split the header to get the token
  if (!token) {
    return res.status(401).json({ message: 'Token missing!' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id; // Attach the user ID to the request object
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error('Invalid token:', error.message); // Log the error for debugging
    res.status(401).json({ message: 'Invalid token!' });
  }
};

module.exports = auth;
