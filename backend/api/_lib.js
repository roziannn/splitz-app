const { neon } = require('@neondatabase/serverless');
const { createHmac, timingSafeEqual, randomBytes, scryptSync } = require('node:crypto');

const sql = () => {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL belum diatur');
  return neon(process.env.DATABASE_URL);
};

async function schema(db) {
  await db`CREATE TABLE IF NOT EXISTS app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  await db`CREATE TABLE IF NOT EXISTS user_receipts (
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    receipt_id TEXT NOT NULL, payload JSONB, updated_at BIGINT NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT false, PRIMARY KEY(user_id, receipt_id)
  )`;
}

function json(res, status, body) { res.status(status).setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body)); }
function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}
function checkPassword(password, stored) {
  const [salt, key] = String(stored).split(':');
  if (!salt || !key) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(key, 'hex');
  return expected.length === actual.length && timingSafeEqual(actual, expected);
}
function tokenFor(user) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET belum diatur');
  const b64 = (v) => Buffer.from(JSON.stringify(v)).toString('base64url');
  const head = b64({ alg: 'HS256', typ: 'JWT' });
  const body = b64({ sub: user.id, email: user.email, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 });
  const data = `${head}.${body}`;
  return `${data}.${createHmac('sha256', secret).update(data).digest('base64url')}`;
}
function userFrom(req) {
  const value = req.headers.authorization || '';
  const token = value.startsWith('Bearer ') ? value.slice(7) : '';
  const parts = token.split('.');
  if (parts.length !== 3 || !process.env.AUTH_SECRET) return null;
  const data = `${parts[0]}.${parts[1]}`;
  const actual = Buffer.from(parts[2], 'base64url');
  const expected = createHmac('sha256', process.env.AUTH_SECRET).update(data).digest();
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    return claims.exp > Date.now() / 1000 ? claims : null;
  } catch { return null; }
}

module.exports = { sql, schema, json, hashPassword, checkPassword, tokenFor, userFrom };
