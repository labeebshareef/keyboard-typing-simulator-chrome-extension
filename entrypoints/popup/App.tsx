import { Keyboard } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import AdvancedTyping from './components/AdvancedTyping';
import BasicTyping from './components/BasicTyping';
import SettingsSidebar from './components/SettingsSidebar';
import TabNavigation from './components/TabNavigation';
import type { AdvancedTypingConfig, TypingConfig } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');
  const [typingConfig, setTypingConfig] = useState<TypingConfig>({
    delay: 50,
    includeMistakes: false,
    soundEnabled: false,
    typingStyle: 'normal',
  });
  const [advancedConfig, setAdvancedConfig] = useState<AdvancedTypingConfig>({
    initialDelay: 2,
    hideExtension: false,
    interFieldDelay: 1,
  });

  const updateTypingConfig = (updates: Partial<TypingConfig>) => {
    setTypingConfig((prev) => ({ ...prev, ...updates }));
  };

  const updateAdvancedConfig = (updates: Partial<AdvancedTypingConfig>) => {
    setAdvancedConfig((prev) => ({ ...prev, ...updates }));
  };

  // Check if any typing is in progress to disable tab switching
  const isTypingInProgress = false; // This would need to be tracked properly

  return (
    <div className="w-[790px] h-[600px] bg-gradient-to-br from-emerald-50 to-teal-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="text-center p-3 border-b border-emerald-200 bg-white/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center justify-center space-x-2 mb-1">
          <div className="p-1.5 bg-primary rounded-lg">
            <Keyboard className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-emerald-800">Type Simulator</h1>
        </div>
        <p className="text-xs text-emerald-600">
          Advanced typing simulation with realistic features
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="px-4 pt-2 pb-1 bg-white border-b border-emerald-200 shrink-0">
        <TabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          disabled={isTypingInProgress}
        />
      </div>

      {/* Main Content Area with Horizontal Layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'basic' ? (
            <BasicTyping config={typingConfig} updateConfig={updateTypingConfig} />
          ) : (
            <AdvancedTyping
              config={advancedConfig}
              typingConfig={typingConfig}
              updateConfig={updateAdvancedConfig}
              updateTypingConfig={updateTypingConfig}
              disabled={isTypingInProgress}
            />
          )}
        </div>

        {/* Settings Sidebar */}
        <SettingsSidebar
          typingConfig={typingConfig}
          updateTypingConfig={updateTypingConfig}
          advancedConfig={activeTab === 'advanced' ? advancedConfig : undefined}
          updateAdvancedConfig={activeTab === 'advanced' ? updateAdvancedConfig : undefined}
          disabled={isTypingInProgress}
          showAdvancedSettings={activeTab === 'advanced'}
        />
      </div>

      {/* Footer */}
      <div className="text-center py-1 px-4 bg-white border-t border-emerald-200 shrink-0">
        <p className="text-xs text-emerald-500">
          v2.1.0 • Advanced typing simulation for developers
        </p>
      </div>
    </div>
  );
};

export default App;
