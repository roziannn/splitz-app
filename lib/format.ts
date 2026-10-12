export const rupiah = (n: number) =>
  'Rp' + Math.round(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const today = () => new Date().toISOString().slice(0, 10);

export const parseNum = (s: string) => Number(String(s).replace(/[^\d.-]/g, '')) || 0;

export const prettyDate = (iso: string) => {
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};
