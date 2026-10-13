import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#0B1224] text-white border border-[#00C98B]/50 px-4 py-2 rounded-xl text-xs font-semibold shadow-2xl flex items-center space-x-2 pointer-events-none z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <CheckCircle2 className="w-4 h-4 text-[#00C98B]" />
      <span>{message}</span>
    </div>
  );
};
