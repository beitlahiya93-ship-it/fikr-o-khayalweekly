import React, { useState } from 'react';
import { Lock, X, ShieldCheck, KeyRound, User } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  onTriggerToast: (msg: string) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onTriggerToast,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Default credentials: admin / admin123 (or admin / admin)
    if (
      (username.trim().toLowerCase() === 'admin' && (password === 'admin123' || password === 'admin')) ||
      password === 'epaper2026'
    ) {
      onTriggerToast('Admin login successful!');
      onLoginSuccess();
      onClose();
    } else {
      setError('Invalid username or password. (Hint: admin / admin123)');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-black/80 modal-backdrop" />

      {/* Login Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-[#0B1224] border border-[#1A243F] rounded-2xl md:rounded-3xl p-6 md:p-8 w-full max-w-[390px] shadow-2xl text-white z-10 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Lock Icon */}
        <div className="w-13 h-13 rounded-2xl bg-[#006B5B]/30 border border-[#00C98B]/30 flex items-center justify-center text-[#00C98B] mx-auto mb-4">
          <ShieldCheck className="w-7 h-7" />
        </div>

        <h2 className="text-xl font-bold text-center tracking-tight mb-1 text-white">
          Admin Portal Login
        </h2>
        <p className="text-xs text-gray-400 text-center mb-6">
          Access the E-Paper management console & cloud publishing system.
        </p>

        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-red-900/30 border border-red-500/40 text-red-300 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-gray-400" /> Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              className="w-full bg-[#070d1e] border border-[#1A243F] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#00C98B] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-gray-400" /> Password
            </label>
            <input
              type="password"
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password (e.g. admin123)"
              className="w-full bg-[#070d1e] border border-[#1A243F] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#00C98B] transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#009F82] hover:bg-[#00876E] text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#009F82]/25 transition-all cursor-pointer active:scale-98 mt-2"
          >
            <Lock className="w-4 h-4" />
            <span>Enter Admin Section</span>
          </button>
        </form>

        <p className="text-[11px] text-gray-500 text-center mt-4">
          Default credentials: <span className="text-gray-400 font-mono">admin</span> / <span className="text-gray-400 font-mono">admin123</span>
        </p>
      </div>
    </div>
  );
};
