import { Keyboard } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import AdvancedTyping from './components/AdvancedTyping';
import BasicTyping from './components/BasicTyping';
import SettingsSidebar from './components/SettingsSidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Card } from './components/ui/card';
import { Separator } from './components/ui/separator';
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
    <div className="w-[790px] h-[600px] bg-gradient-to-br from-background to-muted flex flex-col overflow-hidden">
      {/* Header */}
      <Card className="rounded-none border-0 border-b shadow-sm">
        <div className="text-center p-4">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="p-2 bg-primary rounded-lg shadow-sm">
              <Keyboard className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Type Simulator</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Advanced typing simulation with realistic features
          </p>
        </div>
      </Card>

      {/* Main Content Area with Horizontal Layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'basic' | 'advanced')} className="h-full flex flex-col">
            <div className="px-4 pt-3 pb-1 bg-card border-b">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic" disabled={isTypingInProgress}>
                  Basic Typing
                </TabsTrigger>
                <TabsTrigger value="advanced" disabled={isTypingInProgress}>
                  Advanced Typing
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="basic" className="flex-1 mt-0">
              <BasicTyping config={typingConfig} updateConfig={updateTypingConfig} />
            </TabsContent>
            
            <TabsContent value="advanced" className="flex-1 mt-0">
              <AdvancedTyping
                config={advancedConfig}
                typingConfig={typingConfig}
                updateConfig={updateAdvancedConfig}
                updateTypingConfig={updateTypingConfig}
                disabled={isTypingInProgress}
              />
            </TabsContent>
          </Tabs>
        </div>

        <Separator orientation="vertical" />

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
