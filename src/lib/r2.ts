/**
 * Cloudflare R2 URL helpers
 * 
 * R2 stores files with keys like `userId/timestamp_filename.ext`.
 * The public read base URL is set via NEXT_PUBLIC_R2_PUBLIC_URL env var.
 */

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '';

/**
 * Get the full public URL for an R2 object key.
 * If the value is already a full HTTP URL, returns it as-is (backwards compat with Supabase Storage URLs).
 * Otherwise, prepends the R2 public base URL.
 */
export function getR2PublicUrl(key: string | null | undefined): string {
    if (!key) return '';
    // Already a full URL (legacy Supabase Storage or other)
    if (key.startsWith('http://') || key.startsWith('https://')) return key;
    // Loud warning if R2 public URL is not configured
    if (!R2_PUBLIC_URL) {
        console.error('[R2] NEXT_PUBLIC_R2_PUBLIC_URL is not set. File URLs will be broken.');
    }
    // R2 key → public URL
    return `${R2_PUBLIC_URL}/${key}`;
}
