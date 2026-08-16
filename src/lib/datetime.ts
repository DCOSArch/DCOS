/**
 * Deterministic date/time formatting.
 *
 * Bare `toLocaleDateString()` / `toLocaleTimeString()` resolve against the
 * RUNTIME's locale and timezone. The Node server and the user's browser rarely
 * agree, so any date rendered during SSR arrives as different text on the
 * client — React reports a hydration mismatch and repaints the subtree.
 *
 * Pinning both locale and timeZone makes server and client emit byte-identical
 * strings. DCOS is an India-market product, so the clinic's own frame of
 * reference is the correct one rather than whatever the server happens to be
 * configured with.
 *
 * These helpers also swallow invalid/absent dates and return an em-dash, so a
 * malformed timestamp renders as obviously-missing instead of "Invalid Date".
 */

const LOCALE = 'en-IN';
const TIME_ZONE = 'Asia/Kolkata';

export type DateInput = string | number | Date | null | undefined;

const toDate = (value: DateInput): Date | null => {
  if (value === null || value === undefined || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** e.g. "16/8/2026", or pass Intl options for a longer form. */
export function formatDate(value: DateInput, opts: Intl.DateTimeFormatOptions = {}): string {
  const d = toDate(value);
  if (!d) return '—';
  return d.toLocaleDateString(LOCALE, { timeZone: TIME_ZONE, ...opts });
}

/** e.g. "10:15 am". Defaults to 2-digit hour and minute. */
export function formatTime(value: DateInput, opts: Intl.DateTimeFormatOptions = {}): string {
  const d = toDate(value);
  if (!d) return '—';
  return d.toLocaleTimeString(LOCALE, {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    ...opts,
  });
}
