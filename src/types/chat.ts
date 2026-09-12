export type UserStatus = 'online' | 'away' | 'offline';

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatarColor: string;
  status: UserStatus;
  lastSeen?: number;
  role?: string;
  department?: string;
  userType?: 'staff' | 'client';
  organization?: string;
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'file';
  url: string; // base64 or public url
  size?: number; // bytes
  mimeType?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  timestamp: number;
  isGroup: boolean;
  groupId?: string;
  
  // Direct plaintext content (no encryption)
  content: string;
  decryptedContent?: string; // backwards compatibility
  
  // Message statuses
  status: 'sending' | 'sent' | 'delivered' | 'read';
  readBy?: string[];
  deliveredTo?: string[];

  // Emoji reactions: emoji -> list of userIds who reacted
  reactions?: Record<string, string[]>;
  
  // File attachments (images, docs, pdfs, etc.)
  attachments?: MessageAttachment[];

  // Pinned message state
  isPinned?: boolean;

  // Ephemeral timer
  ephemeralSeconds?: number;
  expiresAt?: number;
}

export interface GroupChat {
  id: string;
  name: string;
  description?: string;
  avatarColor: string;
  createdAt: number;
  createdBy: string;
  memberIds: string[];
  adminIds: string[];
  pinnedMessageIds?: string[];
}

export interface ConversationMeta {
  id: string; // userId for direct chat, or groupId for group chat
  isGroup: boolean;
  name: string;
  avatarColor: string;
  status?: UserStatus;
  lastMessage?: Message;
  unreadCount: number;
  typingUsers: string[];
  memberCount?: number;
  userType?: 'staff' | 'client';
  organization?: string;
}

export interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  privacyMask: boolean;
}

// Call & Conference Types
export type CallType = 'direct' | 'conference';
export type CallStatus = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';

export interface CallParticipant {
  userId: string;
  displayName: string;
  avatarColor: string;
  isMuted: boolean;
  isScreenSharing: boolean;
  isSpeaking?: boolean;
  joinedAt: number;
}

export interface ActiveCall {
  id: string;
  type: CallType;
  title: string;
  initiatorId: string;
  initiatorName: string;
  status: CallStatus;
  startedAt: number;
  participants: CallParticipant[];
  isScreenSharing: boolean;
  screenSharerId?: string;
  screenSharerName?: string;
  isAudioMuted: boolean;
  groupId?: string;
}

export interface ConferenceRoom {
  id: string;
  name: string;
  description: string;
  activeParticipantsCount: number;
  isLive: boolean;
  participants: CallParticipant[];
}

// WebSocket Event Protocols
export type SocketClientEvent =
  | { type: 'auth'; payload: { user: UserProfile } }
  | { type: 'presence'; payload: { status: UserStatus } }
  | { type: 'typing:start'; payload: { conversationId: string; isGroup: boolean } }
  | { type: 'typing:stop'; payload: { conversationId: string; isGroup: boolean } }
  | { type: 'message:send'; payload: { message: Message } }
  | { type: 'message:delivered'; payload: { messageId: string; conversationId: string } }
  | { type: 'message:read'; payload: { messageId: string; conversationId: string } }
  | { type: 'messages:read'; payload: { messageIds: string[]; conversationId: string } }
  | { type: 'message:react'; payload: { messageId: string; conversationId: string; emoji: string; isGroup: boolean } }
  | { type: 'message:pin'; payload: { messageId: string; groupId: string; isPinned: boolean } }
  | { type: 'group:create'; payload: { group: GroupChat } }
  | { type: 'group:update_members'; payload: { groupId: string; memberIds: string[] } }
  | { type: 'conversation:clear'; payload: { conversationId: string; isGroup: boolean } }
  | { type: 'call:start'; payload: { callId: string; type: CallType; title: string; recipientId?: string; groupId?: string; initiator: UserProfile } }
  | { type: 'call:accept'; payload: { callId: string; participant: UserProfile } }
  | { type: 'call:decline'; payload: { callId: string; userId: string } }
  | { type: 'call:leave'; payload: { callId: string; userId: string } }
  | { type: 'call:end'; payload: { callId: string } }
  | { type: 'call:invite'; payload: { callId: string; invitedUserId: string; callerName: string } }
  | { type: 'call:toggle-mute'; payload: { callId: string; userId: string; isMuted: boolean } }
  | { type: 'call:toggle-screen'; payload: { callId: string; userId: string; isSharing: boolean } }
  | { type: 'call:join-room'; payload: { roomId: string; user: UserProfile } }
  | { type: 'call:leave-room'; payload: { roomId: string; userId: string } }
  | { type: 'call:signal'; payload: { callId: string; targetUserId?: string; fromUserId: string; signal: any } };

export type SocketServerEvent =
  | { type: 'init'; payload: { users: UserProfile[]; groups: GroupChat[]; messages: Message[]; activeCalls: ActiveCall[]; rooms: ConferenceRoom[] } }
  | { type: 'user:joined'; payload: { user: UserProfile } }
  | { type: 'user:left'; payload: { userId: string } }
  | { type: 'user:status'; payload: { userId: string; status: UserStatus; lastSeen: number } }
  | { type: 'typing:update'; payload: { conversationId: string; userId: string; isTyping: boolean } }
  | { type: 'message:new'; payload: { message: Message } }
  | { type: 'message:status'; payload: { messageId: string; status: 'delivered' | 'read'; userId: string; readBy?: string[] } }
  | { type: 'message:reaction'; payload: { messageId: string; conversationId: string; reactions: Record<string, string[]> } }
  | { type: 'message:pinned'; payload: { messageId: string; groupId: string; isPinned: boolean; pinnedMessageIds: string[] } }
  | { type: 'group:created'; payload: { group: GroupChat } }
  | { type: 'group:updated'; payload: { group: GroupChat } }
  | { type: 'conversation:cleared'; payload: { conversationId: string } }
  | { type: 'call:incoming'; payload: { call: ActiveCall } }
  | { type: 'call:accepted'; payload: { callId: string; participant: CallParticipant } }
  | { type: 'call:declined'; payload: { callId: string; userId: string } }
  | { type: 'call:ended'; payload: { callId: string } }
  | { type: 'call:participant-joined'; payload: { callId: string; participant: CallParticipant } }
  | { type: 'call:participant-left'; payload: { callId: string; userId: string } }
  | { type: 'call:participant-update'; payload: { callId: string; userId: string; isMuted?: boolean; isScreenSharing?: boolean; isSpeaking?: boolean } }
  | { type: 'call:signal'; payload: { callId: string; fromUserId: string; signal: any } }
  | { type: 'call:rooms-update'; payload: { rooms: ConferenceRoom[] } };
