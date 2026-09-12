import React, { useState, useEffect } from 'react';
import { subscribeToInAppNotifications, ToastNotification } from '../services/notifications';
import { ShieldCheck, MessageSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InAppNotificationBannerProps {
  onSelectConversation: (id: string) => void;
}

export const InAppNotificationBanner: React.FC<InAppNotificationBannerProps> = ({
  onSelectConversation,
}) => {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  useEffect(() => {
    const unsub = subscribeToInAppNotifications((toast) => {
      setToasts((prev) => [toast, ...prev.slice(0, 2)]);

      // Auto dismiss after 4.5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 4500);
    });

    return unsub;
  }, []);

  const dismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleOpen = (toast: ToastNotification) => {
    onSelectConversation(toast.conversationId);
    setToasts((prev) => prev.filter((t) => t.id !== toast.id));
  };

  return (
    <div
      id="in-app-toast-container"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={() => handleOpen(toast)}
            className="pointer-events-auto bg-slate-900/95 backdrop-blur-md border border-emerald-500/30 shadow-xl shadow-black/40 rounded-xl p-3.5 flex items-start gap-3 cursor-pointer hover:border-emerald-500/60 transition-colors"
          >
            <div
              className={`w-10 h-10 rounded-full bg-gradient-to-tr ${toast.senderAvatar} flex items-center justify-center text-white font-semibold text-sm shrink-0 shadow-md`}
            >
              {toast.isGroup ? (
                <ShieldCheck className="w-5 h-5 text-white" />
              ) : (
                toast.title.charAt(0).toUpperCase()
              )}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs font-semibold text-slate-200 truncate">
                  {toast.title}
                </span>
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/15 text-emerald-400 font-mono">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  E2EE
                </span>
              </div>
              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                {toast.body}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                <MessageSquare className="w-2.5 h-2.5" />
                <span>Tap to view conversation</span>
              </div>
            </div>

            <button
              onClick={(e) => dismiss(toast.id, e)}
              className="text-slate-400 hover:text-slate-200 p-1 -mr-1 -mt-1 rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
