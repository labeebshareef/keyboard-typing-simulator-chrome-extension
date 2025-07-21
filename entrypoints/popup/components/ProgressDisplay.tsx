import type React from 'react';

interface ProgressDisplayProps {
  progress: number;
}

const ProgressDisplay: React.FC<ProgressDisplayProps> = ({ progress }) => {
  return (
    <div className="space-y-1 animate-slide-up">
      <div className="flex justify-between text-xs text-gray-600">
        <span>Progress</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className="bg-primary-500 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressDisplay;
