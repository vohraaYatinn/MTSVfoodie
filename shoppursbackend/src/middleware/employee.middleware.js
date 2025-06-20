const jwt = require('jsonwebtoken');
const { pool: db } = require('../config/database');

const employeeMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Check if user exists and has employee role
    const [users] = await db.promise().query(
      'SELECT USER_ID, EMAIL, USERNAME, USER_TYPE FROM user_info WHERE USER_ID = ? AND ISACTIVE = "Y"',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    const user = users[0];
    
    // Check if user has employee role
    if (user.USER_TYPE !== 'employee') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Employee privileges required.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

module.exports = employeeMiddleware; 