export function normalizePhone(value) {
  let compact = String(value || '').replace(/[\s()-]/g, '');
  if (/^[6-9]\d{9}$/.test(compact)) compact = `+91${compact}`;
  if (/^0[6-9]\d{9}$/.test(compact)) compact = `+91${compact.slice(1)}`;
  if (/^\+91[6-9]\d{9}$/.test(compact)) return compact;
  return null;
}
