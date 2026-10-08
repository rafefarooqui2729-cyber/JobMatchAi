export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.auth) {
      res.status(401).json({ error: { message: 'Authentication required.' } });
      return;
    }
    if (!roles.includes(req.auth.role)) {
      res.status(403).json({ error: { message: 'You are not authorized to access this resource.' } });
      return;
    }
    next();
  };
}
