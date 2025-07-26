import { Clock, Copy, QrCode, Wifi, WifiOff } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { SessionService } from '../services/sessionService';
import type { AdvancedTypingConfig, RemoteSession, TypingConfig } from '../types';

interface RemoteTypingProps {
  config: AdvancedTypingConfig;
  typingConfig: TypingConfig;
  updateConfig: (updates: Partial<AdvancedTypingConfig>) => void;
  updateTypingConfig: (updates: Partial<TypingConfig>) => void;
  disabled: boolean;
}

const RemoteTyping: React.FC<RemoteTypingProps> = ({
  config,
  typingConfig,
  updateConfig,
  updateTypingConfig,
  disabled,
}) => {
  const [sessionService] = useState(() => new SessionService());
  const [session, setSession] = useState<RemoteSession | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Session timer
  useEffect(() => {
    if (!session?.isActive) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, session.expiresAt - Date.now());
      setTimeRemaining(remaining);

      if (remaining === 0) {
        handleEndSession();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session]);

  const handleStartSession = async () => {
    setIsCreatingSession(true);
    try {
      const { sessionCode, qrCodeUrl } = await sessionService.createSession();

      setSession({
        sessionCode,
        isActive: true,
        lastSeen: Date.now(),
        qrCodeUrl,
        expiresAt: Date.now() + 5 * 60 * 1000,
      });
    } catch (error) {
      console.error('Failed to create session:', error);
      alert('Failed to start remote session. Please try again.');
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleEndSession = async () => {
    if (session) {
      await sessionService.endSession();
      setSession(null);
      setTimeRemaining(0);
    }
  };

  const copySessionCode = useCallback(() => {
    if (session?.sessionCode) {
      navigator.clipboard
        .writeText(session.sessionCode)
        .then(() => {
          setCopyFeedback(true);
          setTimeout(() => setCopyFeedback(false), 2000);
        })
        .catch(() => {
          // Fallback for browsers without clipboard API
          alert(`Session Code: ${session.sessionCode}`);
        });
    }
  }, [session?.sessionCode]);

  const formatTimeRemaining = () => {
    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    if (!session?.isActive) return 'bg-gray-400';
    return timeRemaining > 60000 ? 'bg-green-400' : 'bg-yellow-400';
  };

  const getStatusText = () => {
    if (!session?.isActive) return 'Not Connected';
    return timeRemaining > 60000 ? 'Connected' : 'Expiring Soon';
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Remote Typing Control</h2>
        <p className="text-sm text-gray-600">
          Control typing from your mobile device or another browser
        </p>
      </div>

      {/* Session Display */}
      {session?.isActive ? (
        <div className="space-y-4">
          {/* Session Code */}
          <div className="text-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Session Code</h3>
            <div className="text-3xl font-mono font-bold text-blue-900 tracking-wider">
              {session.sessionCode}
            </div>
            <button
              type="button"
              onClick={copySessionCode}
              className="mt-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 
                       hover:bg-blue-100 rounded transition-colors flex items-center 
                       justify-center space-x-1 mx-auto"
            >
              <Copy className="w-3 h-3" />
              <span>{copyFeedback ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>

          {/* QR Code */}
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <QrCode className="w-4 h-4 text-gray-600" />
              <h4 className="text-sm font-medium text-gray-700">Scan with Mobile Device</h4>
            </div>
            <div className="inline-block p-2 bg-white rounded-lg shadow-sm">
              <img
                src={session.qrCodeUrl}
                alt="QR Code for Remote Connection"
                className="w-32 h-32"
              />
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-center space-x-2 p-3 rounded-lg bg-gray-100">
            <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
            <span className="text-sm font-medium text-gray-700">{getStatusText()}</span>
            <div className="flex items-center space-x-1 text-xs text-gray-500 ml-2">
              <Clock className="w-3 h-3" />
              <span>{formatTimeRemaining()}</span>
            </div>
          </div>

          {/* End Session Button */}
          <button
            type="button"
            onClick={handleEndSession}
            className="w-full py-2.5 px-4 bg-red-500 hover:bg-red-600
                     text-white font-semibold rounded-lg transition-all duration-200
                     transform hover:scale-[1.02] active:scale-[0.98]
                     shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
          >
            <WifiOff className="w-4 h-4" />
            <span>End Session</span>
          </button>
        </div>
      ) : (
        /* Start Session */
        <div className="space-y-4">
          <div className="text-center p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Wifi className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Active Session</h3>
            <p className="text-sm text-gray-500 mb-4">
              Start a remote session to control typing from another device
            </p>
          </div>

          <button
            type="button"
            onClick={handleStartSession}
            disabled={disabled || isCreatingSession}
            className="w-full py-2.5 px-4 bg-green-500 hover:bg-green-600 
                     disabled:bg-gray-300 disabled:cursor-not-allowed
                     text-white font-semibold rounded-lg transition-all duration-200
                     transform hover:scale-[1.02] active:scale-[0.98]
                     shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
          >
            <Wifi className={`w-4 h-4 ${isCreatingSession ? 'animate-spin' : ''}`} />
            <span>{isCreatingSession ? 'Starting...' : 'Start Remote Session'}</span>
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center">
          <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
          How to Use Remote Typing
        </h4>
        <ol className="text-xs text-yellow-700 space-y-1 ml-4">
          <li>1. Click "Start Remote Session" to generate a code</li>
          <li>2. Scan the QR code or enter the code on your mobile device</li>
          <li>3. Type text on your mobile device to control this extension</li>
          <li>4. Sessions automatically expire after 5 minutes of inactivity</li>
        </ol>
      </div>

      {/* Demo Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-700">
          <strong>Demo Mode:</strong> This is a demonstration of the Remote Typing feature. In a
          production environment, you would have a companion web app for mobile devices that
          connects to the same Firebase database.
        </p>
      </div>
    </div>
  );
};

export default RemoteTyping;
