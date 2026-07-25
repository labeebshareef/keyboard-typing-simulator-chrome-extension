import { Clapperboard } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import logo from './assets/images/ktsLogo-popup.png?url';
import ActionBar from './components/ActionBar';
import AdvancedTyping from './components/AdvancedTyping';
import BasicTyping from './components/BasicTyping';
import HeaderMenu from './components/HeaderMenu';
import ReviewAskCard from './components/ReviewAskCard';
import TabNavigation from './components/TabNavigation';
import { useAi } from './hooks/useAi';
import { useTypingSession } from './hooks/useTypingSession';
import type {
  AdvancedTypingConfig,
  DetectedField,
  PopupTab,
  ShortcutPreferences,
  ThemePreference,
  TypingConfig,
  UiPreferences,
} from './types';
import { saveLastScript } from './utils/last-script';
import { defaultPreferences, loadPreferences, savePreferences } from './utils/preferences';
import { recordCompletedSession } from './utils/review-ask';

const APP_VERSION = 'v3.2.0';

const App: React.FC = () => {
  const [typingConfig, setTypingConfig] = useState<TypingConfig>(defaultPreferences.typing);
  const [advancedConfig, setAdvancedConfig] = useState<AdvancedTypingConfig>(
    defaultPreferences.advanced
  );
  const [theme, setTheme] = useState<ThemePreference>(defaultPreferences.theme);
  const [ui, setUi] = useState<UiPreferences>(defaultPreferences.ui);
  const [shortcut, setShortcut] = useState<ShortcutPreferences>(defaultPreferences.shortcut);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [showReviewAsk, setShowReviewAsk] = useState(false);
  const countedSessionRef = useRef<string | null>(null);

  // Session inputs live here so the ActionBar can gate Start and scan
  // results survive tab switches.
  const [text, setText] = useState('');
  const [detectedFields, setDetectedFields] = useState<DetectedField[]>([]);

  const typingSession = useTypingSession();
  const ai = useAi();
  const isTypingInProgress = typingSession.isActive;
  const activeTab = ui.activeTab;

  useEffect(() => {
    let disposed = false;
    void loadPreferences().then((preferences) => {
      if (disposed) return;
      setTypingConfig(preferences.typing);
      setAdvancedConfig(preferences.advanced);
      setTheme(preferences.theme);
      setUi(preferences.ui);
      setShortcut(preferences.shortcut);
      setPreferencesLoaded(true);
    });
    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    if (!preferencesLoaded) return;
    void savePreferences({
      version: 3,
      typing: typingConfig,
      advanced: advancedConfig,
      theme,
      ui,
      shortcut,
    }).catch(() => undefined);
  }, [advancedConfig, preferencesLoaded, shortcut, theme, typingConfig, ui]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      document.documentElement.dataset.theme =
        theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
    };
    applyTheme();
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [theme]);

  // Count completed sessions (once per session id) for the one-time review ask.
  const sessionPhase = typingSession.status.phase;
  const sessionId = typingSession.status.sessionId;
  useEffect(() => {
    if (sessionPhase !== 'completed' || !sessionId) return;
    if (countedSessionRef.current === sessionId) return;
    countedSessionRef.current = sessionId;
    void recordCompletedSession().then((shouldAsk) => {
      if (shouldAsk) setShowReviewAsk(true);
    });
  }, [sessionId, sessionPhase]);

  // When the popup reopens mid-session, land on the tab of the running mode.
  const sessionMode = typingSession.status.mode;
  useEffect(() => {
    if (!isTypingInProgress || !sessionMode) return;
    setUi((prev) => (prev.activeTab === sessionMode ? prev : { ...prev, activeTab: sessionMode }));
  }, [isTypingInProgress, sessionMode]);

  const updateTypingConfig = (updates: Partial<TypingConfig>) => {
    setTypingConfig((prev) => ({ ...prev, ...updates }));
  };

  const updateAdvancedConfig = (updates: Partial<AdvancedTypingConfig>) => {
    setAdvancedConfig((prev) => ({ ...prev, ...updates }));
  };

  const updateUi = (updates: Partial<UiPreferences>) => {
    setUi((prev) => ({ ...prev, ...updates }));
  };

  const updateShortcut = (updates: Partial<ShortcutPreferences>) => {
    setShortcut((prev) => ({ ...prev, ...updates }));
  };

  /** Hand the current script to the export page and open it in a tab. */
  const handleOpenExport = async () => {
    try {
      await chrome.storage.session.set({ exportPayload: { text, typingConfig } });
    } catch {
      // The export page falls back to manual text entry.
    }
    void chrome.tabs.create({ url: chrome.runtime.getURL('/export.html') });
  };

  const canStart =
    activeTab === 'basic'
      ? text.trim().length > 0
      : detectedFields.some((field) => field.enabled && field.text.trim());

  const startHint =
    activeTab === 'basic'
      ? 'Enter text to begin'
      : detectedFields.length === 0
        ? 'Scan the page to detect fields'
        : 'Enable at least one field and add text';

  const handleStart = async () => {
    if (activeTab === 'basic') {
      const started = await typingSession.startBasic(text, typingConfig);
      // Mirror the script for the keyboard shortcut (session storage by
      // default; disk only when the user opted in).
      if (started) void saveLastScript(text, shortcut.persistScript);
      return;
    }
    const fields = detectedFields
      .filter((field) => field.enabled && field.text.trim())
      .sort((left, right) => left.priority - right.priority);
    if (fields.length === 0) return;
    const started = await typingSession.startAdvanced(fields, typingConfig, advancedConfig);
    if (started && advancedConfig.hideExtension) window.close();
  };

  return (
    <div className="app-shell flex max-h-[var(--popup-max-height)] min-h-[320px] w-full flex-col bg-[var(--surface)] text-[var(--text)]">
      <div className="flex shrink-0 items-center gap-2 border-b border-[var(--border)] px-4 py-2.5">
        <img src={logo} alt="" className="h-7 w-auto" />
        <h1 className="text-sm font-semibold">GhostType</h1>
        <div className="ml-auto flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => void handleOpenExport()}
            disabled={!text.trim()}
            aria-label="Export typing as video or GIF"
            title={
              text.trim()
                ? 'Export typing as video or GIF'
                : 'Enter text in the Basic tab to export a typing video'
            }
            className="flex items-center justify-center rounded-md p-1.5 text-[var(--text-muted)]
                       transition-colors hover:bg-black/5 hover:text-[var(--text)]
                       disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/5"
          >
            <Clapperboard aria-hidden="true" className="h-4 w-4" />
          </button>
          <HeaderMenu
            theme={theme}
            updateTheme={setTheme}
            shortcut={shortcut}
            updateShortcut={updateShortcut}
            version={APP_VERSION}
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="shrink-0 border-b border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2">
        <TabNavigation
          activeTab={activeTab}
          onTabChange={(tab: PopupTab) => updateUi({ activeTab: tab })}
          disabled={isTypingInProgress}
        />
      </div>

      <main className="flex min-h-0 flex-1 flex-col">
        {activeTab === 'basic' ? (
          <BasicTyping
            text={text}
            setText={setText}
            typingConfig={typingConfig}
            updateTypingConfig={updateTypingConfig}
            ai={ai}
            disabled={isTypingInProgress}
            moreOptionsExpanded={ui.moreOptionsExpanded}
            onToggleMoreOptions={(expanded) => updateUi({ moreOptionsExpanded: expanded })}
          />
        ) : (
          <AdvancedTyping
            config={advancedConfig}
            updateConfig={updateAdvancedConfig}
            fields={detectedFields}
            onFieldsChange={setDetectedFields}
            ai={ai}
            disabled={isTypingInProgress}
            timingExpanded={ui.timingExpanded}
            onToggleTiming={(expanded) => updateUi({ timingExpanded: expanded })}
          />
        )}
      </main>

      {showReviewAsk && <ReviewAskCard onClose={() => setShowReviewAsk(false)} />}

      <ActionBar
        session={typingSession}
        canStart={canStart && !isTypingInProgress}
        startHint={startHint}
        onStart={handleStart}
      />
    </div>
  );
};

export default App;
