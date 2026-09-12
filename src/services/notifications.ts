import { NotificationSettings } from '../types/chat';
import { playIncomingChime } from './sound';

export interface ToastNotification {
  id: string;
  title: string;
  body: string;
  senderAvatar: string;
  conversationId: string;
  isGroup: boolean;
  timestamp: number;
}

type ToastListener = (toast: ToastNotification) => void;
const toastListeners = new Set<ToastListener>();

export function subscribeToInAppNotifications(listener: ToastListener): () => void {
  toastListeners.add(listener);
  return () => {
    toastListeners.delete(listener);
  };
}

/**
 * Checks if browser Notification API is supported
 */
export function isPushNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Returns current permission state ('granted', 'denied', or 'default')
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isPushNotificationSupported()) return 'denied';
  return Notification.permission;
}

/**
 * Requests browser push notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushNotificationSupported()) return 'denied';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('[Notification] Permission request failed:', err);
    return 'denied';
  }
}

/**
 * Dispatches both Web Push Notification and In-App Toast
 */
export function dispatchIncomingMessageNotification(params: {
  senderName: string;
  conversationName: string;
  conversationId: string;
  isGroup: boolean;
  plaintext?: string;
  avatarColor: string;
  settings: NotificationSettings;
  isCurrentChatActive: boolean;
}): void {
  const {
    senderName,
    conversationName,
    conversationId,
    isGroup,
    plaintext,
    avatarColor,
    settings,
    isCurrentChatActive,
  } = params;

  // If user has globally disabled notifications in settings, return
  if (!settings.enabled) return;

  // Play audio chime if enabled and not currently focused on the active chat
  if (settings.soundEnabled && (!isCurrentChatActive || document.hidden)) {
    playIncomingChime();
  }

  // Determine title and body preview respecting privacy mask settings
  const title = isGroup ? `${senderName} in ${conversationName}` : senderName;
  let body = 'Encrypted message received';

  if (!settings.privacyMask && plaintext) {
    body = plaintext.length > 80 ? `${plaintext.substring(0, 80)}…` : plaintext;
  }

  // 1. In-App Notification Toast (for when user is browsing the app or other chats)
  if (!isCurrentChatActive) {
    const toast: ToastNotification = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title,
      body,
      senderAvatar: avatarColor,
      conversationId,
      isGroup,
      timestamp: Date.now(),
    };
    toastListeners.forEach((listener) => listener(toast));
  }

  // 2. Web Push Notification (fires when tab is in background, minimized, or different chat)
  if (isPushNotificationSupported() && Notification.permission === 'granted') {
    // Only fire OS notification if window is backgrounded OR if user is on a different chat
    if (document.hidden || !isCurrentChatActive) {
      try {
        const notif = new Notification(title, {
          body,
          tag: `chat-${conversationId}`,
          // Silent browser sound if Web Audio already played chime
          silent: true,
          requireInteraction: false,
        });

        notif.onclick = () => {
          window.focus();
          notif.close();
        };

        // Auto-close after 5 seconds
        setTimeout(() => {
          try {
            notif.close();
          } catch {
            // ignore
          }
        }, 5000);
      } catch (err) {
        console.debug('[Push] Notification dispatch prevented by browser context:', err);
      }
    }
  }
}
