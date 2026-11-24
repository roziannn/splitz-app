const { sql, schema, json, checkPassword, tokenFor } = require('../_lib');
module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'Metode tidak didukung' });
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  try {
    const db = sql(); await schema(db);
    const rows = await db`SELECT id, email, password_hash FROM app_users WHERE email = ${email} LIMIT 1`;
    const row = rows[0];
    if (!row || !checkPassword(password, row.password_hash)) return json(res, 401, { error: 'Email atau kata sandi salah' });
    const user = { id: row.id, email: row.email };
    return json(res, 200, { token: tokenFor(user), user });
  } catch (error) {
    console.error('Login gagal', error.message); return json(res, 500, { error: 'Tidak dapat masuk' });
  }
};
