import { track } from '@vercel/analytics';

/**
 * Values allowed as custom-event properties. Matches Vercel Analytics'
 * AllowedPropertyValues and what GA4 accepts as event params.
 */
type EventProps = Record<string, string | number | boolean | null>;

/**
 * Fire a single conversion / interaction event into every analytics sink that
 * happens to be live. Both calls are guarded and no-op safely when the
 * corresponding tool isn't enabled yet:
 *
 *  - Vercel Web Analytics — `track()` queues harmlessly until the project has
 *    Analytics enabled in the Vercel dashboard.
 *  - Google Analytics 4 — only fires if the gtag script loaded, which happens
 *    only when NEXT_PUBLIC_GA_MEASUREMENT_ID is set (see app/layout.tsx).
 *
 * This means we can wire events now and they start reporting the moment either
 * tool is switched on — no code change required later.
 */
export function trackEvent(name: string, props?: EventProps): void {
  try {
    track(name, props);
  } catch {
    // analytics must never break a user flow
  }

  try {
    const w = window as unknown as {
      gtag?: (command: string, eventName: string, params?: EventProps) => void;
    };
    if (typeof window !== 'undefined' && typeof w.gtag === 'function') {
      w.gtag('event', name, props ?? {});
    }
  } catch {
    // no-op
  }
}
