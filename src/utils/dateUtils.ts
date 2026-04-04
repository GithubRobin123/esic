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

/**
 * Parse a date string as UTC (appends 'Z' if no timezone info present).
 * PostgreSQL TIMESTAMP WITHOUT TIME ZONE is stored as UTC — treat it as UTC.
 */
function parseUtc(val: string): Date {
  // Already has timezone marker (Z or +HH:MM or -HH:MM after position 10)
  if (val.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(val)) {
    return new Date(val);
  }
  // Replace space separator with T and force UTC
  return new Date(val.replace(' ', 'T') + 'Z');
}

/** Format a date+time value as IST — e.g. 22/03/2026, 11:01:49 pm */
export const fmtDateTime = (val: string | null | undefined): string => {
  if (!val) return '—';
  try {
    return dtFmt.format(parseUtc(String(val)));
  } catch {
    return '—';
  }
};

/** Format a date-only value as IST — e.g. 22/03/2026 */
export const fmtDate = (val: string | null | undefined): string => {
  if (!val) return '—';
  try {
    return dFmt.format(parseUtc(String(val)));
  } catch {
    return '—';
  }
};
