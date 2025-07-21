import { useState } from 'react';
import type React from 'react';
import { useTypingSimulator } from '../hooks/useTypingSimulator';
import type { TypingConfig } from '../types';
import Instructions from './Instructions';
import ProgressDisplay from './ProgressDisplay';
import TypingArea from './TypingArea';
import TypingControls from './TypingControls';

interface BasicTypingProps {
  config: TypingConfig;
  updateConfig: (updates: Partial<TypingConfig>) => void;
}

const BasicTyping: React.FC<BasicTypingProps> = ({ config, updateConfig }) => {
  const [text, setText] = useState('');

  const { typingState, handleStartTyping, handlePauseResume, handleStop } = useTypingSimulator(
    text,
    config
  );

  const getButtonState = () => {
    if (!typingState.isTyping) return 'start';
    if (typingState.isPaused) return 'resume';
    return 'pause';
  };

  return (
    <div className="p-4 space-y-4">
      {/* Typing Area */}
      <TypingArea text={text} setText={setText} disabled={typingState.isTyping} />

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
      {typingState.isTyping && <ProgressDisplay progress={typingState.progress} />}

      {/* Instructions */}
      <Instructions />
    </div>
  );
};

export default BasicTyping;
