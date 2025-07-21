import { Clock, EyeOff, Settings, Timer, Volume2, VolumeX, Zap } from 'lucide-react';
import type React from 'react';
import type { AdvancedTypingConfig, TypingConfig, TypingStyle } from '../types';
import { Label } from './ui/label';
import { Select } from './ui/select';
import { Switch } from './ui/switch';

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
    if (delayValue <= 100) return 'text-emerald-600';
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
    <div className="w-56 bg-emerald-50 border-l border-emerald-200 p-3 space-y-2 overflow-y-auto">
      <div className="flex items-center space-x-2 mb-3">
        <Settings className="w-4 h-4 text-emerald-600" />
        <h3 className="text-sm font-semibold text-emerald-700">Settings</h3>
      </div>

      {/* Typing Speed */}
      <div className="p-2 bg-white rounded border border-emerald-200 shadow-sm">
        <div className="flex items-center space-x-2 mb-2">
          <Clock className="w-3 h-3 text-emerald-600" />
          <Label className="text-xs font-semibold text-emerald-700">Typing Speed</Label>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${getDelayColor(typingConfig.delay)}`}>
              {getDelayLabel(typingConfig.delay)}
            </span>
            <span className="text-xs text-emerald-500">{typingConfig.delay}ms</span>
          </div>

          <input
            type="range"
            min="1"
            max="300"
            value={typingConfig.delay}
            onChange={(e) => updateTypingConfig({ delay: Number(e.target.value) })}
            className="w-full h-1.5 bg-emerald-200 rounded-lg appearance-none cursor-pointer
                     slider-thumb:appearance-none slider-thumb:w-3 slider-thumb:h-3
                     slider-thumb:rounded-full slider-thumb:bg-emerald-500
                     slider-thumb:cursor-pointer"
            disabled={disabled}
          />
          <div className="flex justify-between text-xs text-emerald-400">
            <span>Fast</span>
            <span>Slow</span>
          </div>
        </div>
      </div>

      {/* Advanced Settings (only for Advanced Typing) */}
      {showAdvancedSettings && advancedConfig && updateAdvancedConfig && (
        <>
          {/* Initial Delay */}
          <div className="p-2 bg-white rounded border border-emerald-200 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-3 h-3 text-emerald-600" />
              <Label className="text-xs font-semibold text-emerald-700">Initial Delay</Label>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-600">
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
                className="w-full h-1.5 bg-emerald-200 rounded-lg appearance-none cursor-pointer
                         slider-thumb:appearance-none slider-thumb:w-3 slider-thumb:h-3
                         slider-thumb:rounded-full slider-thumb:bg-emerald-500
                         slider-thumb:cursor-pointer"
                disabled={disabled}
              />
              <div className="flex justify-between text-xs text-emerald-400">
                <span>0s</span>
                <span>10s</span>
              </div>
            </div>
          </div>

          {/* Inter-field Delay */}
          <div className="p-2 bg-white rounded border border-emerald-200 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <Timer className="w-3 h-3 text-emerald-600" />
              <Label className="text-xs font-semibold text-emerald-700">Inter-field Delay</Label>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-600">
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
                className="w-full h-1.5 bg-emerald-200 rounded-lg appearance-none cursor-pointer
                         slider-thumb:appearance-none slider-thumb:w-3 slider-thumb:h-3
                         slider-thumb:rounded-full slider-thumb:bg-emerald-500
                         slider-thumb:cursor-pointer"
                disabled={disabled}
              />
              <div className="flex justify-between text-xs text-emerald-400">
                <span>0s</span>
                <span>5s</span>
              </div>
            </div>
          </div>

          {/* Hide Extension */}
          <div className="flex items-center justify-between p-2 bg-white rounded border border-emerald-200 shadow-sm">
            <div className="flex items-center space-x-2">
              <EyeOff className="w-3 h-3 text-emerald-600" />
              <div>
                <Label className="text-xs font-semibold text-emerald-700">Hide Extension</Label>
                <p className="text-xs text-emerald-500">Close during typing</p>
              </div>
            </div>

            <Switch
              checked={advancedConfig.hideExtension}
              onCheckedChange={(checked) => updateAdvancedConfig({ hideExtension: checked })}
              disabled={disabled}
            />
          </div>
        </>
      )}

      {/* Typing Sounds */}
      <div className="flex items-center justify-between p-2 bg-white rounded border border-emerald-200 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="text-emerald-600">
            {typingConfig.soundEnabled ? (
              <Volume2 className="w-3 h-3" />
            ) : (
              <VolumeX className="w-3 h-3" />
            )}
          </div>
          <div>
            <Label className="text-xs font-semibold text-emerald-700">Typing Sounds</Label>
            <p className="text-xs text-emerald-500">Audio feedback</p>
          </div>
        </div>

        <Switch
          checked={typingConfig.soundEnabled}
          onCheckedChange={(checked) => updateTypingConfig({ soundEnabled: checked })}
          disabled={disabled}
        />
      </div>

      {/* Typing Style */}
      <div className="space-y-1 p-2 bg-white rounded border border-emerald-200 shadow-sm">
        <div className="flex items-center space-x-2">
          <Zap className="w-3 h-3 text-emerald-600" />
          <Label className="text-xs font-semibold text-emerald-700">Typing Style</Label>
        </div>

        <Select
          value={typingConfig.typingStyle}
          onChange={(e) => updateTypingConfig({ typingStyle: e.target.value as TypingStyle })}
          className="h-8 text-xs"
          disabled={disabled}
        >
          <option value="normal">Normal</option>
          <option value="random">Random Delay</option>
          <option value="word-by-word">Word-by-Word</option>
        </Select>

        <p className="text-xs text-emerald-500">
          {getTypingStyleDescription(typingConfig.typingStyle)}
        </p>
      </div>

      {/* Include Mistakes */}
      <div className="flex items-center justify-between p-2 bg-white rounded border border-emerald-200 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="text-emerald-600">
            <Settings className="w-3 h-3" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-emerald-700">Include Mistakes</Label>
            <p className="text-xs text-emerald-500">Typos & corrections</p>
          </div>
        </div>

        <Switch
          checked={typingConfig.includeMistakes}
          onCheckedChange={(checked) => updateTypingConfig({ includeMistakes: checked })}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default SettingsSidebar;
