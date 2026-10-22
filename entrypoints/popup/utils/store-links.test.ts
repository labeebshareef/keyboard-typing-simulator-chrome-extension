import { describe, expect, it } from 'vitest';
import { STORE_URL, storeUrl } from './store-links';

describe('storeUrl', () => {
  it('tags a store sub-page with utm parameters', () => {
    expect(storeUrl('popup', 'review-ask', '/reviews')).toBe(
      `${STORE_URL}/reviews?utm_source=extension&utm_medium=popup&utm_campaign=review-ask`
    );
  });

  it('tags the listing itself when no path is given', () => {
    expect(storeUrl('popup', 'update-required')).toBe(
      `${STORE_URL}?utm_source=extension&utm_medium=popup&utm_campaign=update-required`
    );
  });

  it('keeps the bare listing URL untagged', () => {
    expect(STORE_URL).toBe(
      'https://chromewebstore.google.com/detail/flieihjecdghlbgbmjbilfcabbdplanh'
    );
  });
});
