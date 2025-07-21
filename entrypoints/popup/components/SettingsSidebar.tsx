import { Clock, EyeOff, Settings, Timer, Volume2, VolumeX, Zap } from 'lucide-react';
import type React from 'react';
import type { AdvancedTypingConfig, TypingConfig, TypingStyle } from '../types';
import { Label } from './ui/label';
import { Select } from './ui/select';
import { Switch } from './ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

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
    if (delayValue <= 20) return 'destructive';
    if (delayValue <= 50) return 'secondary';
    if (delayValue <= 100) return 'default';
    if (delayValue <= 200) return 'outline';
    return 'outline';
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
    <Card className="w-56 rounded-none border-0 border-l">
      <ScrollArea className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-base">
            <Settings className="w-4 h-4 text-primary" />
            <span>Settings</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-2 px-4 pb-4">
          {/* Typing Speed */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-3 h-3 text-primary" />
                <span className="text-sm font-medium">Speed</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={getDelayColor(typingConfig.delay)} className="text-xs">
                  {getDelayLabel(typingConfig.delay)}
                </Badge>
                <span className="text-xs text-muted-foreground">{typingConfig.delay}ms</span>
              </div>
            </div>
            <Slider
              value={[typingConfig.delay]}
              onValueChange={([value]) => updateTypingConfig({ delay: value })}
              max={300}
              min={1}
              step={1}
              disabled={disabled}
            />
          </div>

          <Separator />

          {/* Advanced Settings (only for Advanced Typing) */}
          {showAdvancedSettings && advancedConfig && updateAdvancedConfig && (
            <>
              {/* Initial Delay */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3 h-3 text-primary" />
                    <span className="text-sm font-medium">Initial Delay</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {advancedConfig.initialDelay === 0
                      ? 'No delay'
                      : `${advancedConfig.initialDelay}s`}
                  </span>
                </div>
                <Slider
                  value={[advancedConfig.initialDelay]}
                  onValueChange={([value]) => updateAdvancedConfig({ initialDelay: value })}
                  max={10}
                  min={0}
                  step={0.5}
                  disabled={disabled}
                />
              </div>

              {/* Inter-field Delay */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Timer className="w-3 h-3 text-primary" />
                    <span className="text-sm font-medium">Field Delay</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {advancedConfig.interFieldDelay === 0
                      ? 'No delay'
                      : `${advancedConfig.interFieldDelay}s`}
                  </span>
                </div>
                <Slider
                  value={[advancedConfig.interFieldDelay]}
                  onValueChange={([value]) => updateAdvancedConfig({ interFieldDelay: value })}
                  max={5}
                  min={0}
                  step={0.5}
                  disabled={disabled}
                />
              </div>

              <Separator />
            </>
          )}

          {/* Typing Sounds */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center space-x-2">
              <div className="text-primary">
                {typingConfig.soundEnabled ? (
                  <Volume2 className="w-3 h-3" />
                ) : (
                  <VolumeX className="w-3 h-3" />
                )}
              </div>
              <span className="text-sm font-medium">Sounds</span>
            </div>
            <Switch
              checked={typingConfig.soundEnabled}
              onCheckedChange={(checked) => updateTypingConfig({ soundEnabled: checked })}
              disabled={disabled}
            />
          </div>

          {/* Typing Style */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Zap className="w-3 h-3 text-primary" />
              <span className="text-sm font-medium">Style</span>
            </div>
            <Select
              value={typingConfig.typingStyle}
              onChange={(e) => updateTypingConfig({ typingStyle: e.target.value as TypingStyle })}
              className="h-7 text-xs"
              disabled={disabled}
            >
              <option value="normal">Normal</option>
              <option value="random">Random</option>
              <option value="word-by-word">Word-by-Word</option>
            </Select>
          </div>

          {/* Include Mistakes */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center space-x-2">
              <Settings className="w-3 h-3 text-primary" />
              <span className="text-sm font-medium">Mistakes</span>
            </div>
            <Switch
              checked={typingConfig.includeMistakes}
              onCheckedChange={(checked) => updateTypingConfig({ includeMistakes: checked })}
              disabled={disabled}
            />
          </div>

          {/* Hide Extension (Advanced only) */}
          {showAdvancedSettings && advancedConfig && updateAdvancedConfig && (
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center space-x-2">
                <EyeOff className="w-3 h-3 text-primary" />
                <span className="text-sm font-medium">Hide Extension</span>
              </div>
              <Switch
                checked={advancedConfig.hideExtension}
                onCheckedChange={(checked) => updateAdvancedConfig({ hideExtension: checked })}
                disabled={disabled}
              />
            </div>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
};

export default SettingsSidebar;
