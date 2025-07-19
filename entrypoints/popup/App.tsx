import React, { useState } from 'react';
import { Keyboard } from 'lucide-react';
import TabNavigation from './components/TabNavigation';
import BasicTyping from './components/BasicTyping';
import AdvancedTyping from './components/AdvancedTyping';
import type { TypingConfig, AdvancedTypingConfig } from './types';

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
    setTypingConfig(prev => ({ ...prev, ...updates }));
  };

  const updateAdvancedConfig = (updates: Partial<AdvancedTypingConfig>) => {
    setAdvancedConfig(prev => ({ ...prev, ...updates }));
  };

  // Check if any typing is in progress to disable tab switching
  const isTypingInProgress = false; // This would need to be tracked properly

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 animate-fade-in">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="p-2 bg-primary-500 rounded-lg">
              <Keyboard className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Type Simulator</h1>
          </div>
          <p className="text-sm text-gray-600">
            Advanced typing simulation with realistic features
          </p>
        </div>

        {/* Tab Navigation */}
        <TabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          disabled={isTypingInProgress}
        />

        {/* Tab Content */}
        {activeTab === 'basic' ? (
          <BasicTyping
            config={typingConfig}
            updateConfig={updateTypingConfig}
          />
        ) : (
          <AdvancedTyping
            config={advancedConfig}
            typingConfig={typingConfig}
            updateConfig={updateAdvancedConfig}
            disabled={isTypingInProgress}
          />
        )}

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            v2.1.0 • Advanced typing simulation for developers
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;