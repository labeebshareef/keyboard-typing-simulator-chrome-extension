import { useState } from 'react';
import type React from 'react';
import type { TypingConfig, TypingSessionStatus } from '../types';
import ProgressDisplay from './ProgressDisplay';
import TypingArea from './TypingArea';
import TypingControls from './TypingControls';

interface BasicTypingProps {
  config: TypingConfig;
  session: {
    status: TypingSessionStatus;
    isActive: boolean;
    startBasic: (text: string, config: TypingConfig) => Promise<boolean>;
    pause: () => Promise<void>;
    resume: () => Promise<void>;
    stop: () => Promise<void>;
  };
}

const BasicTyping: React.FC<BasicTypingProps> = ({ config, session }) => {
  const [text, setText] = useState('');

  const getButtonState = () => {
    if (!session.isActive) return 'start';
    if (session.status.phase === 'paused') return 'resume';
    return 'pause';
  };

  const handleMainAction = () => {
    if (!session.isActive) return session.startBasic(text, config);
    return session.status.phase === 'paused' ? session.resume() : session.pause();
  };

  return (
    <div className="p-4 space-y-4">
      {/* Typing Area */}
      <TypingArea text={text} setText={setText} disabled={session.isActive} />

      {/* Typing Controls */}
      <TypingControls
        buttonState={getButtonState()}
        onStart={handleMainAction}
        onPauseResume={handleMainAction}
        onStop={session.stop}
        disabled={!session.isActive && !text.trim()}
        isTyping={session.isActive}
      />

      {/* Progress Display */}
      {session.isActive && <ProgressDisplay progress={session.status.progress} />}
    </div>
  );
};

export default BasicTyping;
