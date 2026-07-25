import type {
  AdvancedTypingConfig,
  AssistantPreferences,
  PopupTab,
  ShortcutPreferences,
  ThemePreference,
  TypingConfig,
  TypingStyle,
  UiPreferences,
} from '../types';

export interface Preferences {
  version: 4;
  typing: TypingConfig;
  advanced: AdvancedTypingConfig;
  theme: ThemePreference;
  ui: UiPreferences;
  shortcut: ShortcutPreferences;
  assistant: AssistantPreferences;
}

export const defaultPreferences: Preferences = {
  version: 4,
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
  ui: {
    activeTab: 'basic',
    // Expanded on first run so newcomers see what lives behind the disclosure;
    // persists collapsed once the user collapses it.
    moreOptionsExpanded: true,
    timingExpanded: false,
  },
  shortcut: {
    // Privacy default: the shortcut's saved script lives in session storage
    // only. Users opt in to disk persistence explicitly.
    persistScript: false,
  },
  assistant: {
    // Master capability switch. True by default because icons still only
    // appear when the user summons them on a page; the switch exists as the
    // one-click kill for the whole feature.
    enabled: true,
  },
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const clampNumber = (value: unknown, minimum: number, maximum: number, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, value))
    : fallback;

const asBoolean = (value: unknown, fallback: boolean) =>
  typeof value === 'boolean' ? value : fallback;

export const sanitizePreferences = (value: unknown): Preferences => {
  if (!isRecord(value)) return defaultPreferences;
  const typing = isRecord(value.typing) ? value.typing : {};
  const advanced = isRecord(value.advanced) ? value.advanced : {};
  // v1 payloads have no `ui` section; defaults fill it in.
  const ui = isRecord(value.ui) ? value.ui : {};
  // v1/v2 payloads have no `shortcut` section; defaults fill it in.
  const shortcut = isRecord(value.shortcut) ? value.shortcut : {};
  // v1–v3 payloads have no `assistant` section; defaults fill it in.
  const assistant = isRecord(value.assistant) ? value.assistant : {};
  const styles: TypingStyle[] = ['normal', 'random', 'word-by-word'];
  const themes: ThemePreference[] = ['light', 'dark', 'system'];
  const tabs: PopupTab[] = ['basic', 'advanced'];

  return {
    version: 4,
    typing: {
      delay: clampNumber(typing.delay, 10, 300, defaultPreferences.typing.delay),
      includeMistakes: asBoolean(typing.includeMistakes, defaultPreferences.typing.includeMistakes),
      soundEnabled: asBoolean(typing.soundEnabled, defaultPreferences.typing.soundEnabled),
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
      hideExtension: asBoolean(advanced.hideExtension, defaultPreferences.advanced.hideExtension),
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
    ui: {
      activeTab: tabs.includes(ui.activeTab as PopupTab)
        ? (ui.activeTab as PopupTab)
        : defaultPreferences.ui.activeTab,
      moreOptionsExpanded: asBoolean(
        ui.moreOptionsExpanded,
        defaultPreferences.ui.moreOptionsExpanded
      ),
      timingExpanded: asBoolean(ui.timingExpanded, defaultPreferences.ui.timingExpanded),
    },
    shortcut: {
      persistScript: asBoolean(shortcut.persistScript, defaultPreferences.shortcut.persistScript),
    },
    assistant: {
      enabled: asBoolean(assistant.enabled, defaultPreferences.assistant.enabled),
    },
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
