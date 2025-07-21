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
        
        <CardContent className="space-y-4 px-4 pb-4">
          {/* Typing Speed */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center space-x-2 text-sm">
                <Clock className="w-3 h-3 text-primary" />
                <span>Typing Speed</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant={getDelayColor(typingConfig.delay)} className="text-xs">
                  {getDelayLabel(typingConfig.delay)}
                </Badge>
                <span className="text-xs text-muted-foreground">{typingConfig.delay}ms</span>
              </div>

              <div className="space-y-2">
                <Slider
                  value={[typingConfig.delay]}
                  onValueChange={([value]) => updateTypingConfig({ delay: value })}
                  max={300}
                  min={1}
                  step={1}
                  disabled={disabled}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Fast</span>
                  <span>Slow</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Settings (only for Advanced Typing) */}
          {showAdvancedSettings && advancedConfig && updateAdvancedConfig && (
            <>
              <Separator />
              
              {/* Initial Delay */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center space-x-2 text-sm">
                    <Clock className="w-3 h-3 text-primary" />
                    <span>Initial Delay</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {advancedConfig.initialDelay === 0
                        ? 'No delay'
                        : `${advancedConfig.initialDelay}s`}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Slider
                      value={[advancedConfig.initialDelay]}
                      onValueChange={([value]) => updateAdvancedConfig({ initialDelay: value })}
                      max={10}
                      min={0}
                      step={0.5}
                      disabled={disabled}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0s</span>
                      <span>10s</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Inter-field Delay */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center space-x-2 text-sm">
                    <Timer className="w-3 h-3 text-primary" />
                    <span>Inter-field Delay</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {advancedConfig.interFieldDelay === 0
                        ? 'No delay'
                        : `${advancedConfig.interFieldDelay}s`}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Slider
                      value={[advancedConfig.interFieldDelay]}
                      onValueChange={([value]) => updateAdvancedConfig({ interFieldDelay: value })}
                      max={5}
                      min={0}
                      step={0.5}
                      disabled={disabled}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0s</span>
                      <span>5s</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Hide Extension */}
              <Card>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center space-x-2">
                    <EyeOff className="w-4 h-4 text-primary" />
                    <div>
                      <Label className="text-sm font-medium">Hide Extension</Label>
                      <p className="text-xs text-muted-foreground">Close during typing</p>
                    </div>
                  </div>
                  <Switch
                    checked={advancedConfig.hideExtension}
                    onCheckedChange={(checked) => updateAdvancedConfig({ hideExtension: checked })}
                    disabled={disabled}
                  />
                </CardContent>
              </Card>
            </>
          )}

          <Separator />

          {/* Typing Sounds */}
          <Card>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center space-x-2">
                <div className="text-primary">
                  {typingConfig.soundEnabled ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <VolumeX className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium">Typing Sounds</Label>
                  <p className="text-xs text-muted-foreground">Audio feedback</p>
                </div>
              </div>
              <Switch
                checked={typingConfig.soundEnabled}
                onCheckedChange={(checked) => updateTypingConfig({ soundEnabled: checked })}
                disabled={disabled}
              />
            </CardContent>
          </Card>

          {/* Typing Style */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center space-x-2 text-sm">
                <Zap className="w-3 h-3 text-primary" />
                <span>Typing Style</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
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
              <p className="text-xs text-muted-foreground">
                {getTypingStyleDescription(typingConfig.typingStyle)}
              </p>
            </CardContent>
          </Card>

          {/* Include Mistakes */}
          <Card>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4 text-primary" />
                <div>
                  <Label className="text-sm font-medium">Include Mistakes</Label>
                  <p className="text-xs text-muted-foreground">Typos & corrections</p>
                </div>
              </div>
              <Switch
                checked={typingConfig.includeMistakes}
                onCheckedChange={(checked) => updateTypingConfig({ includeMistakes: checked })}
                disabled={disabled}
              />
            </CardContent>
          </Card>
        </CardContent>
      </ScrollArea>
    </Card>
  );
};

export default SettingsSidebar;
