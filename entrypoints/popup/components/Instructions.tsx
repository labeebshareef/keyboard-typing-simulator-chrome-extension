import { Settings } from 'lucide-react';
import type React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const Instructions: React.FC = () => {
  return (
    <Card className="border-accent/20 bg-accent/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center space-x-2 text-sm">
          <Settings className="w-4 h-4 text-accent-foreground" />
          <span>Quick Start</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Click on any text field on the webpage</li>
          <li>Configure typing settings in the sidebar</li>
          <li>Click "Start Typing" to begin simulation</li>
        </ol>
      </CardContent>
    </Card>
  );
};

export default Instructions;
