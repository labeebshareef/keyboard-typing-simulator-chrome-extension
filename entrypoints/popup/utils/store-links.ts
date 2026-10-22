/**
 * Chrome Web Store links with UTM tags, so the developer dashboard's
 * "page views by campaign" report can tell which surface sent the visit.
 * Pure URL building — nothing is fetched or tracked on our side.
 */

export const STORE_ID = 'flieihjecdghlbgbmjbilfcabbdplanh';

/** Bare listing URL (no tags) — for display and domain checks. */
export const STORE_URL = `https://chromewebstore.google.com/detail/${STORE_ID}`;

/**
 * @param medium   Where the link lives: 'popup', 'export-page', 'options'.
 * @param campaign What the link is for: 'review-ask', 'update-required'.
 * @param path     Optional store sub-path, e.g. '/reviews'.
 */
export function storeUrl(medium: string, campaign: string, path = ''): string {
  const url = new URL(STORE_URL + path);
  url.searchParams.set('utm_source', 'extension');
  url.searchParams.set('utm_medium', medium);
  url.searchParams.set('utm_campaign', campaign);
  return url.toString();
}
