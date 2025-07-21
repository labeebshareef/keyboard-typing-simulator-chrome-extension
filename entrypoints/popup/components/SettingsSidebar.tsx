import { Clock, EyeOff, Settings, Timer, Volume2, VolumeX, Zap } from 'lucide-react';
import type React from 'react';
import type { AdvancedTypingConfig, TypingConfig, TypingStyle } from '../types';

interface SettingsSidebarProps {
  typingConfig: TypingConfig;
  updateTypingConfig: (updates: Partial<TypingConfig>) => void;
  advancedConfig?: AdvancedTypingConfig;
  updateAdvancedConfig?: (updates: Partial<AdvancedTypingConfig>) => void;
  disabled: boolean;
  showAdvancedSettings?: boolean;
}

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  typingConfig,
  updateTypingConfig,
  advancedConfig,
  updateAdvancedConfig,
  disabled,
  showAdvancedSettings = false,
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

  const getTypingStyleDescription = (style: TypingStyle): string => {
    switch (style) {
      case 'normal':
        return 'Consistent timing';
      case 'random':
        return 'Variable human-like timing';
      case 'word-by-word':
        return 'Types complete words';
      default:
        return '';
    }
  };

  return (
    <div className="w-64 bg-gray-50 border-l border-gray-200 p-4 space-y-3 overflow-y-auto">
      <div className="flex items-center space-x-2 mb-4">
        <Settings className="w-4 h-4 text-gray-600" />
        <h3 className="text-sm font-semibold text-gray-700">Settings</h3>
      </div>

      {/* Typing Speed */}
      <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-2 mb-2">
          <Clock className="w-3 h-3 text-gray-600" />
          <label className="text-xs font-semibold text-gray-700">Typing Speed</label>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${getDelayColor(typingConfig.delay)}`}>
              {getDelayLabel(typingConfig.delay)}
            </span>
            <span className="text-xs text-gray-500">{typingConfig.delay}ms</span>
          </div>

          <input
            type="range"
            min="1"
            max="300"
            value={typingConfig.delay}
            onChange={(e) => updateTypingConfig({ delay: Number(e.target.value) })}
            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer
                     slider-thumb:appearance-none slider-thumb:w-3 slider-thumb:h-3
                     slider-thumb:rounded-full slider-thumb:bg-primary-500
                     slider-thumb:cursor-pointer"
            disabled={disabled}
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>Fast</span>
            <span>Slow</span>
          </div>
        </div>
      </div>

      {/* Typing Sounds */}
      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="text-gray-600">
            {typingConfig.soundEnabled ? (
              <Volume2 className="w-3 h-3" />
            ) : (
              <VolumeX className="w-3 h-3" />
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700">Typing Sounds</label>
            <p className="text-xs text-gray-500">Audio feedback</p>
          </div>
        </div>

        <button
          onClick={() => updateTypingConfig({ soundEnabled: !typingConfig.soundEnabled })}
          disabled={disabled}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors
                     focus:outline-none focus:ring-1 focus:ring-primary-500 focus:ring-offset-1
                     ${typingConfig.soundEnabled ? 'bg-primary-500' : 'bg-gray-200'}`}
        >
          <span
            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform
                       ${typingConfig.soundEnabled ? 'translate-x-5' : 'translate-x-1'}`}
          />
        </button>
      </div>

      {/* Typing Style */}
      <div className="space-y-2 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-2">
          <Zap className="w-3 h-3 text-gray-600" />
          <label className="text-xs font-semibold text-gray-700">Typing Style</label>
        </div>

        <select
          value={typingConfig.typingStyle}
          onChange={(e) => updateTypingConfig({ typingStyle: e.target.value as TypingStyle })}
          className="w-full px-2 py-1.5 border border-gray-200 rounded-md focus:ring-1 
                   focus:ring-primary-500 focus:border-transparent transition-all duration-200
                   bg-white text-xs"
          disabled={disabled}
        >
          <option value="normal">Normal</option>
          <option value="random">Random Delay</option>
          <option value="word-by-word">Word-by-Word</option>
        </select>

        <p className="text-xs text-gray-500">{getTypingStyleDescription(typingConfig.typingStyle)}</p>
      </div>

      {/* Include Mistakes */}
      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="text-gray-600">
            <Settings className="w-3 h-3" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700">Include Mistakes</label>
            <p className="text-xs text-gray-500">Typos & corrections</p>
          </div>
        </div>

        <button
          onClick={() => updateTypingConfig({ includeMistakes: !typingConfig.includeMistakes })}
          disabled={disabled}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors
                     focus:outline-none focus:ring-1 focus:ring-primary-500 focus:ring-offset-1
                     ${typingConfig.includeMistakes ? 'bg-primary-500' : 'bg-gray-200'}`}
        >
          <span
            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform
                       ${typingConfig.includeMistakes ? 'translate-x-5' : 'translate-x-1'}`}
          />
        </button>
      </div>

      {/* Advanced Settings (only for Advanced Typing) */}
      {showAdvancedSettings && advancedConfig && updateAdvancedConfig && (
        <>
          {/* Separator */}
          <div className="border-t border-gray-300 my-4"></div>
          
          {/* Initial Delay */}
          <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-3 h-3 text-gray-600" />
              <label className="text-xs font-semibold text-gray-700">Initial Delay</label>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">
                  {advancedConfig.initialDelay === 0
                    ? 'No delay'
                    : `${advancedConfig.initialDelay}s`}
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={advancedConfig.initialDelay}
                onChange={(e) => updateAdvancedConfig({ initialDelay: Number(e.target.value) })}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer
                         slider-thumb:appearance-none slider-thumb:w-3 slider-thumb:h-3
                         slider-thumb:rounded-full slider-thumb:bg-primary-500
                         slider-thumb:cursor-pointer"
                disabled={disabled}
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>0s</span>
                <span>10s</span>
              </div>
            </div>
          </div>

          {/* Inter-field Delay */}
          <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <Timer className="w-3 h-3 text-gray-600" />
              <label className="text-xs font-semibold text-gray-700">Inter-field Delay</label>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">
                  {advancedConfig.interFieldDelay === 0
                    ? 'No delay'
                    : `${advancedConfig.interFieldDelay}s`}
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={advancedConfig.interFieldDelay}
                onChange={(e) => updateAdvancedConfig({ interFieldDelay: Number(e.target.value) })}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer
                         slider-thumb:appearance-none slider-thumb:w-3 slider-thumb:h-3
                         slider-thumb:rounded-full slider-thumb:bg-primary-500
                         slider-thumb:cursor-pointer"
                disabled={disabled}
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>0s</span>
                <span>5s</span>
              </div>
            </div>
          </div>

          {/* Hide Extension */}
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-2">
              <EyeOff className="w-3 h-3 text-gray-600" />
              <div>
                <label className="text-xs font-semibold text-gray-700">Hide Extension</label>
                <p className="text-xs text-gray-500">Close during typing</p>
              </div>
            </div>

            <button
              onClick={() => updateAdvancedConfig({ hideExtension: !advancedConfig.hideExtension })}
              disabled={disabled}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors
                         focus:outline-none focus:ring-1 focus:ring-primary-500 focus:ring-offset-1
                         ${advancedConfig.hideExtension ? 'bg-primary-500' : 'bg-gray-200'}`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform
                           ${advancedConfig.hideExtension ? 'translate-x-5' : 'translate-x-1'}`}
              />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default SettingsSidebar;