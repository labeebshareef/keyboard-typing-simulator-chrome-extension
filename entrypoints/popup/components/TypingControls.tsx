import { Pause, Play, Square } from 'lucide-react';
import type React from 'react';
import type { TypingConfig } from '../types';

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
      <button
        onClick={handleMainAction}
        disabled={disabled}
        className="flex-1 py-2.5 px-4 bg-primary-500 hover:bg-primary-600 
                 disabled:bg-gray-300 disabled:cursor-not-allowed
                 text-white font-semibold rounded-lg transition-all duration-200
                 transform hover:scale-[1.02] active:scale-[0.98]
                 shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
      >
        {buttonState === 'start' && (
          <>
            <Play className="w-4 h-4" />
            <span>Start Typing</span>
          </>
        )}
        {buttonState === 'pause' && (
          <>
            <Pause className="w-4 h-4" />
            <span>Pause</span>
          </>
        )}
        {buttonState === 'resume' && (
          <>
            <Play className="w-4 h-4" />
            <span>Resume</span>
          </>
        )}
      </button>

      {isTyping && (
        <button
          onClick={onStop}
          className="py-2.5 px-4 bg-red-500 hover:bg-red-600 
                   text-white font-semibold rounded-lg transition-all duration-200
                   transform hover:scale-[1.02] active:scale-[0.98]
                   shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
        >
          <Square className="w-4 h-4" />
          <span>Stop</span>
        </button>
      )}
    </div>
  );
};

export default TypingControls;
