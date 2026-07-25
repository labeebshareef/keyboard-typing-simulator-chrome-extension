import { Star, X } from 'lucide-react';
import type React from 'react';
import { REVIEW_URL, dismissReviewAsk } from '../utils/review-ask';

interface ReviewAskCardProps {
  onClose: () => void;
}

/**
 * One-time, dismissible review ask shown above the action bar after the
 * third completed session. Both paths (rate / dismiss) mark it done forever.
 */
const ReviewAskCard: React.FC<ReviewAskCardProps> = ({ onClose }) => {
  const finish = () => {
    void dismissReviewAsk();
    onClose();
  };

  return (
    <div
      className="mx-4 mb-2 flex shrink-0 items-center gap-2 rounded-lg border border-[var(--border)]
                 bg-[var(--surface-raised)] px-3 py-2"
    >
      <Star aria-hidden="true" className="h-4 w-4 shrink-0 text-primary-500" />
      <p className="flex-1 text-xs text-[var(--text)]">
        Enjoying GhostType? A review really helps an indie extension.
      </p>
      <button
        type="button"
        onClick={() => {
          void chrome.tabs.create({ url: REVIEW_URL });
          finish();
        }}
        className="shrink-0 rounded-md bg-primary-500 px-2.5 py-1 text-xs font-semibold text-white
                   transition-colors hover:bg-primary-600"
      >
        Rate it
      </button>
      <button
        type="button"
        onClick={finish}
        aria-label="Dismiss review request"
        className="shrink-0 rounded-md p-1 text-[var(--text-muted)] transition-colors
                   hover:bg-black/5 hover:text-[var(--text)] dark:hover:bg-white/5"
      >
        <X aria-hidden="true" className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export default ReviewAskCard;
