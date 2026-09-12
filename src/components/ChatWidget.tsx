import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useChat } from '../context/ChatContext';
import { MessageItem } from './MessageItem';
import { CreateGroupModal } from './CreateGroupModal';
import { MessageAttachment } from '../types/chat';
import {
  MessageSquare,
  X,
  Phone,
  PhoneOff,
  Send,
  Users,
  Search,
  Plus,
  ArrowLeft,
  Trash2,
  Minimize2,
  CheckCheck,
  Pin,
  PinOff,
  Paperclip,
  FileText,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Mic,
  MicOff,
  ScreenShare,
  Sparkles,
  User,
  Radio,
  ExternalLink,
} from 'lucide-react';

const QUICK_EMOJIS = ['👍', '👋', '🚀', '✅', '💡', '🔥'];

interface StagedAttachment {
  id: string;
  file: File;
  name: string;
  size: number;
  type: 'image' | 'document' | 'file';
  previewUrl: string;
}

export const ChatWidget: React.FC = () => {
  const {
    currentUser,
    users,
    groups,
    conversations,
    activeConversation,
    activeConversationId,
    setActiveConversationId,
    messages,
    sendMessage,
    setTyping,
    clearConversation,
    startVoiceCall,
    unreadTotal,
    isChatWidgetOpen,
    toggleChatWidget,
    closeChatWidget,
    markMessagesAsRead,
    togglePinMessage,
    // Calling & Voice integration
    activeCall,
    isMuted,
    toggleMute,
    isScreenSharing,
    toggleScreenShare,
    endCall,
    leaveCall,
    conferenceRooms,
    joinConferenceRoom,
    callDurationSeconds,
    setIsCallModalOpen,
  } = useChat();

  // Widget view switch: 'chats' or 'calls'
  const [widgetTab, setWidgetTab] = useState<'chats' | 'calls'>('chats');
  
  // Conversation list filter: 'all' | 'staff' | 'clients' | 'groups'
  const [activeTab, setActiveTab] = useState<'all' | 'staff' | 'clients' | 'groups'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  // File Attachments staging
  const [stagedAttachments, setStagedAttachments] = useState<StagedAttachment[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Active Pinned Message Carousel index
  const [activePinnedIndex, setActivePinnedIndex] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Filter messages for currently selected chat
  const chatMessages = messages.filter((m) => {
    if (!activeConversationId) return false;
    if (m.isGroup) {
      return m.groupId === activeConversationId;
    }
    return (
      (m.senderId === currentUser?.id && m.conversationId === activeConversationId) ||
      (m.senderId === activeConversationId && m.conversationId === currentUser?.id)
    );
  });

  // Pinned messages for active conversation
  const activeGroup = groups.find((g) => g.id === activeConversationId);
  const pinnedMessages = chatMessages.filter(
    (m) => m.isPinned || (activeGroup?.pinnedMessageIds && activeGroup.pinnedMessageIds.includes(m.id))
  );

  // Auto-scroll on new message
  useEffect(() => {
    if (isChatWidgetOpen && activeConversationId && widgetTab === 'chats') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages.length, isChatWidgetOpen, activeConversationId, widgetTab]);

  // Read receipts: Mark messages as read when viewing active chat
  useEffect(() => {
    if (isChatWidgetOpen && activeConversationId && widgetTab === 'chats') {
      markMessagesAsRead(activeConversationId);
    }
  }, [isChatWidgetOpen, activeConversationId, chatMessages.length, markMessagesAsRead, widgetTab]);

  // Clean up typing indicator on conversation change or unmount
  useEffect(() => {
    return () => {
      setTyping(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [activeConversationId]);

  // Keep activePinnedIndex bounded
  useEffect(() => {
    if (pinnedMessages.length === 0) {
      setActivePinnedIndex(0);
    } else if (activePinnedIndex >= pinnedMessages.length) {
      setActivePinnedIndex(pinnedMessages.length - 1);
    }
  }, [pinnedMessages.length, activePinnedIndex]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    if (val.trim().length > 0) {
      setTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(false);
      }, 2000);
    } else {
      setTyping(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  // Convert File to base64 data URL
  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    processFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const processFiles = (files: File[]) => {
    const newItems: StagedAttachment[] = files.map((file) => {
      const isImage = file.type.startsWith('image/');
      return {
        id: `stage_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        file,
        name: file.name,
        size: file.size,
        type: isImage ? 'image' : 'document',
        previewUrl: isImage ? URL.createObjectURL(file) : '',
      };
    });
    setStagedAttachments((prev) => [...prev, ...newItems]);
  };

  const removeStagedAttachment = (id: string) => {
    setStagedAttachments((prev) => {
      const item = prev.find((a) => a.id === id);
      if (item && item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((a) => a.id !== id);
    });
  };

  // Handle Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const hasText = inputText.trim().length > 0;
    const hasFiles = stagedAttachments.length > 0;
    if (!hasText && !hasFiles) return;

    setIsSending(true);
    try {
      let finalAttachments: MessageAttachment[] | undefined = undefined;
      if (hasFiles) {
        finalAttachments = await Promise.all(
          stagedAttachments.map(async (staged) => {
            const dataUrl = await readFileAsDataUrl(staged.file);
            return {
              id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              name: staged.name,
              type: staged.type,
              url: dataUrl,
              size: staged.size,
              mimeType: staged.file.type,
            };
          })
        );
      }

      const text = inputText;
      setInputText('');
      setStagedAttachments([]);
      setTyping(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      await sendMessage(text, finalAttachments);
    } catch (err) {
      console.error('Failed to send message with attachments:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleStartCall = () => {
    if (!activeConversation) return;

    if (activeConversation.isGroup) {
      startVoiceCall({
        groupId: activeConversation.id,
        isConference: true,
        title: `${activeConversation.name} Conference`,
      });
    } else {
      startVoiceCall({
        recipientId: activeConversation.id,
        isConference: false,
        title: `Call with ${activeConversation.name}`,
      });
    }
  };

  // Scroll to a specific message and highlight it
  const handleJumpToMessage = (messageId: string) => {
    const el = document.getElementById(`message-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-amber-400', 'ring-offset-2', 'ring-offset-slate-900', 'transition-all');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-amber-400', 'ring-offset-2', 'ring-offset-slate-900');
      }, 2000);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatCallTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Counts for tabs
  const staffConversations = conversations.filter((c) => !c.isGroup && (c.userType === 'staff' || !c.userType));
  const clientConversations = conversations.filter((c) => !c.isGroup && c.userType === 'client');
  const groupConversations = conversations.filter((c) => c.isGroup);

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.organization && c.organization.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;

    if (activeTab === 'staff') return !c.isGroup && (c.userType === 'staff' || !c.userType);
    if (activeTab === 'clients') return !c.isGroup && c.userType === 'client';
    if (activeTab === 'groups') return c.isGroup;
    return true;
  });

  const onlineStaffCount = staffConversations.filter((c) => c.status === 'online').length;
  const onlineClientCount = clientConversations.filter((c) => c.status === 'online').length;

  // Resolve typing user names for active conversation
  const typingNames = (activeConversation?.typingUsers || []).map((uid) => {
    const u = users.find((user) => user.id === uid);
    return u ? u.displayName : 'Colleague';
  });

  const currentPinnedMessage = pinnedMessages[activePinnedIndex];

  return (
    <>
      {/* Floating Chat Button with Smooth Animation */}
      <motion.button
        id="staff-chat-fab"
        onClick={toggleChatWidget}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xl shadow-emerald-950/50 hover:shadow-emerald-900/60 transition-colors duration-200 border-2 border-emerald-400/40"
        title="Open Team & Client Chat"
      >
        <AnimatePresence mode="wait">
          {isChatWidgetOpen ? (
            <motion.div
              key="close-icon"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="chat-icon"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative flex items-center justify-center"
            >
              <MessageSquare className="w-6 h-6" />
              {unreadTotal > 0 && (
                <span className="absolute -top-3 -right-3 flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-rose-500 text-[11px] font-extrabold text-white border-2 border-slate-900 shadow">
                  {unreadTotal > 9 ? '9+' : unreadTotal}
                </span>
              )}
              {/* Active Call Indicator Ring on FAB */}
              {activeCall ? (
                <span className="absolute -inset-2 rounded-full border-2 border-emerald-300 animate-ping opacity-75 pointer-events-none" />
              ) : (
                <span className="absolute -inset-2 rounded-full border-2 border-emerald-400/40 animate-ping opacity-60 pointer-events-none" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Floating Chat Panel with Smooth Entrance & Exit Animations */}
      <AnimatePresence>
        {isChatWidgetOpen && (
          <motion.div
            key="staff-chat-panel"
            id="staff-chat-panel"
            initial={{ opacity: 0, scale: 0.93, y: 35 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 25, transition: { duration: 0.18, ease: 'easeIn' } }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-24 right-6 z-40 flex flex-col w-[440px] max-w-[calc(100vw-32px)] h-[620px] max-h-[calc(100vh-120px)] bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/70 backdrop-blur-xl overflow-hidden"
          >
            {/* =========================================================
                MAIN VIEW: CHATS or CALLS SWITCHER
               ========================================================= */}
            {widgetTab === 'calls' ? (
              /* =====================================
                 Dedicated Calling & Voice Hub View
                 ===================================== */
              <div className="flex flex-col h-full bg-slate-950/60">
                {/* Calls Header */}
                <div className="flex items-center justify-between px-4 py-3.5 bg-slate-900 border-b border-slate-800">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white leading-none">Voice & Conference Hub</h3>
                      <p className="text-[10px] text-emerald-400 mt-0.5 flex items-center gap-1 font-medium">
                        <Radio className="w-2.5 h-2.5 animate-pulse" />
                        Live WebRTC Audio & Screen Sharing
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={closeChatWidget}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Calls Body Stream */}
                <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
                  {/* Current Active Call Card */}
                  {activeCall ? (
                    <div className="p-3.5 rounded-xl bg-gradient-to-b from-emerald-950/40 to-slate-900 border border-emerald-500/40 shadow-lg shadow-emerald-950/30">
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                          <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                            {activeCall.status === 'connected' ? 'Call in Progress' : 'Connecting...'}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-semibold text-emerald-200 bg-emerald-900/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          {formatCallTime(callDurationSeconds)}
                        </span>
                      </div>

                      <p className="text-sm font-semibold text-white truncate mb-1">
                        {activeCall.title || 'Live Voice Session'}
                      </p>
                      <p className="text-xs text-slate-400 mb-3">
                        {activeCall.participants.length} participant{activeCall.participants.length !== 1 ? 's' : ''} connected
                      </p>

                      {/* Active Call Quick Controls */}
                      <div className="flex items-center gap-2 pt-1 border-t border-emerald-500/20">
                        <button
                          type="button"
                          onClick={toggleMute}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition ${
                            isMuted
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
                              : 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                          <span>{isMuted ? 'Unmute' : 'Mute'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={toggleScreenShare}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition ${
                            isScreenSharing
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30'
                              : 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          <ScreenShare className="w-3.5 h-3.5" />
                          <span>{isScreenSharing ? 'Sharing' : 'Share'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={endCall}
                          className="flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition shadow-sm"
                          title="End or Leave Call"
                        >
                          <PhoneOff className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {/* Conference Rooms Section */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Live Conference Rooms
                      </span>
                      <span className="text-[10px] text-slate-500">{conferenceRooms.length} available</span>
                    </div>

                    <div className="space-y-2">
                      {conferenceRooms.map((room) => (
                        <div
                          key={room.id}
                          className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between"
                        >
                          <div className="min-w-0 pr-2">
                            <h4 className="text-xs font-semibold text-white truncate">{room.name}</h4>
                            <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{room.description}</p>
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium mt-1">
                              <Users className="w-2.5 h-2.5" />
                              {room.activeParticipantsCount} in room
                            </span>
                          </div>

                          <button
                            type="button"
                            id={`join-room-${room.id}`}
                            onClick={() => joinConferenceRoom(room.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold shrink-0 transition flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Join</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Direct Voice Calling Directory */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Quick Call Staff & Clients
                      </span>
                      <span className="text-[10px] text-slate-500">1-click direct call</span>
                    </div>

                    <div className="space-y-1.5">
                      {conversations
                        .filter((c) => !c.isGroup)
                        .map((c) => {
                          const isClient = c.userType === 'client';
                          return (
                            <div
                              key={c.id}
                              className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:bg-slate-850 transition"
                            >
                              <div className="flex items-center space-x-2.5 min-w-0">
                                <div className={`relative w-8 h-8 rounded-lg bg-gradient-to-tr ${c.avatarColor} flex items-center justify-center font-bold text-white text-xs shrink-0 shadow`}>
                                  {c.name[0]}
                                  <span
                                    className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-slate-900 ${
                                      c.status === 'online' ? 'bg-emerald-500' : 'bg-slate-500'
                                    }`}
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <h5 className="text-xs font-semibold text-white truncate">{c.name}</h5>
                                    {isClient ? (
                                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                                        Client
                                      </span>
                                    ) : (
                                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                                        Staff
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-400 truncate">
                                    {isClient ? c.organization || 'External Account' : 'Internal Team'}
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                id={`quick-call-${c.id}`}
                                onClick={() => {
                                  startVoiceCall({
                                    recipientId: c.id,
                                    isConference: false,
                                    title: `Call with ${c.name}`,
                                  });
                                }}
                                className="p-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-300 border border-emerald-500/30 transition shrink-0"
                                title={`Start voice call with ${c.name}`}
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>
            ) : activeConversation ? (
              /* =========================================================
                 ACTIVE CONVERSATION THREAD VIEW (CHATS TAB)
                 ========================================================= */
              <div
                className="flex flex-col h-full relative"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {/* Drag and Drop Backdrop Overlay */}
                {isDraggingOver && (
                  <div className="absolute inset-0 z-30 bg-emerald-950/90 backdrop-blur-sm border-2 border-dashed border-emerald-400 rounded-2xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-150">
                    <Paperclip className="w-10 h-10 text-emerald-400 animate-bounce mb-2" />
                    <p className="text-sm font-bold text-white">Drop files to attach to chat</p>
                    <p className="text-xs text-emerald-200 mt-1">Images and documents supported</p>
                  </div>
                )}

                {/* Thread Header */}
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900 border-b border-slate-800">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <button
                      onClick={() => setActiveConversationId(null)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      title="Back to conversations list"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div className={`relative w-8 h-8 rounded-xl bg-gradient-to-tr ${activeConversation.avatarColor} flex items-center justify-center font-bold text-white text-xs shrink-0 shadow`}>
                      {activeConversation.isGroup ? <Users className="w-4 h-4 text-white/90" /> : activeConversation.name[0]}
                      {!activeConversation.isGroup && (
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
                            activeConversation.status === 'online'
                              ? 'bg-emerald-500'
                              : activeConversation.status === 'away'
                              ? 'bg-amber-500'
                              : 'bg-slate-500'
                          }`}
                        />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-xs md:text-sm font-semibold text-white truncate">
                          {activeConversation.name}
                        </h3>
                        {/* Client vs Staff Header Badge */}
                        {!activeConversation.isGroup && (
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold border uppercase tracking-wider shrink-0 ${
                              activeConversation.userType === 'client'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/35'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35'
                            }`}
                          >
                            {activeConversation.userType === 'client'
                              ? `Client • ${activeConversation.organization || 'External'}`
                              : 'Staff'}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">
                        {typingNames.length > 0 ? (
                          <span className="text-emerald-400 font-medium animate-pulse">
                            {typingNames.length === 1
                              ? `${typingNames[0]} is typing...`
                              : `${typingNames.join(', ')} are typing...`}
                          </span>
                        ) : activeConversation.isGroup ? (
                          `${activeConversation.memberCount || 3} members`
                        ) : activeConversation.status === 'online' ? (
                          'Active now'
                        ) : (
                          'Last seen recently'
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Header Actions */}
                  <div className="flex items-center space-x-1">
                    {/* Call Button */}
                    <button
                      id="chat-start-call-btn"
                      onClick={handleStartCall}
                      className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition"
                      title={activeConversation.isGroup ? 'Start Group Conference Call' : 'Start 1-on-1 Voice Call'}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Call</span>
                    </button>

                    {/* Clear Chat */}
                    <button
                      onClick={() => {
                        if (confirm('Clear this chat history?')) {
                          clearConversation(activeConversation.id, activeConversation.isGroup);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                      title="Clear chat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Minimize Panel */}
                    <button
                      onClick={closeChatWidget}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      title="Close"
                    >
                      <Minimize2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* PINNED MESSAGES BANNER FOR GROUP CHAT */}
                {activeConversation.isGroup && pinnedMessages.length > 0 && currentPinnedMessage && (
                  <div className="px-3 py-1.5 bg-amber-950/30 border-b border-amber-500/30 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="p-1 rounded bg-amber-500/20 text-amber-400 shrink-0">
                        <Pin className="w-3 h-3 fill-amber-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                            Pinned Message {pinnedMessages.length > 1 ? `(${activePinnedIndex + 1}/${pinnedMessages.length})` : ''}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate font-semibold">
                            • {currentPinnedMessage.senderName}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-200 truncate cursor-pointer hover:text-amber-200" onClick={() => handleJumpToMessage(currentPinnedMessage.id)}>
                          {currentPinnedMessage.content || 'Attached File'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Jump to message button */}
                      <button
                        type="button"
                        onClick={() => handleJumpToMessage(currentPinnedMessage.id)}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition"
                        title="Jump to message"
                      >
                        Jump
                      </button>

                      {/* Carousel controls if multiple pinned messages */}
                      {pinnedMessages.length > 1 && (
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() => setActivePinnedIndex((prev) => (prev > 0 ? prev - 1 : pinnedMessages.length - 1))}
                            className="p-1 rounded text-slate-400 hover:text-white"
                            title="Previous pinned message"
                          >
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setActivePinnedIndex((prev) => (prev < pinnedMessages.length - 1 ? prev + 1 : 0))}
                            className="p-1 rounded text-slate-400 hover:text-white"
                            title="Next pinned message"
                          >
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {/* Unpin button */}
                      <button
                        type="button"
                        onClick={() => togglePinMessage(currentPinnedMessage.id, activeConversation.id)}
                        className="p-1 rounded text-slate-400 hover:text-amber-400"
                        title="Unpin this message"
                      >
                        <PinOff className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Message Stream */}
                <div
                  ref={messageContainerRef}
                  className="flex-1 p-3 overflow-y-auto space-y-1 bg-slate-950/40"
                >
                  {chatMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400">
                      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-emerald-400 mb-2">
                        <MessageSquare className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-medium text-slate-300">No messages yet</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Send a message, attach documents, or click Call to converse live.
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((msg, index) => {
                      const prevMsg = chatMessages[index - 1];
                      const isSequential = prevMsg && prevMsg.senderId === msg.senderId;
                      return (
                        <MessageItem
                          key={msg.id}
                          message={msg}
                          isSequential={!!isSequential}
                        />
                      );
                    })
                  )}

                  {/* Real-time Typing Indicator with Bouncing Dots */}
                  {typingNames.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 my-1 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-emerald-300 w-fit animate-in fade-in-50 duration-200">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="font-medium text-emerald-300">
                        {typingNames.length === 1
                          ? `${typingNames[0]} is typing...`
                          : `${typingNames.join(', ')} are typing...`}
                      </span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Staged File Attachments Tray */}
                {stagedAttachments.length > 0 && (
                  <div className="px-3 py-2 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2 overflow-x-auto">
                    {stagedAttachments.map((att) => (
                      <div
                        key={att.id}
                        className="relative flex items-center gap-2 p-1.5 pr-6 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white max-w-[200px] shrink-0"
                      >
                        {att.type === 'image' && att.previewUrl ? (
                          <img
                            src={att.previewUrl}
                            alt={att.name}
                            className="w-7 h-7 object-cover rounded"
                          />
                        ) : (
                          <div className="p-1 rounded bg-emerald-500/20 text-emerald-400">
                            <FileText className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium truncate">{att.name}</p>
                          <p className="text-[9px] text-slate-400">{formatFileSize(att.size)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeStagedAttachment(att.id)}
                          className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white"
                          title="Remove file"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Message Input Toolbar */}
                <div className="p-2.5 bg-slate-900 border-t border-slate-800">
                  {/* Quick Emoji Bar */}
                  <div className="flex items-center space-x-1.5 mb-2 px-1">
                    {QUICK_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setInputText((prev) => prev + emoji)}
                        className="p-1 text-sm hover:scale-125 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleSend} className="flex items-center space-x-2">
                    {/* Hidden File Input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.zip"
                      className="hidden"
                    />

                    {/* Paperclip Attachment Button */}
                    <button
                      type="button"
                      id="attach-file-btn"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition shrink-0"
                      title="Attach image or document"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>

                    <input
                      id="chat-message-input"
                      type="text"
                      placeholder={stagedAttachments.length > 0 ? "Add a caption..." : "Type a message or drop files..."}
                      value={inputText}
                      onChange={handleInputChange}
                      onBlur={() => setTyping(false)}
                      className="flex-1 px-3 py-2 text-xs md:text-sm bg-slate-800 border border-slate-700/80 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                    />

                    <button
                      id="chat-message-send-btn"
                      type="submit"
                      disabled={(!inputText.trim() && stagedAttachments.length === 0) || isSending}
                      className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 disabled:hover:bg-emerald-600 transition shadow-md shadow-emerald-950/40 shrink-0"
                      title="Send message"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              /* =========================================================
                 CONVERSATIONS LIST VIEW (CHATS TAB)
                 ========================================================= */
              <div className="flex flex-col h-full">
                {/* List Header */}
                <div className="flex items-center justify-between px-4 py-3.5 bg-slate-900 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <div>
                      <h3 className="text-sm font-semibold text-white leading-none">Messages & Channels</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        <span className="text-emerald-400 font-semibold">{onlineStaffCount} staff</span> •{' '}
                        <span className="text-amber-400 font-semibold">{onlineClientCount} clients</span> online
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    {/* Create Group Button */}
                    <button
                      id="create-group-btn"
                      onClick={() => setShowCreateGroup(true)}
                      className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                      title="Create Group Chat"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                      <span>New Group</span>
                    </button>

                    <button
                      onClick={closeChatWidget}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Search & Tabs (Staff vs Clients vs Groups vs All) */}
                <div className="p-3 bg-slate-900/60 border-b border-slate-800 space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search staff, clients & channels..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Filter Pills with Staff & Client Differentiation */}
                  <div className="flex p-0.5 bg-slate-800/80 rounded-lg text-xs font-medium text-slate-400">
                    <button
                      onClick={() => setActiveTab('all')}
                      className={`flex-1 py-1 text-center rounded-md transition ${
                        activeTab === 'all' ? 'bg-slate-700 text-white font-semibold shadow' : 'hover:text-slate-200'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setActiveTab('staff')}
                      className={`flex-1 py-1 text-center rounded-md transition ${
                        activeTab === 'staff' ? 'bg-emerald-600/30 text-emerald-300 font-semibold shadow border border-emerald-500/40' : 'hover:text-slate-200'
                      }`}
                    >
                      Staff ({staffConversations.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('clients')}
                      className={`flex-1 py-1 text-center rounded-md transition ${
                        activeTab === 'clients' ? 'bg-amber-600/30 text-amber-300 font-semibold shadow border border-amber-500/40' : 'hover:text-slate-200'
                      }`}
                    >
                      Clients ({clientConversations.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('groups')}
                      className={`flex-1 py-1 text-center rounded-md transition ${
                        activeTab === 'groups' ? 'bg-slate-700 text-white font-semibold shadow' : 'hover:text-slate-200'
                      }`}
                    >
                      Groups ({groupConversations.length})
                    </button>
                  </div>
                </div>

                {/* Conversations Scrollable List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {filteredConversations.length === 0 ? (
                    <p className="text-center text-xs text-slate-500 py-8">No chats found in this category.</p>
                  ) : (
                    filteredConversations.map((c) => {
                      const lastMsgText =
                        c.lastMessage?.content || c.lastMessage?.decryptedContent || 'No messages yet';
                      const isClient = c.userType === 'client';

                      return (
                        <div
                          key={c.id}
                          id={`chat-contact-${c.id}`}
                          onClick={() => setActiveConversationId(c.id)}
                          className={`flex items-center p-2.5 rounded-xl hover:bg-slate-800/80 cursor-pointer transition group border ${
                            isClient ? 'border-amber-500/20 bg-amber-950/10' : 'border-transparent'
                          }`}
                        >
                          {/* Avatar with Status Dot */}
                          <div className={`relative w-10 h-10 rounded-xl bg-gradient-to-tr ${c.avatarColor} flex items-center justify-center font-bold text-white text-sm shrink-0 shadow`}>
                            {c.isGroup ? <Users className="w-5 h-5 text-white/90" /> : c.name[0]}
                            {!c.isGroup && (
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
                                  c.status === 'online'
                                    ? isClient
                                      ? 'bg-amber-400 shadow-xs shadow-amber-400/50'
                                      : 'bg-emerald-500 shadow-xs shadow-emerald-500/50'
                                    : c.status === 'away'
                                    ? 'bg-amber-500'
                                    : 'bg-slate-500'
                                }`}
                                title={`Status: ${c.status || 'offline'}`}
                              />
                            )}
                          </div>

                          {/* Details */}
                          <div className="ml-3 min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <h4 className="text-xs font-semibold text-white truncate group-hover:text-emerald-300 transition">
                                  {c.name}
                                </h4>

                                {/* Client vs Staff Role Badge */}
                                {!c.isGroup ? (
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 border ${
                                      isClient
                                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/35'
                                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35'
                                    }`}
                                  >
                                    {isClient ? `Client` : 'Staff'}
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60 shrink-0">
                                    {c.memberCount || 3} members
                                  </span>
                                )}
                              </div>

                              {c.lastMessage && (
                                <span className="text-[10px] text-slate-500 shrink-0">
                                  {new Date(c.lastMessage.timestamp).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              )}
                            </div>

                            {/* Organization sublabel for clients */}
                            {isClient && c.organization && (
                              <p className="text-[10px] text-amber-400/80 font-medium truncate">
                                {c.organization}
                              </p>
                            )}

                            <div className="flex items-center justify-between mt-0.5">
                              <p className="text-[11px] text-slate-400 truncate">
                                {c.typingUsers.length > 0 ? (
                                  <span className="text-emerald-400 font-medium inline-flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Typing...
                                  </span>
                                ) : (
                                  lastMsgText
                                )}
                              </p>

                              {/* Unread badge */}
                              {c.unreadCount > 0 && (
                                <span className="ml-2 flex items-center justify-center min-w-[18px] h-4.5 px-1 rounded-full bg-emerald-500 text-[10px] font-extrabold text-slate-950 shrink-0">
                                  {c.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* =========================================================
                BOTTOM SWITCHER WIDGET: CHATS vs CALLS
               ========================================================= */}
            <div className="px-3 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-around shrink-0">
              {/* Chats Tab Button */}
              <button
                type="button"
                id="switch-to-chats-btn"
                onClick={() => setWidgetTab('chats')}
                className={`relative flex items-center gap-2 py-1.5 px-6 rounded-xl text-xs font-semibold transition-all ${
                  widgetTab === 'chats'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chats</span>
                {unreadTotal > 0 && widgetTab !== 'chats' && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>

              {/* Calls Tab Button */}
              <button
                type="button"
                id="switch-to-calls-btn"
                onClick={() => setWidgetTab('calls')}
                className={`relative flex items-center gap-2 py-1.5 px-6 rounded-xl text-xs font-semibold transition-all ${
                  widgetTab === 'calls'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Calls</span>
                {activeCall && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
      />
    </>
  );
};
