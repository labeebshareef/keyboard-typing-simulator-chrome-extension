import { describe, expect, it } from 'vitest';
import { compareVersions, parseRemoteConfig } from './version-gate';

describe('compareVersions', () => {
  it('orders dotted versions numerically', () => {
    expect(compareVersions('3.2.0', '3.3.0')).toBeLessThan(0);
    expect(compareVersions('3.3.0', '3.2.0')).toBeGreaterThan(0);
    expect(compareVersions('3.3.0', '3.3.0')).toBe(0);
    // Numeric, not lexicographic: 3.10 is newer than 3.9.
    expect(compareVersions('3.10.0', '3.9.0')).toBeGreaterThan(0);
    expect(compareVersions('10.0.0', '9.9.9')).toBeGreaterThan(0);
  });

  it('treats missing segments as zero', () => {
    expect(compareVersions('3.3', '3.3.0')).toBe(0);
    expect(compareVersions('3.3', '3.3.1')).toBeLessThan(0);
    expect(compareVersions('4', '3.9.9')).toBeGreaterThan(0);
  });

  it('tolerates malformed segments', () => {
    expect(compareVersions('abc', '1.0')).toBeLessThan(0);
    expect(compareVersions('3.x.0', '3.0.0')).toBe(0);
  });
});

describe('parseRemoteConfig', () => {
  it('accepts a minimal valid config', () => {
    expect(parseRemoteConfig({ minVersion: '3.3.0' })).toEqual({ minVersion: '3.3.0' });
  });

  it('keeps a trimmed custom message and a Web Store updateUrl', () => {
    expect(
      parseRemoteConfig({
        minVersion: '4.0.0',
        message: '  Please update.  ',
        updateUrl: 'https://chromewebstore.google.com/detail/abc',
      })
    ).toEqual({
      minVersion: '4.0.0',
      message: 'Please update.',
      updateUrl: 'https://chromewebstore.google.com/detail/abc',
    });
  });

  it('rejects unusable payloads instead of failing closed', () => {
    expect(parseRemoteConfig(null)).toBeNull();
    expect(parseRemoteConfig('4.0.0')).toBeNull();
    expect(parseRemoteConfig({})).toBeNull();
    expect(parseRemoteConfig({ minVersion: 42 })).toBeNull();
    expect(parseRemoteConfig({ minVersion: 'latest' })).toBeNull();
    expect(parseRemoteConfig({ minVersion: '4.0.0; rm -rf' })).toBeNull();
  });

  it('drops non-Web-Store update URLs and oversized messages', () => {
    const config = parseRemoteConfig({
      minVersion: '4.0.0',
      updateUrl: 'https://evil.example.com/download',
      message: 'x'.repeat(1000),
    });
    expect(config?.updateUrl).toBeUndefined();
    expect(config?.message?.length).toBe(300);
  });
});
