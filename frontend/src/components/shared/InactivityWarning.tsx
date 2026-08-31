'use client';

import { AlertTriangle, Clock } from '@/components/icons';

interface InactivityWarningProps {
  show: boolean;
  timeRemaining: number;
  onStayLoggedIn: () => void;
  onLogout: () => void;
}

export function InactivityWarning({
  show,
  timeRemaining,
  onStayLoggedIn,
  onLogout,
}: InactivityWarningProps) {
  if (!show) return null;

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Session Expiring Soon
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              You&apos;ve been inactive for a while. Your session will expire in{' '}
              <span className="font-bold text-amber-600">
                {minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`}
              </span>
              . Do you want to stay logged in?
            </p>
            <div className="flex gap-3">
              <button
                onClick={onStayLoggedIn}
                className="flex-1 bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors"
              >
                Stay Logged In
              </button>
              <button
                onClick={onLogout}
                className="flex-1 inline-flex items-center justify-center bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-700 font-semibold leading-tight text-center py-2.5 px-4 rounded-xl transition-colors"
              >
                Logout Now
              </button>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="w-4 h-4" />
            <span>
              For security, inactive sessions are automatically terminated
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
