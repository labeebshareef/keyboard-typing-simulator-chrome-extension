import type React from 'react';
import { useEffect, useState } from 'react';
import logo from './assets/images/ktsLogo-popup.png?url';
import AdvancedTyping from './components/AdvancedTyping';
import BasicTyping from './components/BasicTyping';
import SettingsSidebar from './components/SettingsSidebar';
import TabNavigation from './components/TabNavigation';
import { useTypingSession } from './hooks/useTypingSession';
import type { AdvancedTypingConfig, ThemePreference, TypingConfig } from './types';
import { defaultPreferences, loadPreferences, savePreferences } from './utils/preferences';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');
  const [typingConfig, setTypingConfig] = useState<TypingConfig>(defaultPreferences.typing);
  const [advancedConfig, setAdvancedConfig] = useState<AdvancedTypingConfig>(
    defaultPreferences.advanced
  );
  const [theme, setTheme] = useState<ThemePreference>(defaultPreferences.theme);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const typingSession = useTypingSession();
  const isTypingInProgress = typingSession.isActive;

  useEffect(() => {
    let disposed = false;
    void loadPreferences().then((preferences) => {
      if (disposed) return;
      setTypingConfig(preferences.typing);
      setAdvancedConfig(preferences.advanced);
      setTheme(preferences.theme);
      setPreferencesLoaded(true);
    });
    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    if (!preferencesLoaded) return;
    void savePreferences({
      version: 1,
      typing: typingConfig,
      advanced: advancedConfig,
      theme,
    }).catch(() => undefined);
  }, [advancedConfig, preferencesLoaded, theme, typingConfig]);

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

  const updateTypingConfig = (updates: Partial<TypingConfig>) => {
    setTypingConfig((prev) => ({ ...prev, ...updates }));
  };

  const updateAdvancedConfig = (updates: Partial<AdvancedTypingConfig>) => {
    setAdvancedConfig((prev) => ({ ...prev, ...updates }));
  };

  return (
    <div className="app-shell flex h-[600px] w-full flex-col bg-[var(--surface)] text-[var(--text)]">
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
        <img src={logo} alt="" className="h-7 w-auto" />
        <h1 className="text-base font-semibold">Keyboard Typing Simulator</h1>
        <span className="ml-auto text-xs text-[var(--text-muted)]">v2.3.0</span>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2">
        <TabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          disabled={isTypingInProgress}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        <main>
          {activeTab === 'basic' ? (
            <BasicTyping config={typingConfig} session={typingSession} />
          ) : (
            <AdvancedTyping
              config={advancedConfig}
              typingConfig={typingConfig}
              disabled={isTypingInProgress}
              session={typingSession}
            />
          )}
        </main>

        <SettingsSidebar
          typingConfig={typingConfig}
          updateTypingConfig={updateTypingConfig}
          advancedConfig={activeTab === 'advanced' ? advancedConfig : undefined}
          updateAdvancedConfig={activeTab === 'advanced' ? updateAdvancedConfig : undefined}
          disabled={isTypingInProgress}
          showAdvancedSettings={activeTab === 'advanced'}
          theme={theme}
          updateTheme={setTheme}
        />
      </div>

      <div
        aria-live="polite"
        className="min-h-9 border-t border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2 text-xs text-[var(--text-muted)]"
        role={typingSession.error ? 'alert' : 'status'}
      >
        {typingSession.error || typingSession.status.message || 'Ready'}
      </div>
    </div>
  );
};

export default App;
