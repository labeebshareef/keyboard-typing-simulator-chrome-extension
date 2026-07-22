import type { AdvancedTypingConfig, ThemePreference, TypingConfig, TypingStyle } from '../types';

export interface Preferences {
  version: 1;
  typing: TypingConfig;
  advanced: AdvancedTypingConfig;
  theme: ThemePreference;
}

export const defaultPreferences: Preferences = {
  version: 1,
  typing: {
    delay: 50,
    includeMistakes: false,
    soundEnabled: false,
    typingStyle: 'normal',
  },
  advanced: {
    initialDelay: 2,
    hideExtension: false,
    interFieldDelay: 1,
  },
  theme: 'system',
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const clampNumber = (value: unknown, minimum: number, maximum: number, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, value))
    : fallback;

export const sanitizePreferences = (value: unknown): Preferences => {
  if (!isRecord(value)) return defaultPreferences;
  const typing = isRecord(value.typing) ? value.typing : {};
  const advanced = isRecord(value.advanced) ? value.advanced : {};
  const styles: TypingStyle[] = ['normal', 'random', 'word-by-word'];
  const themes: ThemePreference[] = ['light', 'dark', 'system'];

  return {
    version: 1,
    typing: {
      delay: clampNumber(typing.delay, 10, 300, defaultPreferences.typing.delay),
      includeMistakes:
        typeof typing.includeMistakes === 'boolean'
          ? typing.includeMistakes
          : defaultPreferences.typing.includeMistakes,
      soundEnabled:
        typeof typing.soundEnabled === 'boolean'
          ? typing.soundEnabled
          : defaultPreferences.typing.soundEnabled,
      typingStyle: styles.includes(typing.typingStyle as TypingStyle)
        ? (typing.typingStyle as TypingStyle)
        : defaultPreferences.typing.typingStyle,
    },
    advanced: {
      initialDelay: clampNumber(
        advanced.initialDelay,
        0,
        10,
        defaultPreferences.advanced.initialDelay
      ),
      hideExtension:
        typeof advanced.hideExtension === 'boolean'
          ? advanced.hideExtension
          : defaultPreferences.advanced.hideExtension,
      interFieldDelay: clampNumber(
        advanced.interFieldDelay,
        0,
        5,
        defaultPreferences.advanced.interFieldDelay
      ),
    },
    theme: themes.includes(value.theme as ThemePreference)
      ? (value.theme as ThemePreference)
      : defaultPreferences.theme,
  };
};

const storageKey = 'preferences';

export const loadPreferences = async (): Promise<Preferences> => {
  try {
    const stored = await chrome.storage.local.get(storageKey);
    return sanitizePreferences(stored[storageKey]);
  } catch {
    return defaultPreferences;
  }
};

export const savePreferences = async (preferences: Preferences): Promise<void> => {
  await chrome.storage.local.set({ [storageKey]: sanitizePreferences(preferences) });
};
