import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import {
  UserProfile,
  GroupChat,
  Message,
  ActiveCall,
  CallParticipant,
  ConferenceRoom,
  SocketClientEvent,
  SocketServerEvent,
} from './src/types/chat';

const PORT = 3000;
const app = express();
app.use(express.json());

interface ClientSession {
  ws: WebSocket;
  user: UserProfile;
}

const activeSessions = new Map<string, ClientSession>(); // socketId -> ClientSession
const registeredUsers = new Map<string, UserProfile>(); // userId -> UserProfile
const groups = new Map<string, GroupChat>(); // groupId -> GroupChat
const messages: Message[] = []; // In-memory message store
const activeCalls = new Map<string, ActiveCall>(); // callId -> ActiveCall

// Seed Users (Staff & External Clients)
const SEED_USERS: UserProfile[] = [
  // --- Staff Team Members ---
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

SEED_USERS.forEach((u) => registeredUsers.set(u.id, u));

const SEED_GROUP: GroupChat = {
  id: 'group_staff_operations',
  name: 'Staff Operations & All-Hands',
  description: 'General staff coordination, announcements and open conference room',
  avatarColor: 'from-emerald-600 to-teal-700',
  createdAt: Date.now() - 86400000,
  createdBy: 'user_alice',
  memberIds: ['user_alice', 'user_bob', 'user_charlie', 'user_diana', 'user_sarah_client'],
  adminIds: ['user_alice'],
  pinnedMessageIds: ['msg_pinned_ops_announcement'],
};

const SEED_CLIENT_GROUP: GroupChat = {
  id: 'group_apex_joint_sprint',
  name: 'Apex Global & Staff Joint Channel',
  description: 'Shared sprint channel between Staff Architects and Apex Global executive team',
  avatarColor: 'from-amber-500 to-emerald-600',
  createdAt: Date.now() - 43200000,
  createdBy: 'user_alice',
  memberIds: ['user_alice', 'user_bob', 'user_sarah_client', 'user_marcus_client'],
  adminIds: ['user_alice', 'user_sarah_client'],
  pinnedMessageIds: ['msg_pinned_client_sla'],
};

groups.set(SEED_GROUP.id, SEED_GROUP);
groups.set(SEED_CLIENT_GROUP.id, SEED_CLIENT_GROUP);

// Pre-seeded conference rooms
const conferenceRooms: ConferenceRoom[] = [
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
];

// Pre-seed some initial messages
if (messages.length === 0) {
  messages.push(
    {
      id: 'msg_welcome_1',
      conversationId: 'user_bob',
      senderId: 'user_bob',
      senderName: 'Bob Martin',
      timestamp: Date.now() - 3600000,
      isGroup: false,
      content: 'Hey! The staff portal real-time conference calling, file attachments, and screen share are all set up.',
      decryptedContent: 'Hey! The staff portal real-time conference calling, file attachments, and screen share are all set up.',
      status: 'read',
      deliveredTo: ['user_alice', 'user_bob'],
      readBy: ['user_alice', 'user_bob'],
    },
    {
      id: 'msg_pinned_ops_announcement',
      conversationId: 'group_staff_operations',
      groupId: 'group_staff_operations',
      senderId: 'user_alice',
      senderName: 'Alice Vance',
      timestamp: Date.now() - 1800000,
      isGroup: true,
      isPinned: true,
      content: '🚨 CRITICAL NOTICE: Please review the updated Q4 infrastructure deployment guidelines. Standby on the Ops Dispatch conference bridge at 2:00 PM.',
      decryptedContent: '🚨 CRITICAL NOTICE: Please review the updated Q4 infrastructure deployment guidelines. Standby on the Ops Dispatch conference bridge at 2:00 PM.',
      status: 'delivered',
      deliveredTo: ['user_alice', 'user_bob', 'user_charlie'],
      readBy: ['user_alice'],
      attachments: [
        {
          id: 'att_infra_specs',
          name: 'Q4_Infrastructure_Deployment_v2.pdf',
          type: 'document',
          url: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXr',
          size: 342000,
          mimeType: 'application/pdf',
        },
      ],
    },
    {
      id: 'msg_pinned_client_sla',
      conversationId: 'group_apex_joint_sprint',
      groupId: 'group_apex_joint_sprint',
      senderId: 'user_sarah_client',
      senderName: 'Sarah Jenkins',
      timestamp: Date.now() - 1200000,
      isGroup: true,
      isPinned: true,
      content: '📌 Client Milestones: Apex Global rollout schedule approved. Attached is our signed SLA agreement.',
      decryptedContent: '📌 Client Milestones: Apex Global rollout schedule approved. Attached is our signed SLA agreement.',
      status: 'read',
      deliveredTo: ['user_alice', 'user_bob', 'user_sarah_client'],
      readBy: ['user_alice', 'user_sarah_client'],
      attachments: [
        {
          id: 'att_apex_sla',
          name: 'Apex_Global_SLA_Master_Agreement.pdf',
          type: 'document',
          url: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXr',
          size: 512000,
          mimeType: 'application/pdf',
        },
      ],
    },
    {
      id: 'msg_client_direct_1',
      conversationId: 'user_alice',
      senderId: 'user_sarah_client',
      senderName: 'Sarah Jenkins',
      timestamp: Date.now() - 900000,
      isGroup: false,
      content: 'Hello Alice! I have reviewed the telemetry dashboard mockups. Here is the client dashboard screenshot reference.',
      decryptedContent: 'Hello Alice! I have reviewed the telemetry dashboard mockups. Here is the client dashboard screenshot reference.',
      status: 'delivered',
      deliveredTo: ['user_alice', 'user_sarah_client'],
      readBy: ['user_sarah_client'],
      attachments: [
        {
          id: 'att_client_mockup',
          name: 'Telemetry_Dashboard_Review.png',
          type: 'image',
          url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
          size: 198000,
          mimeType: 'image/png',
        },
      ],
    }
  );
}

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    portal: 'active',
    activeSockets: activeSessions.size,
    registeredUsers: registeredUsers.size,
    groups: groups.size,
    activeCalls: activeCalls.size,
  });
});

app.get('/api/users', (req, res) => {
  res.json(Array.from(registeredUsers.values()));
});

app.get('/api/rooms', (req, res) => {
  res.json(conferenceRooms);
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

function broadcast(event: SocketServerEvent, recipientUserIds?: string[]) {
  const payload = JSON.stringify(event);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      if (recipientUserIds) {
        for (const session of activeSessions.values()) {
          if (session.ws === client && recipientUserIds.includes(session.user.id)) {
            client.send(payload);
            break;
          }
        }
      } else {
        client.send(payload);
      }
    }
  });
}

function sendToUser(userId: string, event: SocketServerEvent) {
  const payload = JSON.stringify(event);
  for (const session of activeSessions.values()) {
    if (session.user.id === userId && session.ws.readyState === WebSocket.OPEN) {
      session.ws.send(payload);
    }
  }
}

wss.on('connection', (ws: WebSocket) => {
  const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  ws.on('message', (dataStr: string) => {
    try {
      const event: SocketClientEvent = JSON.parse(dataStr.toString());

      switch (event.type) {
        case 'auth': {
          const user = event.payload.user;
          const existing = registeredUsers.get(user.id) || user;
          const updatedUser: UserProfile = {
            ...existing,
            ...user,
            status: 'online',
            lastSeen: Date.now(),
          };
          registeredUsers.set(user.id, updatedUser);
          activeSessions.set(sessionId, { ws, user: updatedUser });

          const userList = Array.from(registeredUsers.values());
          const groupList = Array.from(groups.values()).filter((g) =>
            g.memberIds.includes(user.id)
          );

          const userGroupIds = new Set(groupList.map((g) => g.id));
          const relevantMessages = messages.filter((m) => {
            if (m.isGroup && m.groupId) {
              return userGroupIds.has(m.groupId);
            }
            return m.senderId === user.id || m.conversationId === user.id;
          });

          const activeCallList = Array.from(activeCalls.values());

          const initEvent: SocketServerEvent = {
            type: 'init',
            payload: {
              users: userList,
              groups: groupList,
              messages: relevantMessages,
              activeCalls: activeCallList,
              rooms: conferenceRooms,
            },
          };
          ws.send(JSON.stringify(initEvent));

          broadcast({
            type: 'user:joined',
            payload: { user: updatedUser },
          });
          break;
        }

        case 'presence': {
          const session = activeSessions.get(sessionId);
          if (session) {
            session.user.status = event.payload.status;
            session.user.lastSeen = Date.now();
            registeredUsers.set(session.user.id, session.user);

            broadcast({
              type: 'user:status',
              payload: {
                userId: session.user.id,
                status: event.payload.status,
                lastSeen: session.user.lastSeen,
              },
            });
          }
          break;
        }

        case 'typing:start':
        case 'typing:stop': {
          const session = activeSessions.get(sessionId);
          if (session) {
            const isTyping = event.type === 'typing:start';
            const { conversationId, isGroup } = event.payload;

            if (isGroup) {
              const group = groups.get(conversationId);
              if (group) {
                const recipients = group.memberIds.filter((id) => id !== session.user.id);
                broadcast(
                  {
                    type: 'typing:update',
                    payload: {
                      conversationId,
                      userId: session.user.id,
                      isTyping,
                    },
                  },
                  recipients
                );
              }
            } else {
              sendToUser(conversationId, {
                type: 'typing:update',
                payload: {
                  conversationId: session.user.id,
                  userId: session.user.id,
                  isTyping,
                },
              });
            }
          }
          break;
        }

        case 'message:send': {
          const rawMsg = event.payload.message;
          const session = activeSessions.get(sessionId);
          const senderId = session ? session.user.id : rawMsg.senderId;

          const isGroup = rawMsg.isGroup;
          const msg: Message = {
            ...rawMsg,
            senderId,
            decryptedContent: rawMsg.content,
            status: 'sent',
            deliveredTo: [senderId],
            readBy: [senderId],
          };

          if (isGroup && msg.groupId) {
            const group = groups.get(msg.groupId);
            if (group) {
              group.memberIds.forEach((mId) => {
                if (mId !== senderId) {
                  for (const s of activeSessions.values()) {
                    if (s.user.id === mId) {
                      msg.deliveredTo?.push(mId);
                      break;
                    }
                  }
                }
              });

              if ((msg.deliveredTo?.length || 0) > 1) {
                msg.status = 'delivered';
              }
              messages.push(msg);

              broadcast(
                {
                  type: 'message:new',
                  payload: { message: msg },
                },
                group.memberIds
              );
            }
          } else {
            const recipientId = msg.conversationId;
            let recipientOnline = false;
            for (const s of activeSessions.values()) {
              if (s.user.id === recipientId) {
                recipientOnline = true;
                break;
              }
            }

            if (recipientOnline) {
              msg.status = 'delivered';
              msg.deliveredTo?.push(recipientId);
            }

            messages.push(msg);

            sendToUser(recipientId, {
              type: 'message:new',
              payload: { message: msg },
            });

            sendToUser(senderId, {
              type: 'message:new',
              payload: { message: msg },
            });
          }
          break;
        }

        case 'message:read': {
          const session = activeSessions.get(sessionId);
          if (!session) break;
          const { messageId } = event.payload;
          const msg = messages.find((m) => m.id === messageId);
          if (msg) {
            if (!msg.readBy) msg.readBy = [];
            if (!msg.readBy.includes(session.user.id)) {
              msg.readBy.push(session.user.id);
            }
            msg.status = 'read';

            const statusPayload = {
              messageId,
              status: 'read' as const,
              userId: session.user.id,
              readBy: msg.readBy,
            };

            if (msg.isGroup && msg.groupId) {
              const group = groups.get(msg.groupId);
              if (group) {
                broadcast(
                  {
                    type: 'message:status',
                    payload: statusPayload,
                  },
                  group.memberIds
                );
              }
            } else {
              sendToUser(msg.senderId, {
                type: 'message:status',
                payload: statusPayload,
              });
              sendToUser(session.user.id, {
                type: 'message:status',
                payload: statusPayload,
              });
            }
          }
          break;
        }

        case 'messages:read': {
          const session = activeSessions.get(sessionId);
          if (!session) break;
          const { messageIds, conversationId } = event.payload;
          if (!Array.isArray(messageIds) || messageIds.length === 0) break;

          const group = groups.get(conversationId);
          messageIds.forEach((mId) => {
            const msg = messages.find((m) => m.id === mId);
            if (msg) {
              if (!msg.readBy) msg.readBy = [];
              if (!msg.readBy.includes(session.user.id)) {
                msg.readBy.push(session.user.id);
              }
              msg.status = 'read';

              const statusPayload = {
                messageId: mId,
                status: 'read' as const,
                userId: session.user.id,
                readBy: msg.readBy,
              };

              if (msg.isGroup && msg.groupId) {
                if (group) {
                  broadcast(
                    {
                      type: 'message:status',
                      payload: statusPayload,
                    },
                    group.memberIds
                  );
                }
              } else {
                sendToUser(msg.senderId, {
                  type: 'message:status',
                  payload: statusPayload,
                });
                sendToUser(session.user.id, {
                  type: 'message:status',
                  payload: statusPayload,
                });
              }
            }
          });
          break;
        }

        case 'message:react': {
          const session = activeSessions.get(sessionId);
          if (!session) break;
          const { messageId, conversationId, emoji, isGroup } = event.payload;
          const msg = messages.find((m) => m.id === messageId);
          if (msg && emoji) {
            if (!msg.reactions) {
              msg.reactions = {};
            }
            const currentUsers = msg.reactions[emoji] || [];
            if (currentUsers.includes(session.user.id)) {
              // Remove reaction
              msg.reactions[emoji] = currentUsers.filter((id) => id !== session.user.id);
              if (msg.reactions[emoji].length === 0) {
                delete msg.reactions[emoji];
              }
            } else {
              // Add reaction
              msg.reactions[emoji] = [...currentUsers, session.user.id];
            }

            const reactionPayload = {
              messageId,
              conversationId,
              reactions: { ...msg.reactions },
            };

            if (isGroup) {
              const group = groups.get(conversationId);
              if (group) {
                broadcast(
                  {
                    type: 'message:reaction',
                    payload: reactionPayload,
                  },
                  group.memberIds
                );
              }
            } else {
              sendToUser(msg.senderId, {
                type: 'message:reaction',
                payload: reactionPayload,
              });
              sendToUser(session.user.id, {
                type: 'message:reaction',
                payload: reactionPayload,
              });
              if (msg.conversationId !== msg.senderId && msg.conversationId !== session.user.id) {
                sendToUser(msg.conversationId, {
                  type: 'message:reaction',
                  payload: reactionPayload,
                });
              }
            }
          }
          break;
        }

        case 'message:pin': {
          const session = activeSessions.get(sessionId);
          if (!session) break;
          const { messageId, groupId, isPinned } = event.payload;
          const group = groups.get(groupId);
          if (group) {
            if (!group.pinnedMessageIds) {
              group.pinnedMessageIds = [];
            }
            if (isPinned) {
              if (!group.pinnedMessageIds.includes(messageId)) {
                group.pinnedMessageIds.push(messageId);
              }
            } else {
              group.pinnedMessageIds = group.pinnedMessageIds.filter((id) => id !== messageId);
            }

            // Also update the message object in memory
            const msg = messages.find((m) => m.id === messageId);
            if (msg) {
              msg.isPinned = isPinned;
            }

            broadcast(
              {
                type: 'message:pinned',
                payload: {
                  messageId,
                  groupId,
                  isPinned,
                  pinnedMessageIds: [...group.pinnedMessageIds],
                },
              },
              group.memberIds
            );
          }
          break;
        }

        case 'group:create': {
          const newGroup = event.payload.group;
          groups.set(newGroup.id, newGroup);
          broadcast(
            {
              type: 'group:created',
              payload: { group: newGroup },
            },
            newGroup.memberIds
          );
          break;
        }

        case 'group:update_members': {
          const { groupId, memberIds } = event.payload;
          const group = groups.get(groupId);
          if (group) {
            group.memberIds = memberIds;
            groups.set(groupId, group);
            broadcast(
              {
                type: 'group:updated',
                payload: { group },
              },
              group.memberIds
            );
          }
          break;
        }

        case 'conversation:clear': {
          const session = activeSessions.get(sessionId);
          if (!session) break;
          const { conversationId, isGroup } = event.payload;

          if (isGroup) {
            const filtered = messages.filter((m) => m.groupId !== conversationId);
            messages.length = 0;
            messages.push(...filtered);

            const group = groups.get(conversationId);
            if (group) {
              broadcast(
                {
                  type: 'conversation:cleared',
                  payload: { conversationId },
                },
                group.memberIds
              );
            }
          } else {
            const myId = session.user.id;
            const peerId = conversationId;
            const filtered = messages.filter(
              (m) =>
                !(
                  (!m.isGroup && m.senderId === myId && m.conversationId === peerId) ||
                  (!m.isGroup && m.senderId === peerId && m.conversationId === myId)
                )
            );
            messages.length = 0;
            messages.push(...filtered);

            sendToUser(myId, {
              type: 'conversation:cleared',
              payload: { conversationId: peerId },
            });
            sendToUser(peerId, {
              type: 'conversation:cleared',
              payload: { conversationId: myId },
            });
          }
          break;
        }

        // ==========================================
        // Voice Calling & Conference Signaling
        // ==========================================
        case 'call:start': {
          const { callId, type, title, recipientId, groupId, initiator } = event.payload;
          const initialParticipant: CallParticipant = {
            userId: initiator.id,
            displayName: initiator.displayName,
            avatarColor: initiator.avatarColor,
            isMuted: false,
            isScreenSharing: false,
            joinedAt: Date.now(),
          };

          const call: ActiveCall = {
            id: callId,
            type,
            title,
            initiatorId: initiator.id,
            initiatorName: initiator.displayName,
            status: type === 'conference' ? 'connected' : 'calling',
            startedAt: Date.now(),
            participants: [initialParticipant],
            isScreenSharing: false,
            isAudioMuted: false,
            groupId,
          };

          activeCalls.set(callId, call);

          if (type === 'direct' && recipientId) {
            // Direct call: notify target
            sendToUser(recipientId, {
              type: 'call:incoming',
              payload: { call },
            });
          } else if (type === 'conference' && groupId) {
            // Group call: broadcast to all group members except initiator
            const grp = groups.get(groupId);
            if (grp) {
              const membersToNotify = grp.memberIds.filter((id) => id !== initiator.id);
              broadcast({ type: 'call:incoming', payload: { call } }, membersToNotify);
            }
          } else {
            // Public conference call
            broadcast({ type: 'call:incoming', payload: { call } });
          }
          break;
        }

        case 'call:accept': {
          const { callId, participant } = event.payload;
          const call = activeCalls.get(callId);
          if (call) {
            call.status = 'connected';
            const exists = call.participants.some((p) => p.userId === participant.id);
            if (!exists) {
              const newP: CallParticipant = {
                userId: participant.id,
                displayName: participant.displayName,
                avatarColor: participant.avatarColor,
                isMuted: false,
                isScreenSharing: false,
                joinedAt: Date.now(),
              };
              call.participants.push(newP);
            }

            // Notify all participants
            const pIds = call.participants.map((p) => p.userId);
            broadcast(
              {
                type: 'call:accepted',
                payload: {
                  callId,
                  participant: {
                    userId: participant.id,
                    displayName: participant.displayName,
                    avatarColor: participant.avatarColor,
                    isMuted: false,
                    isScreenSharing: false,
                    joinedAt: Date.now(),
                  },
                },
              },
              pIds
            );
          }
          break;
        }

        case 'call:decline': {
          const { callId, userId } = event.payload;
          const call = activeCalls.get(callId);
          if (call) {
            sendToUser(call.initiatorId, {
              type: 'call:declined',
              payload: { callId, userId },
            });
            if (call.participants.length <= 1) {
              activeCalls.delete(callId);
            }
          }
          break;
        }

        case 'call:leave': {
          const { callId, userId } = event.payload;
          const call = activeCalls.get(callId);
          if (call) {
            call.participants = call.participants.filter((p) => p.userId !== userId);
            if (call.screenSharerId === userId) {
              call.isScreenSharing = false;
              call.screenSharerId = undefined;
              call.screenSharerName = undefined;
            }

            if (call.participants.length === 0) {
              activeCalls.delete(callId);
              broadcast({ type: 'call:ended', payload: { callId } });
            } else {
              const remainingIds = call.participants.map((p) => p.userId);
              broadcast(
                { type: 'call:participant-left', payload: { callId, userId } },
                remainingIds
              );
            }
          }
          break;
        }

        case 'call:end': {
          const { callId } = event.payload;
          const call = activeCalls.get(callId);
          if (call) {
            const pIds = call.participants.map((p) => p.userId);
            activeCalls.delete(callId);
            broadcast({ type: 'call:ended', payload: { callId } }, pIds);
          }
          break;
        }

        case 'call:invite': {
          const { callId, invitedUserId, callerName } = event.payload;
          const call = activeCalls.get(callId);
          if (call) {
            call.type = 'conference'; // Upgrade to conference when 3rd party invited
            sendToUser(invitedUserId, {
              type: 'call:incoming',
              payload: { call },
            });
          }
          break;
        }

        case 'call:toggle-mute': {
          const { callId, userId, isMuted } = event.payload;
          const call = activeCalls.get(callId);
          if (call) {
            const p = call.participants.find((item) => item.userId === userId);
            if (p) {
              p.isMuted = isMuted;
              const pIds = call.participants.map((item) => item.userId);
              broadcast(
                {
                  type: 'call:participant-update',
                  payload: { callId, userId, isMuted },
                },
                pIds
              );
            }
          }
          break;
        }

        case 'call:toggle-screen': {
          const { callId, userId, isSharing } = event.payload;
          const call = activeCalls.get(callId);
          if (call) {
            const p = call.participants.find((item) => item.userId === userId);
            if (p) {
              p.isScreenSharing = isSharing;
              call.isScreenSharing = isSharing;
              call.screenSharerId = isSharing ? userId : undefined;
              call.screenSharerName = isSharing ? p.displayName : undefined;

              const pIds = call.participants.map((item) => item.userId);
              broadcast(
                {
                  type: 'call:participant-update',
                  payload: { callId, userId, isScreenSharing: isSharing },
                },
                pIds
              );
            }
          }
          break;
        }

        case 'call:signal': {
          const { callId, targetUserId, fromUserId, signal } = event.payload;
          if (targetUserId) {
            sendToUser(targetUserId, {
              type: 'call:signal',
              payload: { callId, fromUserId, signal },
            });
          } else {
            const call = activeCalls.get(callId);
            if (call) {
              const otherIds = call.participants
                .filter((p) => p.userId !== fromUserId)
                .map((p) => p.userId);
              broadcast(
                {
                  type: 'call:signal',
                  payload: { callId, fromUserId, signal },
                },
                otherIds
              );
            }
          }
          break;
        }

        case 'call:join-room': {
          const { roomId, user } = event.payload;
          const room = conferenceRooms.find((r) => r.id === roomId);
          if (room) {
            const alreadyIn = room.participants.some((p) => p.userId === user.id);
            if (!alreadyIn) {
              room.participants.push({
                userId: user.id,
                displayName: user.displayName,
                avatarColor: user.avatarColor,
                isMuted: false,
                isScreenSharing: false,
                joinedAt: Date.now(),
              });
              room.activeParticipantsCount = room.participants.length;
              room.isLive = room.activeParticipantsCount > 0;
            }

            // Sync room state to all clients
            broadcast({
              type: 'call:rooms-update',
              payload: { rooms: conferenceRooms },
            });
          }
          break;
        }

        case 'call:leave-room': {
          const { roomId, userId } = event.payload;
          const room = conferenceRooms.find((r) => r.id === roomId);
          if (room) {
            room.participants = room.participants.filter((p) => p.userId !== userId);
            room.activeParticipantsCount = room.participants.length;
            room.isLive = room.activeParticipantsCount > 0;

            broadcast({
              type: 'call:rooms-update',
              payload: { rooms: conferenceRooms },
            });
          }
          break;
        }
      }
    } catch (err) {
      console.error('[Server WS] Error handling socket message:', err);
    }
  });

  ws.on('close', () => {
    const session = activeSessions.get(sessionId);
    if (session) {
      const user = session.user;
      activeSessions.delete(sessionId);

      let hasOtherSession = false;
      for (const s of activeSessions.values()) {
        if (s.user.id === user.id) {
          hasOtherSession = true;
          break;
        }
      }

      if (!hasOtherSession) {
        user.status = 'offline';
        user.lastSeen = Date.now();
        registeredUsers.set(user.id, user);

        broadcast({
          type: 'user:status',
          payload: {
            userId: user.id,
            status: 'offline',
            lastSeen: user.lastSeen,
          },
        });

        // Clean up from active calls
        for (const [callId, call] of activeCalls.entries()) {
          const inCall = call.participants.some((p) => p.userId === user.id);
          if (inCall) {
            call.participants = call.participants.filter((p) => p.userId !== user.id);
            if (call.participants.length === 0) {
              activeCalls.delete(callId);
              broadcast({ type: 'call:ended', payload: { callId } });
            } else {
              broadcast(
                { type: 'call:participant-left', payload: { callId, userId: user.id } },
                call.participants.map((p) => p.userId)
              );
            }
          }
        }
      }
    }
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Staff Portal & Communication Server running on http://localhost:${PORT}`);
  });
}

startServer();
