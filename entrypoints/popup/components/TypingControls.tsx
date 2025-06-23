import React from 'react';
import { Play, Pause, Square, Clock } from 'lucide-react';
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
  config,
  updateConfig,
  buttonState,
  onStart,
  onPauseResume,
  onStop,
  disabled,
  isTyping,
}) => {
  const getDelayLabel = (delayValue: number): string => {
    if (delayValue <= 20) return 'Lightning Fast';
    if (delayValue <= 50) return 'Fast';
    if (delayValue <= 100) return 'Normal';
    if (delayValue <= 200) return 'Slow';
    return 'Very Slow';
  };

  const getDelayColor = (delayValue: number): string => {
    if (delayValue <= 20) return 'text-red-500';
    if (delayValue <= 50) return 'text-orange-500';
    if (delayValue <= 100) return 'text-green-500';
    if (delayValue <= 200) return 'text-blue-500';
    return 'text-purple-500';
  };

  const handleMainAction = () => {
    if (buttonState === 'start') {
      onStart();
    } else {
      onPauseResume();
    }
  };
  const isControlDisabled = disabled || (isTyping && buttonState !== 'pause' && buttonState !== 'resume');
  return (
    <div className="space-y-4">
      {/* Speed Control */}
      <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-2 mb-3">
          <Clock className="w-4 h-4 text-gray-600" />
          <label className="text-sm font-semibold text-gray-700">Typing Speed</label>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${getDelayColor(config.delay)}`}>
              {getDelayLabel(config.delay)}
            </span>
            <span className="text-xs text-gray-500">{config.delay}ms delay</span>
          </div>

          <div className="relative">
            <input
              type="range"
              min="1"
              max="300"
              step="1"
              value={config.delay}
              onChange={(e) => updateConfig({ delay: Number(e.target.value) })}
              disabled={isControlDisabled}
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer
             ${isControlDisabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-200'}
             slider-thumb:appearance-none slider-thumb:w-4 slider-thumb:h-4
             slider-thumb:rounded-full slider-thumb:cursor-pointer slider-thumb:shadow-lg
             ${isControlDisabled ? 'slider-thumb:bg-gray-400' : 'slider-thumb:bg-primary-500'}`}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Fastest</span>
              <span>Slowest</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={handleMainAction}
          disabled={disabled}
          className="flex-1 py-3 px-4 bg-primary-500 hover:bg-primary-600 
                   disabled:bg-gray-300 disabled:cursor-not-allowed
                   text-white font-semibold rounded-xl transition-all duration-200
                   transform hover:scale-[1.02] active:scale-[0.98]
                   shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
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
            className="py-3 px-4 bg-red-500 hover:bg-red-600 
                     text-white font-semibold rounded-xl transition-all duration-200
                     transform hover:scale-[1.02] active:scale-[0.98]
                     shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
          >
            <Square className="w-4 h-4" />
            <span>Stop</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default TypingControls;