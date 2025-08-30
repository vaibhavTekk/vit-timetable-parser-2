const googleCalendarService = require('../utils/GoogleCalendarService');

// Middleware to verify Firebase authentication
async function verifyAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await googleCalendarService.verifyToken(idToken);
    
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Auth verification error:', error);
    res.status(401).json({ error: 'Invalid authorization token' });
  }
}

module.exports = { verifyAuth };