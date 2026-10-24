/**
 * Supabase Storage already serves the catalog's public media from its own CDN.
 * Passing those URLs through Next's optimizer spends Vercel Image
 * Transformations for no storage or authorization benefit.
 */
export function isSupabaseStorageImage(src: string | null | undefined): boolean {
  if (!src) return false;

  try {
    const url = new URL(src);
    return url.protocol === 'https:' &&
      url.hostname.endsWith('.supabase.co') &&
      url.pathname.startsWith('/storage/v1/object/');
  } catch {
    return false;
  }
}
