'use client';

import { useEffect, useState, useCallback } from 'react';

import SuccessCheckmark from '@/components/shared/SuccessCheckmark';

type ToastType = 'error' | 'success' | 'info';

interface ToastProps {
  message: string | null;
  type?: ToastType;
  duration?: number; // ms, default 4000
  onDismiss?: () => void;
}

export default function Toast({
  message,
  type = 'error',
  duration = 4000,
  onDismiss,
}: ToastProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      setExiting(false);
      onDismiss?.();
    }, 300);
  }, [onDismiss]);

  useEffect(() => {
    if (!message) {
      setVisible(false);
      setExiting(false);
      return;
    }
    setExiting(false);
    setVisible(true);
    const timer = setTimeout(dismiss, duration);
    return () => clearTimeout(timer);
  }, [message, duration, dismiss]);

  if (!visible || !message) return null;

  const styles: Record<ToastType, string> = {
    error:
      'bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] shadow-[0_8px_32px_-4px_rgba(220,38,38,0.25)]',
    success:
      'bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] shadow-[0_8px_32px_-4px_rgba(5,150,105,0.25)]',
    info:
      'bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E40AF] shadow-[0_8px_32px_-4px_rgba(3,105,161,0.25)]',
  };

  const icons: Record<ToastType, React.ReactNode> = {
    error: <span>⚠️</span>,
    success: <SuccessCheckmark size="sm" className="mt-0.5" />,
    info: <span>ℹ️</span>,
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: 'fixed',
        top: '1.25rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        minWidth: '280px',
        maxWidth: 'min(480px, calc(100vw - 2rem))',
        animation: exiting
          ? 'toastOut 300ms cubic-bezier(0.4,0,0.2,1) both'
          : 'toastIn 320ms cubic-bezier(0.34,1.56,0.64,1) both',
      }}
      className={`flex items-start gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold ${styles[type]}`}
    >
      <span className="text-base shrink-0 mt-0.5">{icons[type]}</span>
      <span className="flex-1 leading-snug">{message}</span>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 ml-1 opacity-60 hover:opacity-100 transition-opacity text-lg leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
