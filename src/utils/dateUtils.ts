const IST = 'Asia/Kolkata';

const dtFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: IST,
  day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  hour12: true,
});

const dFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: IST,
  day: '2-digit', month: '2-digit', year: 'numeric',
});

/** Format a date+time value as IST — e.g. 22/03/2026, 11:01:49 pm */
export const fmtDateTime = (val: string | null | undefined): string => {
  if (!val) return '—';
  try {
    return dtFmt.format(new Date(val));
  } catch {
    return '—';
  }
};

/** Format a date-only value as IST — e.g. 22/03/2026 */
export const fmtDate = (val: string | null | undefined): string => {
  if (!val) return '—';
  try {
    return dFmt.format(new Date(val));
  } catch {
    return '—';
  }
};
