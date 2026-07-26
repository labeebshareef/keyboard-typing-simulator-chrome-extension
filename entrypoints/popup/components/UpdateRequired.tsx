import { RefreshCw } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import logo from '../assets/images/ktsLogo-popup.png?url';
import type { GateStatus } from '../utils/version-gate';

interface UpdateRequiredProps {
  status: GateStatus;
}

/**
 * Full-popup takeover shown when the installed version is below the remote
 * minimum. "Update now" asks Chrome to fetch the update immediately
 * (chrome.runtime.requestUpdateCheck); the background worker applies it via
 * chrome.runtime.reload() the moment it is downloaded, so closing this popup
 * is usually all it takes.
 */
const UpdateRequired: React.FC<UpdateRequiredProps> = ({ status }) => {
  const [phase, setPhase] = useState<'idle' | 'checking' | 'requested'>('idle');

  const handleUpdate = () => {
    setPhase('checking');
    try {
      chrome.runtime.requestUpdateCheck(() => {
        // Regardless of the reported status, the update installs once the
        // extension goes idle — i.e. as soon as this popup closes.
        setPhase('requested');
      });
    } catch {
      setPhase('requested');
    }
  };

  return (
    <div className="flex min-h-[320px] w-full flex-col items-center justify-center gap-4 bg-[var(--surface)] px-8 py-10 text-center text-[var(--text)]">
      <img src={logo} alt="" className="h-10 w-auto" />
      <div className="flex items-center gap-2">
        <RefreshCw aria-hidden="true" className="h-5 w-5 text-primary-500" />
        <h1 className="text-base font-semibold">Update required</h1>
      </div>
      <p className="text-xs leading-relaxed text-[var(--text-muted)]">{status.message}</p>

      {phase === 'requested' ? (
        <p className="text-xs font-medium text-primary-600 dark:text-primary-400">
          Chrome is fetching the update. Close this popup — the new version installs within a few
          seconds and everything works again.
        </p>
      ) : (
        <button
          type="button"
          onClick={handleUpdate}
          disabled={phase === 'checking'}
          className="rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-white
                     transition-colors hover:bg-primary-600 disabled:opacity-60"
        >
          {phase === 'checking' ? 'Checking…' : 'Update now'}
        </button>
      )}

      <button
        type="button"
        onClick={() => void chrome.tabs.create({ url: status.updateUrl })}
        className="text-xs text-[var(--text-muted)] underline-offset-2 hover:underline"
      >
        Or open the Chrome Web Store
      </button>
    </div>
  );
};

export default UpdateRequired;
