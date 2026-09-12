import React, { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import {
  isPushNotificationSupported,
  getNotificationPermission,
  dispatchIncomingMessageNotification,
} from '../services/notifications';
import { playIncomingChime } from '../services/sound';
import { Bell, BellRing, Volume2, Shield, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { notificationSettings, updateNotificationSettings, requestPushPermission, currentUser } = useChat();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPermission(getNotificationPermission());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const supported = isPushNotificationSupported();

  const handleTogglePush = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    if (checked && permission !== 'granted') {
      const granted = await requestPushPermission();
      setPermission(getNotificationPermission());
      if (!granted) return;
    }
    updateNotificationSettings({ enabled: checked });
  };

  const handleTestNotification = () => {
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);

    // Play chime sound directly
    if (notificationSettings.soundEnabled) {
      playIncomingChime();
    }

    dispatchIncomingMessageNotification({
      senderName: 'Security Sentinel',
      conversationName: 'Test Notification',
      conversationId: 'test_notification_id',
      isGroup: false,
      plaintext: '🔒 End-to-end encryption active: Push notification delivery verified.',
      avatarColor: 'from-emerald-500 to-teal-600',
      settings: notificationSettings,
      isCurrentChatActive: false,
    });
  };

  return (
    <div
      id="notification-settings-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        id="notification-settings-modal-container"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl shadow-black/80 text-slate-100 animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Push & Notification Settings
              </h2>
              <p className="text-xs text-slate-400">
                Data privacy & real-time delivery alerts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-sm px-2.5 py-1 rounded-lg hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        <div className="py-4 space-y-4 text-xs">
          {/* Push Notifications Enable Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-blue-400" />
                <span>Push Notifications for Incoming Messages</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Receive instant alerts when new encrypted direct or group messages arrive.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={notificationSettings.enabled}
                onChange={handleTogglePush}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* Browser Permission State */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {permission === 'granted' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : permission === 'denied' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <div>
                <span className="text-slate-300 font-medium text-xs block">
                  Browser Permission Status
                </span>
                <span className="text-[11px] text-slate-400 font-mono capitalize">
                  {permission}
                </span>
              </div>
            </div>

            {permission !== 'granted' && supported && (
              <button
                type="button"
                onClick={requestPushPermission}
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-3 py-1.5 rounded-lg text-xs transition-colors shrink-0"
              >
                Grant Access
              </button>
            )}
          </div>

          {/* Sound Notification Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Audible Notification Chime</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Synthesized two-tone melodic chime for incoming and outgoing messages.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={notificationSettings.soundEnabled}
                onChange={(e) => updateNotificationSettings({ soundEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* Privacy Mask Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span>Privacy Mode: Mask Message Preview</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Hides decrypted text on lockscreen & OS banners (displays "Encrypted message received").
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={notificationSettings.privacyMask}
                onChange={(e) => updateNotificationSettings({ privacyMask: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* Test Push Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleTestNotification}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 border border-slate-700"
            >
              <BellRing className="w-3.5 h-3.5 text-emerald-400" />
              <span>{testSent ? '✓ Notification Dispatched!' : 'Send Test Push & Audio Alert'}</span>
            </button>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold py-2 rounded-xl text-xs transition-colors"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
