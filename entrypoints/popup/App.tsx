import React, { useState } from 'react';
import { Keyboard } from 'lucide-react';
import TypingArea from './components/TypingArea';
import TypingControls from './components/TypingControls';
import AdvancedSettings from './components/AdvancedSettings';
import ProgressDisplay from './components/ProgressDisplay';
import Instructions from './components/Instructions';
import { useTypingSimulator } from './hooks/useTypingSimulator';
import type { TypingConfig } from './types';

const App: React.FC = () => {
  const [text, setText] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [config, setConfig] = useState<TypingConfig>({
    delay: 50,
    includeMistakes: false,
    soundEnabled: false,
    typingStyle: 'normal',
  });

  const {
    typingState,
    handleStartTyping,
    handlePauseResume,
    handleStop,
  } = useTypingSimulator(text, config);

  const updateConfig = (updates: Partial<TypingConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const getButtonState = () => {
    if (!typingState.isTyping) return 'start';
    if (typingState.isPaused) return 'resume';
    return 'pause';
  };

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

        {/* Typing Area */}
        <TypingArea
          text={text}
          setText={setText}
          disabled={typingState.isTyping}
        />

        {/* Typing Controls */}
        <TypingControls
          config={config}
          updateConfig={updateConfig}
          buttonState={getButtonState()}
          onStart={handleStartTyping}
          onPauseResume={handlePauseResume}
          onStop={handleStop}
          disabled={!text.trim()}
          isTyping={typingState.isTyping}
        />

        {/* Progress Display */}
        {typingState.isTyping && (
          <ProgressDisplay progress={typingState.progress} />
        )}

        {/* Advanced Settings Toggle */}
        <div className="space-y-3">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full py-2 px-4 text-sm font-medium text-gray-700 bg-white 
                     border border-gray-200 rounded-lg hover:bg-gray-50 
                     transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Settings</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''
                }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Advanced Settings */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${showAdvanced ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}
          >
            <AdvancedSettings
              config={config}
              updateConfig={updateConfig}
              disabled={typingState.isTyping}
            />
          </div>
        </div>

        {/* Instructions */}
        <Instructions />

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            v2.0 • Advanced typing simulation for developers
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;