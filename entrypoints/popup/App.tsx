import { Keyboard } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import AdvancedTyping from './components/AdvancedTyping';
import BasicTyping from './components/BasicTyping';
import SettingsSidebar from './components/SettingsSidebar';
import TabNavigation from './components/TabNavigation';
import type { AdvancedTypingConfig, TypingConfig } from './types';
import logo from './assets/images/ktsLogo.png?url';

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
    aiEnabled: true,
    aiTemperature: 0.7,
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
    <div className="w-full h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      {/* Header */}
      <div className="text-center p-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-center space-x-2 mb-1">
          <div className="p-1.5 bg-primary-100 rounded-lg">
            {/* <Keyboard className="w-5 h-5 text-white" /> */}
            <img
              src={logo}
              alt="KTS Logo"
              className="w-8 rounded-full"
            />
          </div>
          {/* <h1 className="text-2xl font-bold text-gray-600 tracking-wider">TYPE SIMULATOR</h1> */}
          {/* first letter of each word 2xl other letter xl */}
          <h1 className="text-2xl font-bold text-gray-600 tracking-wider">
            T<span className="text-xl">YPE</span> S<span className="text-xl">IMULATOR</span>
          </h1>
          {/* cursor animation */}
          <span className="ml-2 mb-1 animate-blink text-xl font-extrabold text-gray-600">|</span>
        </div>
        <p className="text-xs text-gray-600">
          Advanced typing simulation with realistic features
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="px-4 pt-3 pb-2 bg-white border-b border-gray-200">
        <TabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          disabled={isTypingInProgress}
        />
      </div>

      {/* Main Content Area with Horizontal Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
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
      <div className="text-center py-2 px-4 bg-white border-t border-gray-200">
        <p className="text-xs text-gray-500">
          v2.3.0 • Advanced typing simulation for developers and content creators
        </p>
      </div>
    </div>
  );
};

export default App;
