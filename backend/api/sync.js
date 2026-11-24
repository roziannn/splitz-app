const { sql, schema, json, userFrom } = require('./_lib');
module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'Metode tidak didukung' });
  const user = userFrom(req);
  if (!user) return json(res, 401, { error: 'Sesi berakhir, silakan masuk kembali' });
  try {
    const db = sql(); await schema(db);
    const changes = Array.isArray(req.body?.changes) ? req.body.changes : [];
    if (changes.length > 500) return json(res, 413, { error: 'Terlalu banyak perubahan dalam satu batch' });
    for (const change of changes) {
      if (!change || typeof change.id !== 'string' || !Number.isFinite(change.updatedAt)) continue;
      const deleted = change.deleted === true;
      const payload = deleted ? null : JSON.stringify(change.receipt ?? null);
      if (!deleted && (!change.receipt || change.receipt.id !== change.id)) continue;
      await db`INSERT INTO user_receipts(user_id, receipt_id, payload, updated_at, deleted)
        VALUES(${user.sub}::uuid, ${change.id}, ${payload}::jsonb, ${change.updatedAt}, ${deleted})
        ON CONFLICT(user_id, receipt_id) DO UPDATE SET payload = EXCLUDED.payload,
          updated_at = EXCLUDED.updated_at, deleted = EXCLUDED.deleted
        WHERE EXCLUDED.updated_at >= user_receipts.updated_at`;
    }
    const records = await db`SELECT receipt_id AS id, payload AS receipt, updated_at AS "updatedAt", deleted
      FROM user_receipts WHERE user_id = ${user.sub}::uuid`;
    return json(res, 200, { records });
  } catch (error) {
    console.error('Sync gagal', error.message); return json(res, 500, { error: 'Sinkronisasi gagal' });
  }
};
