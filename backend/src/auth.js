'use strict';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-me-in-production-shakti-2026';
const USER_TTL = process.env.JWT_TTL_USER || '30d';
const ADMIN_TTL = process.env.JWT_TTL_ADMIN || '12h';

async function hashPin(pin) { return bcrypt.hash(String(pin), 12); }
async function checkPin(pin, hash) { return bcrypt.compare(String(pin), hash); }

function signUser(u) {
  return jwt.sign({ sub: u.id, role: 'user', phone: u.phone }, JWT_SECRET, { expiresIn: USER_TTL });
}
function signAdmin(a) {
  return jwt.sign({ sub: a.id, role: 'admin:' + a.role, name: a.username }, JWT_SECRET, { expiresIn: ADMIN_TTL });
}
function verify(token) {
  try { return jwt.verify(token, JWT_SECRET); } catch { return null; }
}
function bearer(req) {
  const h = req.headers.authorization || '';
  const m = h.match(/^Bearer (.+)$/);
  return m ? verify(m[1]) : null;
}
function requireUser(req, res, next) {
  const t = bearer(req);
  if (!t || t.role !== 'user') return res.status(401).json({ error: 'login required' });
  req.auth = t; next();
}
function requireAdmin(roles = []) {
  return (req, res, next) => {
    const t = bearer(req);
    if (!t || !String(t.role || '').startsWith('admin:')) return res.status(401).json({ error: 'admin login required' });
    const role = String(t.role).slice(6);
    if (roles.length && !roles.includes(role) && role !== 'super_admin') {
      return res.status(403).json({ error: 'forbidden for role ' + role });
    }
    req.auth = t; req.adminRole = role; next();
  };
}

module.exports = { hashPin, checkPin, signUser, signAdmin, verify, requireUser, requireAdmin, JWT_SECRET };
