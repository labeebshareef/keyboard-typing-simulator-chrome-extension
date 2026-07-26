import { describe, expect, it } from 'vitest';
import { CHANGELOG, entriesSince } from './whats-new';

describe('CHANGELOG', () => {
  it('is ordered newest first with unique versions', () => {
    const versions = CHANGELOG.map((entry) => entry.version);
    expect(new Set(versions).size).toBe(versions.length);
    const sorted = [...versions].sort((a, b) => {
      const left = a.split('.').map(Number);
      const right = b.split('.').map(Number);
      for (let index = 0; index < 3; index += 1) {
        if ((left[index] ?? 0) !== (right[index] ?? 0)) {
          return (right[index] ?? 0) - (left[index] ?? 0);
        }
      }
      return 0;
    });
    expect(versions).toEqual(sorted);
  });

  it('has content on every entry', () => {
    for (const entry of CHANGELOG) {
      expect(entry.title.length).toBeGreaterThan(0);
      expect(entry.points.length).toBeGreaterThan(0);
    }
  });
});

describe('entriesSince', () => {
  it('returns every release between the previous and installed version', () => {
    const entries = entriesSince('3.0.0', '3.3.0');
    expect(entries.map((entry) => entry.version)).toEqual(['3.3.0', '3.2.0', '3.1.0']);
  });

  it('returns a single release for a one-step update', () => {
    expect(entriesSince('3.2.0', '3.3.0').map((entry) => entry.version)).toEqual(['3.3.0']);
  });

  it('includes everything for users updating from pre-changelog versions', () => {
    expect(entriesSince('2.3.0', '3.3.0').map((entry) => entry.version)).toEqual([
      '3.3.0',
      '3.2.0',
      '3.1.0',
      '3.0.0',
    ]);
  });

  it('never shows entries newer than the installed version', () => {
    expect(entriesSince('3.1.0', '3.2.0').map((entry) => entry.version)).toEqual(['3.2.0']);
  });

  it('is empty when nothing changed', () => {
    expect(entriesSince('3.3.0', '3.3.0')).toEqual([]);
  });
});
