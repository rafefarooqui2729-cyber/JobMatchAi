import {
  getAuthenticatedUser,
  verifyAccessToken,
} from '../services/auth.service.js';

export async function authenticate(req, res, next) {
  const token = req.cookies?.jobmatch_session;
  if (!token) {
    res.status(401).json({ error: { message: 'Authentication required.' } });
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await getAuthenticatedUser(payload.sub);
    if (!user) {
      res.status(401).json({ error: { message: 'Authentication required.' } });
      return;
    }
    req.auth = user;
    next();
  } catch (error) {
    if (error.statusCode) {
      next(error);
      return;
    }
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      res.status(401).json({ error: { message: 'Authentication required.' } });
      return;
    }
    next(error);
  }
}

export function requireSameOrigin(req, res, next) {
  const origin = req.get('origin');
  if (origin && origin !== req.app.locals.clientOrigin) {
    res.status(403).json({ error: { message: 'Request origin is not allowed.' } });
    return;
  }
  next();
}
