import React from 'react';
import { Settings } from 'lucide-react';

const Instructions: React.FC = () => {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
      <div className="flex items-center space-x-2">
        <Settings className="w-4 h-4 text-amber-600" />
        <span className="text-sm font-semibold text-amber-800">Instructions</span>
      </div>
      <ol className="text-xs text-amber-700 space-y-1 ml-6 list-decimal">
        <li>Click on any text input field on the webpage</li>
        <li>Configure your typing preferences above</li>
        <li>Click "Start Typing" to begin simulation</li>
        <li>Use "Pause/Resume" to control typing mid-process</li>
        <li>Click "Stop" to end typing session early</li>
      </ol>
    </div>
  );
};

export default Instructions;