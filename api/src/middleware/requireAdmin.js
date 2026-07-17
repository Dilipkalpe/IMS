export function requireAdmin(req, res, next) {
  const role = String(req.authUser?.role ?? '').trim();
  if (!/^administrator$/i.test(role)) {
    return res.status(403).json({ error: 'Administrator access required.' });
  }
  next();
}
