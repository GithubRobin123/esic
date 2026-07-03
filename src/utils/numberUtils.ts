// Normalizes a user-typed/pasted weight value so a comma decimal separator
// (e.g. pasted "12,05") is treated as a decimal point ("12.05") instead of
// being stripped and concatenated into "1205".
export const sanitizeDecimal = (raw: string): string => {
  let v = raw.replace(/,/g, '.');
  v = v.replace(/[^0-9.]/g, '');
  const firstDot = v.indexOf('.');
  if (firstDot !== -1) {
    v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, '');
  }
  return v;
};
