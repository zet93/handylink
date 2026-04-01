import { Link } from 'react-router-dom';
import { useEffect } from 'react';

export default function AuthPromptModal({ isOpen, onClose, returnPath }) {
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 shadow-xl max-w-sm w-full mx-4">
        <h2 className="text-2xl font-semibold mb-2">Log in to continue</h2>
        <p className="text-sm text-gray-500 mb-6">
          Create a free account or log in to post a job or submit a bid.
        </p>
        <div className="space-y-3">
          <Link
            to={`/login?return=${encodeURIComponent(returnPath)}`}
            className="block w-full bg-blue-600 text-white text-center rounded-lg py-2 font-medium hover:bg-blue-700"
          >
            Log in
          </Link>
          <Link
            to={`/register?return=${encodeURIComponent(returnPath)}`}
            className="block w-full border border-gray-300 text-center rounded-lg py-2 font-medium hover:bg-gray-50"
          >
            Create account
          </Link>
          <button
            onClick={onClose}
            className="block w-full text-center text-sm text-gray-500 hover:text-gray-700 py-1"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
