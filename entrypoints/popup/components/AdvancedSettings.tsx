import { Settings, Volume2, VolumeX, Zap } from 'lucide-react';
import type React from 'react';
import type { TypingConfig, TypingStyle } from '../types';

interface AdvancedSettingsProps {
  config: TypingConfig;
  updateConfig: (updates: Partial<TypingConfig>) => void;
  disabled: boolean;
}

const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({ config, updateConfig, disabled }) => {
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
    <div className="space-y-4 pt-2">
      {/* Sound Toggle */}
      <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="text-gray-600">
            {config.soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Typing Sounds</label>
            <p className="text-xs text-gray-500">Enable keystroke audio feedback</p>
          </div>
        </div>

        <button
          onClick={() => updateConfig({ soundEnabled: !config.soundEnabled })}
          disabled={disabled}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                     ${config.soundEnabled ? 'bg-primary-500' : 'bg-gray-200'}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                       ${config.soundEnabled ? 'translate-x-6' : 'translate-x-1'}`}
          />
        </button>
      </div>

      {/* Typing Style Selector */}
      <div className="space-y-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-gray-600" />
          <label className="text-sm font-semibold text-gray-700">Typing Style</label>
        </div>

        <select
          value={config.typingStyle}
          onChange={(e) => updateConfig({ typingStyle: e.target.value as TypingStyle })}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 
                   focus:ring-primary-500 focus:border-transparent transition-all duration-200
                   bg-white text-sm"
          disabled={disabled}
        >
          <option value="normal">Normal</option>
          <option value="random">Random Delay</option>
          <option value="word-by-word">Word-by-Word</option>
        </select>

        <p className="text-xs text-gray-500">{getTypingStyleDescription(config.typingStyle)}</p>
      </div>

      {/* Mistakes Toggle */}
      <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="text-gray-600">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Include Mistakes</label>
            <p className="text-xs text-gray-500">Simulate typos and corrections</p>
          </div>
        </div>

        <button
          onClick={() => updateConfig({ includeMistakes: !config.includeMistakes })}
          disabled={disabled}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                     ${config.includeMistakes ? 'bg-primary-500' : 'bg-gray-200'}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                       ${config.includeMistakes ? 'translate-x-6' : 'translate-x-1'}`}
          />
        </button>
      </div>
    </div>
  );
};

export default AdvancedSettings;
