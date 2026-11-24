const { sql, schema, json, hashPassword, tokenFor } = require('../_lib');
module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'Metode tidak didukung' });
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (!/^\S+@\S+\.\S+$/.test(email)) return json(res, 400, { error: 'Email tidak valid' });
  if (password.length < 8) return json(res, 400, { error: 'Kata sandi minimal 8 karakter' });
  if (password.length > 128) return json(res, 400, { error: 'Kata sandi terlalu panjang' });
  try {
    // Periksa secret sebelum insert agar konfigurasi yang belum lengkap tidak
    // membuat akun tersimpan tanpa token yang bisa dipakai untuk login.
    if (!process.env.AUTH_SECRET) throw new Error('AUTH_SECRET belum diatur');
    const db = sql(); await schema(db);
    const rows = await db`INSERT INTO app_users(email, password_hash) VALUES(${email}, ${hashPassword(password)}) RETURNING id, email`;
    const user = rows[0];
    return json(res, 201, { token: tokenFor(user), user });
  } catch (error) {
    if (error.code === '23505') return json(res, 409, { error: 'Email sudah terdaftar' });
    console.error('Register gagal', error.message); return json(res, 500, { error: 'Tidak dapat membuat akun' });
  }
};
