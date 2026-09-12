import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  UserProfile,
  GroupChat,
  Message,
  ConversationMeta,
  NotificationSettings,
  SocketServerEvent,
  UserStatus,
  ActiveCall,
  CallParticipant,
  ConferenceRoom,
  CallType,
} from '../types/chat';
import { socketService } from '../services/socket';
import {
  dispatchIncomingMessageNotification,
  getNotificationPermission,
  requestNotificationPermission,
} from '../services/notifications';
import { playSentSound, playMessageSound } from '../services/sound';
import { callMedia } from '../services/callMedia';

interface ChatContextType {
  currentUser: UserProfile | null;
  users: UserProfile[];
  groups: GroupChat[];
  messages: Message[];
  activeConversationId: string | null;
  activeConversation: ConversationMeta | null;
  conversations: ConversationMeta[];
  isConnected: boolean;
  notificationSettings: NotificationSettings;
  typingMap: Record<string, string[]>;
  unreadTotal: number;

  // Chat Widget UI State
  isChatWidgetOpen: boolean;
  toggleChatWidget: () => void;
  openChatWith: (id: string) => void;
  closeChatWidget: () => void;

  // Messaging Actions
  setActiveConversationId: (id: string | null) => void;
  sendMessage: (text: string, attachments?: MessageAttachment[], ephemeralSeconds?: number) => Promise<void>;
  createGroup: (name: string, description: string, memberIds: string[], avatarColor: string) => void;
  updateGroupMembers: (groupId: string, memberIds: string[]) => void;
  clearConversation: (conversationId: string, isGroup: boolean) => void;
  setTyping: (isTyping: boolean) => void;
  setUserStatus: (status: UserStatus) => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  requestPushPermission: () => Promise<boolean>;
  switchUserIdentity: (user: UserProfile) => void;
  markMessagesAsRead: (conversationId: string) => void;
  toggleReaction: (messageId: string, emoji: string) => void;
  togglePinMessage: (messageId: string, groupId: string) => void;

  // Voice & Conference Calling with Screen Share
  activeCall: ActiveCall | null;
  incomingCall: ActiveCall | null;
  isCallModalOpen: boolean;
  isMuted: boolean;
  isScreenSharing: boolean;
  activeScreenStream: MediaStream | null;
  conferenceRooms: ConferenceRoom[];
  callDurationSeconds: number;

  // Calling Actions
  startVoiceCall: (options: {
    recipientId?: string;
    groupId?: string;
    isConference?: boolean;
    title?: string;
  }) => Promise<void>;
  acceptCall: (callId: string) => Promise<void>;
  declineCall: (callId: string) => void;
  leaveCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleScreenShare: () => Promise<void>;
  inviteToConference: (userId: string) => void;
  joinConferenceRoom: (roomId: string) => Promise<void>;
  setIsCallModalOpen: (open: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const NOTIFICATION_SETTINGS_KEY = 'staff_portal_notification_settings_v2';
const CURRENT_USER_STORAGE_KEY = 'staff_portal_current_user_v2';

const DEFAULT_USERS: UserProfile[] = [
  // --- Staff Members ---
  {
    id: 'user_alice',
    username: 'alice',
    displayName: 'Alice Vance',
    avatarColor: 'from-emerald-500 to-teal-600',
    status: 'online',
    lastSeen: Date.now(),
    role: 'Lead Architect & Staff Admin',
    department: 'Engineering',
    userType: 'staff',
    organization: 'Internal Staff',
  },
  {
    id: 'user_bob',
    username: 'bob',
    displayName: 'Bob Martin',
    avatarColor: 'from-indigo-500 to-blue-600',
    status: 'online',
    lastSeen: Date.now(),
    role: 'Operations Director',
    department: 'Management',
    userType: 'staff',
    organization: 'Internal Staff',
  },
  {
    id: 'user_charlie',
    username: 'charlie',
    displayName: 'Charlie Davis',
    avatarColor: 'from-teal-500 to-emerald-600',
    status: 'online',
    lastSeen: Date.now(),
    role: 'Senior Sales Strategist',
    department: 'Client Growth',
    userType: 'staff',
    organization: 'Internal Staff',
  },
  {
    id: 'user_diana',
    username: 'diana',
    displayName: 'Diana Prince',
    avatarColor: 'from-purple-500 to-pink-600',
    status: 'away',
    lastSeen: Date.now() - 600000,
    role: 'Data Science Lead',
    department: 'Analytics',
    userType: 'staff',
    organization: 'Internal Staff',
  },

  // --- External Clients ---
  {
    id: 'user_sarah_client',
    username: 'sarah.client',
    displayName: 'Sarah Jenkins',
    avatarColor: 'from-amber-500 to-orange-600',
    status: 'online',
    lastSeen: Date.now(),
    role: 'Chief Technology Officer',
    department: 'Client Stakeholder',
    userType: 'client',
    organization: 'Apex Global Corp',
  },
  {
    id: 'user_marcus_client',
    username: 'marcus.client',
    displayName: 'Marcus Reed',
    avatarColor: 'from-sky-500 to-blue-600',
    status: 'online',
    lastSeen: Date.now(),
    role: 'VP Procurement & Logistics',
    department: 'Enterprise Customer',
    userType: 'client',
    organization: 'Vertex Logistics',
  },
  {
    id: 'user_elena_client',
    username: 'elena.client',
    displayName: 'Elena Rostova',
    avatarColor: 'from-fuchsia-500 to-rose-600',
    status: 'away',
    lastSeen: Date.now() - 1200000,
    role: 'Strategic Partnerships Lead',
    department: 'Client Account',
    userType: 'client',
    organization: 'Nova Health Inc',
  },
];

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const savedId = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
      if (savedId) {
        const found = DEFAULT_USERS.find((u) => u.id === savedId);
        if (found) return found;
      }
    } catch {}
    return DEFAULT_USERS[0]; // Default to Alice
  });

  const [users, setUsers] = useState<UserProfile[]>(DEFAULT_USERS);
  const [groups, setGroups] = useState<GroupChat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>('group_staff_operations');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [typingMap, setTypingMap] = useState<Record<string, string[]>>({});
  
  // Widget Drawer / Window State
  const [isChatWidgetOpen, setIsChatWidgetOpen] = useState<boolean>(false);

  const activeConversationIdRef = useRef(activeConversationId);
  activeConversationIdRef.current = activeConversationId;
  const isChatWidgetOpenRef = useRef(isChatWidgetOpen);
  isChatWidgetOpenRef.current = isChatWidgetOpen;

  // Calling & Conference State
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [incomingCall, setIncomingCall] = useState<ActiveCall | null>(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [activeScreenStream, setActiveScreenStream] = useState<MediaStream | null>(null);
  const [callDurationSeconds, setCallDurationSeconds] = useState<number>(0);
  const [conferenceRooms, setConferenceRooms] = useState<ConferenceRoom[]>([
    {
      id: 'room_all_hands',
      name: 'All-Hands Conference Room',
      description: 'Open voice room for company-wide meetings and screen presentations',
      activeParticipantsCount: 0,
      isLive: false,
      participants: [],
    },
    {
      id: 'room_operations',
      name: 'Ops & Support Dispatch',
      description: 'Daily operational standups and real-time coordination',
      activeParticipantsCount: 0,
      isLive: false,
      participants: [],
    },
    {
      id: 'room_client_pitch',
      name: 'Client Demo & Screen Share Studio',
      description: 'Equipped for high-resolution screen sharing and walkthroughs',
      activeParticipantsCount: 0,
      isLive: false,
      participants: [],
    },
  ]);

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    try {
      const saved = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      enabled: true,
      soundEnabled: true,
      privacyMask: false,
    };
  });

  const durationTimerRef = useRef<any>(null);

  // Track call duration
  useEffect(() => {
    if (activeCall && activeCall.status === 'connected') {
      durationTimerRef.current = setInterval(() => {
        setCallDurationSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
      setCallDurationSeconds(0);
    }
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, [activeCall?.status]);

  // Connect WebSocket when user is available
  useEffect(() => {
    if (!currentUser) return;

    socketService.connect(currentUser, {
      onConnect: () => setIsConnected(true),
      onDisconnect: () => setIsConnected(false),
      onEvent: (event: SocketServerEvent) => {
        handleServerEvent(event);
      },
    });

    return () => {
      socketService.disconnect();
    };
  }, [currentUser?.id]);

  // Server Event Handler
  const handleServerEvent = useCallback(
    (event: SocketServerEvent) => {
      switch (event.type) {
        case 'init': {
          setUsers(event.payload.users);
          setGroups(event.payload.groups);
          const initialMsgs = event.payload.messages.map((m) => ({
            ...m,
            decryptedContent: m.content,
          }));
          setMessages(initialMsgs);
          if (event.payload.rooms) {
            setConferenceRooms(event.payload.rooms);
          }
          break;
        }

        case 'user:joined': {
          setUsers((prev) => {
            const idx = prev.findIndex((u) => u.id === event.payload.user.id);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = event.payload.user;
              return updated;
            }
            return [...prev, event.payload.user];
          });
          break;
        }

        case 'user:status': {
          setUsers((prev) =>
            prev.map((u) =>
              u.id === event.payload.userId
                ? { ...u, status: event.payload.status, lastSeen: event.payload.lastSeen }
                : u
            )
          );
          break;
        }

        case 'typing:update': {
          const { conversationId, userId, isTyping } = event.payload;
          setTypingMap((prev) => {
            const currentList = prev[conversationId] || [];
            if (isTyping) {
              if (!currentList.includes(userId)) {
                return { ...prev, [conversationId]: [...currentList, userId] };
              }
            } else {
              return {
                ...prev,
                [conversationId]: currentList.filter((id) => id !== userId),
              };
            }
            return prev;
          });
          break;
        }

        case 'message:new': {
          const newMsg = {
            ...event.payload.message,
            decryptedContent: event.payload.message.content,
          };

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) {
              return prev.map((m) => (m.id === newMsg.id ? newMsg : m));
            }
            return [...prev, newMsg];
          });

          // Handle incoming audio / notification and read/delivery receipts
          if (currentUser && newMsg.senderId !== currentUser.id) {
            const msgConvId = newMsg.isGroup && newMsg.groupId ? newMsg.groupId : newMsg.senderId;
            const isViewingThisChat =
              isChatWidgetOpenRef.current && activeConversationIdRef.current === msgConvId;

            if (isViewingThisChat) {
              // User has this exact conversation open in ChatWidget right now: send read receipt!
              socketService.send({
                type: 'message:read',
                payload: {
                  messageId: newMsg.id,
                  conversationId: msgConvId,
                },
              });
            } else {
              // Not currently viewing this chat: mark as delivered
              socketService.send({
                type: 'message:delivered',
                payload: {
                  messageId: newMsg.id,
                  conversationId: msgConvId,
                },
              });
            }

            if (notificationSettings.soundEnabled && !isViewingThisChat) {
              playMessageSound();
            }
            if (notificationSettings.enabled) {
              dispatchIncomingMessageNotification({
                senderName: newMsg.senderName,
                conversationName: newMsg.isGroup ? 'Team Group' : newMsg.senderName,
                conversationId: msgConvId,
                isGroup: !!newMsg.isGroup,
                plaintext: newMsg.content,
                avatarColor: 'from-emerald-500 to-teal-600',
                settings: notificationSettings,
                isCurrentChatActive: isViewingThisChat,
              });
            }
          }
          break;
        }

        case 'message:status': {
          const { messageId, status, userId, readBy: payloadReadBy } = event.payload;
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id === messageId) {
                const readBy = payloadReadBy ? [...payloadReadBy] : m.readBy ? [...m.readBy] : [];
                if (status === 'read' && !readBy.includes(userId)) {
                  readBy.push(userId);
                }
                return { ...m, status, readBy };
              }
              return m;
            })
          );
          break;
        }

        case 'message:reaction': {
          const { messageId, reactions } = event.payload;
          setMessages((prev) =>
            prev.map((m) => (m.id === messageId ? { ...m, reactions: { ...reactions } } : m))
          );
          break;
        }

        case 'message:pinned': {
          const { messageId, groupId, isPinned, pinnedMessageIds } = event.payload;
          setGroups((prev) =>
            prev.map((g) => (g.id === groupId ? { ...g, pinnedMessageIds } : g))
          );
          setMessages((prev) =>
            prev.map((m) => (m.id === messageId ? { ...m, isPinned } : m))
          );
          break;
        }

        case 'group:created':
        case 'group:updated': {
          setGroups((prev) => {
            const idx = prev.findIndex((g) => g.id === event.payload.group.id);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = event.payload.group;
              return updated;
            }
            return [...prev, event.payload.group];
          });
          break;
        }

        case 'conversation:cleared': {
          const { conversationId } = event.payload;
          setMessages((prev) =>
            prev.filter((m) => {
              if (m.isGroup && m.groupId === conversationId) return false;
              if (!m.isGroup && (m.senderId === conversationId || m.conversationId === conversationId)) {
                return false;
              }
              return true;
            })
          );
          break;
        }

        // Calling events
        case 'call:incoming': {
          const call = event.payload.call;
          if (currentUser && call.initiatorId !== currentUser.id) {
            setIncomingCall(call);
            callMedia.playIncomingRingtone();
          }
          break;
        }

        case 'call:accepted': {
          const { callId, participant } = event.payload;
          callMedia.stopRingTone();
          callMedia.playConnectedSound();
          setActiveCall((prev) => {
            if (!prev || prev.id !== callId) return prev;
            const updatedParticipants = [...prev.participants];
            if (!updatedParticipants.some((p) => p.userId === participant.userId)) {
              updatedParticipants.push(participant);
            }
            return {
              ...prev,
              status: 'connected',
              participants: updatedParticipants,
            };
          });
          break;
        }

        case 'call:declined': {
          callMedia.stopRingTone();
          callMedia.playHangupSound();
          setActiveCall((prev) => (prev ? { ...prev, status: 'ended' } : null));
          setTimeout(() => setActiveCall(null), 1500);
          break;
        }

        case 'call:ended': {
          callMedia.stopRingTone();
          callMedia.playHangupSound();
          callMedia.stopMicrophone();
          callMedia.stopScreenShare();
          setActiveScreenStream(null);
          setIsScreenSharing(false);
          setActiveCall(null);
          setIncomingCall(null);
          setIsCallModalOpen(false);
          break;
        }

        case 'call:participant-joined': {
          const { callId, participant } = event.payload;
          setActiveCall((prev) => {
            if (!prev || prev.id !== callId) return prev;
            if (prev.participants.some((p) => p.userId === participant.userId)) return prev;
            return {
              ...prev,
              participants: [...prev.participants, participant],
            };
          });
          break;
        }

        case 'call:participant-left': {
          const { callId, userId } = event.payload;
          setActiveCall((prev) => {
            if (!prev || prev.id !== callId) return prev;
            const remaining = prev.participants.filter((p) => p.userId !== userId);
            return {
              ...prev,
              participants: remaining,
            };
          });
          break;
        }

        case 'call:participant-update': {
          const { callId, userId, isMuted: muted, isScreenSharing: sharing } = event.payload;
          setActiveCall((prev) => {
            if (!prev || prev.id !== callId) return prev;
            const participants = prev.participants.map((p) => {
              if (p.userId === userId) {
                return {
                  ...p,
                  isMuted: muted !== undefined ? muted : p.isMuted,
                  isScreenSharing: sharing !== undefined ? sharing : p.isScreenSharing,
                };
              }
              return p;
            });
            return {
              ...prev,
              participants,
              isScreenSharing: sharing !== undefined ? sharing : prev.isScreenSharing,
              screenSharerId: sharing ? userId : prev.screenSharerId === userId ? undefined : prev.screenSharerId,
            };
          });
          break;
        }

        case 'call:rooms-update': {
          setConferenceRooms(event.payload.rooms);
          break;
        }
      }
    },
    [currentUser?.id, notificationSettings]
  );

  // Send Message (No Encryption - direct plaintext)
  const sendMessage = async (text: string, attachments?: MessageAttachment[], ephemeralSeconds?: number) => {
    if (!currentUser || !activeConversationId) return;
    const trimmed = text.trim();
    const hasAttachments = Boolean(attachments && attachments.length > 0);
    if (!trimmed && !hasAttachments) return;

    const isGroup = groups.some((g) => g.id === activeConversationId);
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const finalContent = trimmed || (hasAttachments ? `Sent ${attachments!.length} attachment${attachments!.length > 1 ? 's' : ''}` : '');

    const message: Message = {
      id: messageId,
      conversationId: activeConversationId,
      senderId: currentUser.id,
      senderName: currentUser.displayName,
      timestamp: Date.now(),
      isGroup,
      groupId: isGroup ? activeConversationId : undefined,
      content: finalContent,
      decryptedContent: finalContent,
      status: 'sending',
      deliveredTo: [currentUser.id],
      readBy: [currentUser.id],
      attachments: hasAttachments ? attachments : undefined,
      ephemeralSeconds,
      expiresAt: ephemeralSeconds ? Date.now() + ephemeralSeconds * 1000 : undefined,
    };

    // Optimistically add message to state
    setMessages((prev) => [...prev, message]);
    if (notificationSettings.soundEnabled) {
      playSentSound();
    }

    // Send over WebSocket
    socketService.send({
      type: 'message:send',
      payload: { message },
    });
  };

  // Create Group
  const createGroup = (name: string, description: string, memberIds: string[], avatarColor: string) => {
    if (!currentUser) return;
    const newGroup: GroupChat = {
      id: `group_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      description,
      avatarColor,
      createdAt: Date.now(),
      createdBy: currentUser.id,
      memberIds: Array.from(new Set([...memberIds, currentUser.id])),
      adminIds: [currentUser.id],
    };

    setGroups((prev) => [...prev, newGroup]);
    setActiveConversationId(newGroup.id);

    socketService.send({
      type: 'group:create',
      payload: { group: newGroup },
    });
  };

  const updateGroupMembers = (groupId: string, memberIds: string[]) => {
    socketService.send({
      type: 'group:update_members',
      payload: { groupId, memberIds },
    });
  };

  const clearConversation = (conversationId: string, isGroup: boolean) => {
    setMessages((prev) =>
      prev.filter((m) => {
        if (isGroup && m.groupId === conversationId) return false;
        if (!isGroup && (m.senderId === conversationId || m.conversationId === conversationId)) return false;
        return true;
      })
    );

    socketService.send({
      type: 'conversation:clear',
      payload: { conversationId, isGroup },
    });
  };

  const setTyping = (isTyping: boolean) => {
    if (!activeConversationId) return;
    const isGroup = groups.some((g) => g.id === activeConversationId);
    socketService.send({
      type: isTyping ? 'typing:start' : 'typing:stop',
      payload: { conversationId: activeConversationId, isGroup },
    });
  };

  const setUserStatus = (status: UserStatus) => {
    if (currentUser) {
      setCurrentUser((prev) => (prev ? { ...prev, status } : null));
      socketService.send({
        type: 'presence',
        payload: { status },
      });
    }
  };

  const updateNotificationSettings = (settings: Partial<NotificationSettings>) => {
    setNotificationSettings((prev) => {
      const updated = { ...prev, ...settings };
      try {
        localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const requestPushPermission = async (): Promise<boolean> => {
    const granted = await requestNotificationPermission();
    if (granted === 'granted') {
      updateNotificationSettings({ enabled: true });
      return true;
    }
    return false;
  };

  const switchUserIdentity = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, user.id);
  };

  const markMessagesAsRead = useCallback(
    (conversationId: string) => {
      if (!currentUser || !conversationId) return;

      const unreadMsgIds: string[] = [];
      messages.forEach((m) => {
        const match =
          (m.isGroup && m.groupId === conversationId) ||
          (!m.isGroup &&
            ((m.senderId === conversationId && m.conversationId === currentUser.id) ||
              (m.senderId === currentUser.id && m.conversationId === conversationId)));

        if (match && m.senderId !== currentUser.id && (!m.readBy || !m.readBy.includes(currentUser.id))) {
          unreadMsgIds.push(m.id);
        }
      });

      if (unreadMsgIds.length === 0) return;

      setMessages((prev) =>
        prev.map((m) => {
          if (unreadMsgIds.includes(m.id)) {
            const readBy = m.readBy ? [...m.readBy] : [];
            if (!readBy.includes(currentUser.id)) {
              readBy.push(currentUser.id);
            }
            return { ...m, status: 'read', readBy };
          }
          return m;
        })
      );

      socketService.send({
        type: 'messages:read',
        payload: {
          messageIds: unreadMsgIds,
          conversationId,
        },
      });
    },
    [currentUser, messages]
  );

  const toggleReaction = useCallback(
    (messageId: string, emoji: string) => {
      if (!currentUser) return;
      const msg = messages.find((m) => m.id === messageId);
      if (!msg) return;

      const isGroup = msg.isGroup;
      const conversationId = isGroup && msg.groupId ? msg.groupId : msg.conversationId;

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const reactions = { ...(m.reactions || {}) };
          const users = reactions[emoji] || [];
          if (users.includes(currentUser.id)) {
            reactions[emoji] = users.filter((id) => id !== currentUser.id);
            if (reactions[emoji].length === 0) {
              delete reactions[emoji];
            }
          } else {
            reactions[emoji] = [...users, currentUser.id];
          }
          return { ...m, reactions };
        })
      );

      socketService.send({
        type: 'message:react',
        payload: {
          messageId,
          conversationId,
          emoji,
          isGroup,
        },
      });
    },
    [currentUser, messages]
  );

  const togglePinMessage = useCallback(
    (messageId: string, groupId: string) => {
      if (!currentUser || !groupId) return;
      const group = groups.find((g) => g.id === groupId);
      if (!group) return;

      const currentlyPinned = group.pinnedMessageIds?.includes(messageId) || false;
      const newPinned = !currentlyPinned;

      // Optimistic update
      setGroups((prev) =>
        prev.map((g) => {
          if (g.id !== groupId) return g;
          const currentIds = g.pinnedMessageIds || [];
          const updated = newPinned
            ? [...currentIds, messageId]
            : currentIds.filter((id) => id !== messageId);
          return { ...g, pinnedMessageIds: updated };
        })
      );

      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, isPinned: newPinned } : m))
      );

      socketService.send({
        type: 'message:pin',
        payload: {
          messageId,
          groupId,
          isPinned: newPinned,
        },
      });
    },
    [currentUser, groups]
  );

  // ==========================================
  // Voice Calling & Conference Actions
  // ==========================================

  const startVoiceCall = async ({
    recipientId,
    groupId,
    isConference = false,
    title,
  }: {
    recipientId?: string;
    groupId?: string;
    isConference?: boolean;
    title?: string;
  }) => {
    if (!currentUser) return;

    // Start local audio capture
    await callMedia.startMicrophone();

    let callTitle = title;
    if (!callTitle) {
      if (groupId) {
        const grp = groups.find((g) => g.id === groupId);
        callTitle = grp ? `${grp.name} Conference` : 'Team Voice Conference';
      } else if (recipientId) {
        const peer = users.find((u) => u.id === recipientId);
        callTitle = peer ? `Voice Call with ${peer.displayName}` : '1-on-1 Voice Call';
      } else {
        callTitle = 'Portal Voice Conference';
      }
    }

    const callId = `call_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const callType: CallType = isConference || !!groupId ? 'conference' : 'direct';

    const newCall: ActiveCall = {
      id: callId,
      type: callType,
      title: callTitle,
      initiatorId: currentUser.id,
      initiatorName: currentUser.displayName,
      status: callType === 'conference' ? 'connected' : 'calling',
      startedAt: Date.now(),
      participants: [
        {
          userId: currentUser.id,
          displayName: currentUser.displayName,
          avatarColor: currentUser.avatarColor,
          isMuted: false,
          isScreenSharing: false,
          joinedAt: Date.now(),
        },
      ],
      isScreenSharing: false,
      isAudioMuted: false,
      groupId,
    };

    setActiveCall(newCall);
    setIsCallModalOpen(true);

    if (callType === 'direct') {
      callMedia.playRingbackTone();
    } else {
      callMedia.playConnectedSound();
    }

    socketService.send({
      type: 'call:start',
      payload: {
        callId,
        type: callType,
        title: callTitle,
        recipientId,
        groupId,
        initiator: currentUser,
      },
    });
  };

  const acceptCall = async (callId: string) => {
    if (!currentUser || !incomingCall) return;

    callMedia.stopRingTone();
    await callMedia.startMicrophone();
    callMedia.playConnectedSound();

    const currentCall = incomingCall;
    setIncomingCall(null);

    const myParticipant: CallParticipant = {
      userId: currentUser.id,
      displayName: currentUser.displayName,
      avatarColor: currentUser.avatarColor,
      isMuted: false,
      isScreenSharing: false,
      joinedAt: Date.now(),
    };

    const updatedParticipants = [...currentCall.participants];
    if (!updatedParticipants.some((p) => p.userId === currentUser.id)) {
      updatedParticipants.push(myParticipant);
    }

    setActiveCall({
      ...currentCall,
      status: 'connected',
      participants: updatedParticipants,
    });
    setIsCallModalOpen(true);

    socketService.send({
      type: 'call:accept',
      payload: {
        callId,
        participant: currentUser,
      },
    });
  };

  const declineCall = (callId: string) => {
    callMedia.stopRingTone();
    setIncomingCall(null);
    if (currentUser) {
      socketService.send({
        type: 'call:decline',
        payload: { callId, userId: currentUser.id },
      });
    }
  };

  const leaveCall = () => {
    callMedia.stopRingTone();
    callMedia.playHangupSound();
    callMedia.stopMicrophone();
    callMedia.stopScreenShare();
    setActiveScreenStream(null);
    setIsScreenSharing(false);

    if (activeCall && currentUser) {
      socketService.send({
        type: 'call:leave',
        payload: { callId: activeCall.id, userId: currentUser.id },
      });
    }

    setActiveCall(null);
    setIsCallModalOpen(false);
  };

  const endCall = () => {
    callMedia.stopRingTone();
    callMedia.playHangupSound();
    callMedia.stopMicrophone();
    callMedia.stopScreenShare();
    setActiveScreenStream(null);
    setIsScreenSharing(false);

    if (activeCall) {
      socketService.send({
        type: 'call:end',
        payload: { callId: activeCall.id },
      });
    }

    setActiveCall(null);
    setIsCallModalOpen(false);
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    callMedia.setAudioMuted(next);

    if (activeCall && currentUser) {
      socketService.send({
        type: 'call:toggle-mute',
        payload: {
          callId: activeCall.id,
          userId: currentUser.id,
          isMuted: next,
        },
      });
    }
  };

  const toggleScreenShare = async () => {
    if (!activeCall || !currentUser) return;

    if (isScreenSharing) {
      // Turn off screen share
      callMedia.stopScreenShare();
      setActiveScreenStream(null);
      setIsScreenSharing(false);

      socketService.send({
        type: 'call:toggle-screen',
        payload: {
          callId: activeCall.id,
          userId: currentUser.id,
          isSharing: false,
        },
      });
    } else {
      // Start screen share
      const { stream } = await callMedia.startScreenShare(() => {
        // Callback when screen share ended by browser UI
        setIsScreenSharing(false);
        setActiveScreenStream(null);
        if (activeCall && currentUser) {
          socketService.send({
            type: 'call:toggle-screen',
            payload: {
              callId: activeCall.id,
              userId: currentUser.id,
              isSharing: false,
            },
          });
        }
      });

      setActiveScreenStream(stream);
      setIsScreenSharing(true);

      socketService.send({
        type: 'call:toggle-screen',
        payload: {
          callId: activeCall.id,
          userId: currentUser.id,
          isSharing: true,
        },
      });
    }
  };

  const inviteToConference = (userId: string) => {
    if (!activeCall || !currentUser) return;
    socketService.send({
      type: 'call:invite',
      payload: {
        callId: activeCall.id,
        invitedUserId: userId,
        callerName: currentUser.displayName,
      },
    });
  };

  const joinConferenceRoom = async (roomId: string) => {
    const room = conferenceRooms.find((r) => r.id === roomId);
    if (!room || !currentUser) return;

    await startVoiceCall({
      title: room.name,
      isConference: true,
    });

    socketService.send({
      type: 'call:join-room',
      payload: { roomId, user: currentUser },
    });
  };

  // Quick Open Chat
  const toggleChatWidget = () => {
    setIsChatWidgetOpen((prev) => !prev);
  };

  const openChatWith = (id: string) => {
    setActiveConversationId(id);
    setIsChatWidgetOpen(true);
  };

  const closeChatWidget = () => {
    setIsChatWidgetOpen(false);
  };

  // Build Conversations Meta list
  const conversations: ConversationMeta[] = [];

  // 1. Group Conversations
  groups.forEach((g) => {
    const groupMsgs = messages.filter((m) => m.isGroup && m.groupId === g.id);
    const lastMsg = groupMsgs[groupMsgs.length - 1];
    const unread = groupMsgs.filter(
      (m) => currentUser && m.senderId !== currentUser.id && (!m.readBy || !m.readBy.includes(currentUser.id))
    ).length;

    conversations.push({
      id: g.id,
      isGroup: true,
      name: g.name,
      avatarColor: g.avatarColor,
      lastMessage: lastMsg,
      unreadCount: unread,
      typingUsers: (typingMap[g.id] || []).filter((id) => id !== currentUser?.id),
      memberCount: g.memberIds.length,
    });
  });

  // 2. Direct Conversations with Team Members
  users
    .filter((u) => u.id !== currentUser?.id)
    .forEach((u) => {
      const dmMsgs = messages.filter(
        (m) =>
          !m.isGroup &&
          ((m.senderId === currentUser?.id && m.conversationId === u.id) ||
            (m.senderId === u.id && m.conversationId === currentUser?.id))
      );
      const lastMsg = dmMsgs[dmMsgs.length - 1];
      const unread = dmMsgs.filter(
        (m) => currentUser && m.senderId === u.id && (!m.readBy || !m.readBy.includes(currentUser.id))
      ).length;

      conversations.push({
        id: u.id,
        isGroup: false,
        name: u.displayName,
        avatarColor: u.avatarColor,
        status: u.status,
        lastMessage: lastMsg,
        unreadCount: unread,
        typingUsers: (typingMap[u.id] || []).filter((id) => id !== currentUser?.id),
        userType: u.userType || 'staff',
        organization: u.organization,
      });
    });

  const unreadTotal = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) || null;

  return (
    <ChatContext.Provider
      value={{
        currentUser,
        users,
        groups,
        messages,
        activeConversationId,
        activeConversation,
        conversations,
        isConnected,
        notificationSettings,
        typingMap,
        unreadTotal,

        // Chat Widget UI
        isChatWidgetOpen,
        toggleChatWidget,
        openChatWith,
        closeChatWidget,

        // Messaging Actions
        setActiveConversationId,
        sendMessage,
        createGroup,
        updateGroupMembers,
        clearConversation,
        setTyping,
        setUserStatus,
        updateNotificationSettings,
        requestPushPermission,
        switchUserIdentity,
        markMessagesAsRead,
        toggleReaction,
        togglePinMessage,

        // Calling & Screen Share
        activeCall,
        incomingCall,
        isCallModalOpen,
        isMuted,
        isScreenSharing,
        activeScreenStream,
        conferenceRooms,
        callDurationSeconds,
        startVoiceCall,
        acceptCall,
        declineCall,
        leaveCall,
        endCall,
        toggleMute,
        toggleScreenShare,
        inviteToConference,
        joinConferenceRoom,
        setIsCallModalOpen,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
