import { useState } from 'react';
import type React from 'react';
import TypingArea from './TypingArea';
import TypingControls from './TypingControls';
import AdvancedSettings from './AdvancedSettings';
import ProgressDisplay from './ProgressDisplay';
import Instructions from './Instructions';
import { useTypingSimulator } from '../hooks/useTypingSimulator';
import type { TypingConfig } from '../types';

interface BasicTypingProps {
  config: TypingConfig;
  updateConfig: (updates: Partial<TypingConfig>) => void;
}

const BasicTyping: React.FC<BasicTypingProps> = ({
  config,
  updateConfig,
}) => {
  const [text, setText] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    typingState,
    handleStartTyping,
    handlePauseResume,
    handleStop,
  } = useTypingSimulator(text, config);

  const getButtonState = () => {
    if (!typingState.isTyping) return 'start';
    if (typingState.isPaused) return 'resume';
    return 'pause';
  };

  return (
    <div className="space-y-6">
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
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full py-2 px-4 text-sm font-medium text-gray-700 bg-white 
                   border border-gray-200 rounded-lg hover:bg-gray-50 
                   transition-all duration-200 flex items-center justify-center space-x-2"
        >
          <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Settings</span>
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${
              showAdvanced ? 'rotate-180' : ''
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
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            showAdvanced ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
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
    </div>
  );
};

export default BasicTyping;