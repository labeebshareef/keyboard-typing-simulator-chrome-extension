import type React from 'react';
import { useEffect, useState } from 'react';
import logo from './assets/images/ktsLogo-popup.png?url';
import ActionBar from './components/ActionBar';
import AdvancedTyping from './components/AdvancedTyping';
import BasicTyping from './components/BasicTyping';
import HeaderMenu from './components/HeaderMenu';
import TabNavigation from './components/TabNavigation';
import { useTypingSession } from './hooks/useTypingSession';
import type {
  AdvancedTypingConfig,
  DetectedField,
  PopupTab,
  ThemePreference,
  TypingConfig,
  UiPreferences,
} from './types';
import { defaultPreferences, loadPreferences, savePreferences } from './utils/preferences';

const APP_VERSION = 'v2.3.0';

const App: React.FC = () => {
  const [typingConfig, setTypingConfig] = useState<TypingConfig>(defaultPreferences.typing);
  const [advancedConfig, setAdvancedConfig] = useState<AdvancedTypingConfig>(
    defaultPreferences.advanced
  );
  const [theme, setTheme] = useState<ThemePreference>(defaultPreferences.theme);
  const [ui, setUi] = useState<UiPreferences>(defaultPreferences.ui);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  // Session inputs live here so the ActionBar can gate Start and scan
  // results survive tab switches.
  const [text, setText] = useState('');
  const [detectedFields, setDetectedFields] = useState<DetectedField[]>([]);

  const typingSession = useTypingSession();
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
      setPreferencesLoaded(true);
    });
    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    if (!preferencesLoaded) return;
    void savePreferences({
      version: 2,
      typing: typingConfig,
      advanced: advancedConfig,
      theme,
      ui,
    }).catch(() => undefined);
  }, [advancedConfig, preferencesLoaded, theme, typingConfig, ui]);

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
      await typingSession.startBasic(text, typingConfig);
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
        <h1 className="text-sm font-semibold">Keyboard Typing Simulator</h1>
        <div className="ml-auto">
          <HeaderMenu theme={theme} updateTheme={setTheme} version={APP_VERSION} />
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
            disabled={isTypingInProgress}
            timingExpanded={ui.timingExpanded}
            onToggleTiming={(expanded) => updateUi({ timingExpanded: expanded })}
          />
        )}
      </main>

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
