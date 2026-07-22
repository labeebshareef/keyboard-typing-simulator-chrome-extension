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
      })
    ).toEqual({
      version: 1,
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
    });
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
