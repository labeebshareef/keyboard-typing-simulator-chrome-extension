import type React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

interface TypingAreaProps {
  text: string;
  setText: (text: string) => void;
  disabled: boolean;
}

const TypingArea: React.FC<TypingAreaProps> = ({ text, setText, disabled }) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Text to Type</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter the text you want to simulate typing..."
          className="h-20 resize-none"
          disabled={disabled}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{text.length} characters</span>
          <span>{text.split(' ').filter((word) => word.length > 0).length} words</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default TypingArea;
