const pad = (n: number) => String(n).padStart(2, '0');

/** YYYY-MM-DD menurut zona waktu perangkat (bukan UTC). */
export const localIso = (d: Date = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
