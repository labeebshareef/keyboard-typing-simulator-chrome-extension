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
        shortcut: {
          persistScript: true,
        },
        assistant: {
          enabled: false,
        },
      })
    ).toEqual({
      version: 4,
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
      shortcut: {
        persistScript: true,
      },
      assistant: {
        enabled: false,
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

    expect(result.version).toBe(4);
    expect(result.typing.delay).toBe(120);
    expect(result.typing.typingStyle).toBe('word-by-word');
    expect(result.advanced.hideExtension).toBe(true);
    expect(result.theme).toBe('light');
    expect(result.ui).toEqual(defaultPreferences.ui);
    expect(result.shortcut).toEqual(defaultPreferences.shortcut);
    expect(result.assistant).toEqual(defaultPreferences.assistant);
  });

  it('migrates v2 payloads (no shortcut section) without losing settings', () => {
    const result = sanitizePreferences({
      version: 2,
      typing: {
        delay: 80,
        includeMistakes: false,
        soundEnabled: true,
        typingStyle: 'normal',
      },
      advanced: {
        initialDelay: 3,
        hideExtension: false,
        interFieldDelay: 1,
      },
      theme: 'dark',
      ui: {
        activeTab: 'advanced',
        moreOptionsExpanded: false,
        timingExpanded: true,
      },
    });

    expect(result.version).toBe(4);
    expect(result.typing.delay).toBe(80);
    expect(result.ui.activeTab).toBe('advanced');
    // Privacy default: persistScript stays off unless explicitly enabled.
    expect(result.shortcut).toEqual({ persistScript: false });
    // v2 has no assistant section → capability defaults on.
    expect(result.assistant).toEqual({ enabled: true });
  });

  it('migrates v3 payloads (no assistant section) without losing settings', () => {
    const result = sanitizePreferences({
      version: 3,
      typing: {
        delay: 60,
        includeMistakes: true,
        soundEnabled: false,
        typingStyle: 'random',
      },
      shortcut: { persistScript: true },
    });

    expect(result.version).toBe(4);
    expect(result.typing.delay).toBe(60);
    expect(result.shortcut).toEqual({ persistScript: true });
    expect(result.assistant).toEqual({ enabled: true });
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

  it('falls back to shortcut defaults for malformed shortcut values', () => {
    const result = sanitizePreferences({
      shortcut: {
        persistScript: 'yes',
      },
    });

    expect(result.shortcut).toEqual(defaultPreferences.shortcut);
  });

  it('round-trips ui state', () => {
    const ui = { activeTab: 'advanced', moreOptionsExpanded: false, timingExpanded: true };
    expect(sanitizePreferences({ ...defaultPreferences, ui }).ui).toEqual(ui);
  });

  it('round-trips shortcut opt-in', () => {
    const shortcut = { persistScript: true };
    expect(sanitizePreferences({ ...defaultPreferences, shortcut }).shortcut).toEqual(shortcut);
  });

  it('round-trips the assistant master switch and rejects malformed values', () => {
    const assistant = { enabled: false };
    expect(sanitizePreferences({ ...defaultPreferences, assistant }).assistant).toEqual(assistant);
    expect(sanitizePreferences({ assistant: { enabled: 'yes' } }).assistant).toEqual(
      defaultPreferences.assistant
    );
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
