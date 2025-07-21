import type React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface ProgressDisplayProps {
  progress: number;
}

const ProgressDisplay: React.FC<ProgressDisplayProps> = ({ progress }) => {
  return (
    <Card className="animate-in slide-in-from-top-2">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>Progress</span>
          <Badge variant="outline">{Math.round(progress)}%</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressDisplay;
