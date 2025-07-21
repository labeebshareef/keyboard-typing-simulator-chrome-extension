import { Pause, Play, Square } from 'lucide-react';
import type React from 'react';
import type { TypingConfig } from '../types';
import { Button } from './ui/button';

interface TypingControlsProps {
  config: TypingConfig;
  updateConfig: (updates: Partial<TypingConfig>) => void;
  buttonState: 'start' | 'pause' | 'resume';
  onStart: () => void;
  onPauseResume: () => void;
  onStop: () => void;
  disabled: boolean;
  isTyping: boolean;
}

const TypingControls: React.FC<TypingControlsProps> = ({
  buttonState,
  onStart,
  onPauseResume,
  onStop,
  disabled,
  isTyping,
}) => {
  const handleMainAction = () => {
    if (buttonState === 'start') {
      onStart();
    } else {
      onPauseResume();
    }
  };

  return (
    <div className="flex space-x-3">
      <Button
        onClick={handleMainAction}
        disabled={disabled}
        className="flex-1"
        size="default"
      >
        {buttonState === 'start' && (
          <>
            <Play className="w-4 h-4 mr-2" />
            Start Typing
          </>
        )}
        {buttonState === 'pause' && (
          <>
            <Pause className="w-4 h-4 mr-2" />
            Pause
          </>
        )}
        {buttonState === 'resume' && (
          <>
            <Play className="w-4 h-4 mr-2" />
            Resume
          </>
        )}
      </Button>

      {isTyping && (
        <Button
          onClick={onStop}
          variant="destructive"
          size="default"
        >
          <Square className="w-4 h-4 mr-2" />
          Stop
        </Button>
      )}
    </div>
  );
};

export default TypingControls;
