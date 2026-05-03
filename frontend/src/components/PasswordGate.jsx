import { useState } from 'react';

const STORAGE_KEY = 'hl_access';
const PASSWORD = import.meta.env.VITE_APP_PASSWORD;

export default function PasswordGate({ children }) {
  const [unlocked, setUnlocked] = useState(
    !PASSWORD || localStorage.getItem(STORAGE_KEY) === PASSWORD
  );
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  if (unlocked) return children;

  function handleSubmit(e) {
    e.preventDefault();
    if (input === PASSWORD) {
      localStorage.setItem(STORAGE_KEY, PASSWORD);
      setUnlocked(true);
    } else {
      setError(true);
      setInput('');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold text-gray-800">HandyLink</h1>
        <p className="text-sm text-gray-500">Enter the access password to continue.</p>
        <input
          type="password"
          value={input}
          onChange={e => { setInput(e.target.value); setError(false); }}
          placeholder="Password"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
        {error && <p className="text-sm text-red-500">Incorrect password.</p>}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-blue-700"
        >
          Enter
        </button>
      </form>
    </div>
  );
}
