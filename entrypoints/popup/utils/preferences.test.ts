import { describe, expect, it } from 'vitest';
import { defaultPreferences, sanitizePreferences } from './preferences';

describe('sanitizePreferences', () => {
  it('returns defaults for invalid storage', () => {
    expect(sanitizePreferences(null)).toEqual(defaultPreferences);
    expect(sanitizePreferences('invalid')).toEqual(defaultPreferences);
  });

  it('clamps numeric values and preserves supported choices', () => {
    expect(
      sanitizePreferences({
        typing: {
          delay: 1,
          includeMistakes: true,
          soundEnabled: true,
          typingStyle: 'random',
        },
        advanced: {
          initialDelay: 20,
          hideExtension: true,
          interFieldDelay: -1,
        },
        theme: 'dark',
        ui: {
          activeTab: 'advanced',
          moreOptionsExpanded: false,
          timingExpanded: true,
        },
      })
    ).toEqual({
      version: 2,
      typing: {
        delay: 10,
        includeMistakes: true,
        soundEnabled: true,
        typingStyle: 'random',
      },
      advanced: {
        initialDelay: 10,
        hideExtension: true,
        interFieldDelay: 0,
      },
      theme: 'dark',
      ui: {
        activeTab: 'advanced',
        moreOptionsExpanded: false,
        timingExpanded: true,
      },
    });
  });

  it('migrates v1 payloads (no ui section) without losing settings', () => {
    const result = sanitizePreferences({
      version: 1,
      typing: {
        delay: 120,
        includeMistakes: true,
        soundEnabled: false,
        typingStyle: 'word-by-word',
      },
      advanced: {
        initialDelay: 5,
        hideExtension: true,
        interFieldDelay: 2,
      },
      theme: 'light',
    });

    expect(result.version).toBe(2);
    expect(result.typing.delay).toBe(120);
    expect(result.typing.typingStyle).toBe('word-by-word');
    expect(result.advanced.hideExtension).toBe(true);
    expect(result.theme).toBe('light');
    expect(result.ui).toEqual(defaultPreferences.ui);
  });

  it('falls back to ui defaults for malformed ui values', () => {
    const result = sanitizePreferences({
      ui: {
        activeTab: 'bogus',
        moreOptionsExpanded: 'yes',
        timingExpanded: 1,
      },
    });

    expect(result.ui).toEqual(defaultPreferences.ui);
  });

  it('round-trips ui state', () => {
    const ui = { activeTab: 'advanced', moreOptionsExpanded: false, timingExpanded: true };
    expect(sanitizePreferences({ ...defaultPreferences, ui }).ui).toEqual(ui);
  });

  it('does not copy unknown or sensitive values', () => {
    const result = sanitizePreferences({
      typing: { text: 'secret' },
      fields: [{ text: 'password' }],
      recentText: 'private',
    });

    expect(result).toEqual(defaultPreferences);
    expect(result).not.toHaveProperty('fields');
    expect(result.typing).not.toHaveProperty('text');
  });
});
