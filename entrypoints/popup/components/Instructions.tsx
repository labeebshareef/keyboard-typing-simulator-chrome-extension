import { Settings } from 'lucide-react';
import type React from 'react';

const Instructions: React.FC = () => {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
      <div className="flex items-center space-x-2">
        <Settings className="w-3 h-3 text-amber-600" />
        <span className="text-xs font-semibold text-amber-800">Quick Start</span>
      </div>
      <ol className="text-xs text-amber-700 space-y-0.5 ml-5 list-decimal">
        <li>Click on any text field on the webpage</li>
        <li>Configure typing settings in the sidebar</li>
        <li>Click "Start Typing" to begin simulation</li>
      </ol>
    </div>
  );
};

export default Instructions;
