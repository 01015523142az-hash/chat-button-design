import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { MessageItem } from './MessageItem';
import { Message } from '../types/chat';
import {
  ShieldCheck,
  Lock,
  Users,
  Send,
  Trash2,
  Info,
  Timer,
  Smile,
  CheckCircle2,
  Radio,
  Clock,
  Sparkles,
  ArrowDown,
} from 'lucide-react';

interface ChatAreaProps {
  onOpenSafetyNumber: () => void;
  onOpenGroupInfo: () => void;
  onInspectMessage: (msg: Message) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  onOpenSafetyNumber,
  onOpenGroupInfo,
  onInspectMessage,
}) => {
  const {
    currentUser,
    activeConversation,
    activeConversationId,
    messages,
    groups,
    sendMessage,
    setTyping,
    clearConversation,
    isE2eeVerified,
    markMessagesAsRead,
  } = useChat();

  const [inputVal, setInputVal] = useState('');
  const [ephemeralTimer, setEphemeralTimer] = useState<number | undefined>(undefined);
  const [showTimerMenu, setShowTimerMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  // Filter messages for current active chat
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

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length]);

  // Read receipts: Mark messages as read when viewing conversation
  useEffect(() => {
    if (activeConversationId) {
      markMessagesAsRead(activeConversationId);
    }
  }, [activeConversationId, chatMessages.length, markMessagesAsRead]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputVal(e.target.value);

    // Emit typing indicator
    setTyping(true);
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = window.setTimeout(() => {
      setTyping(false);
    }, 2000);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }
    setTyping(false);

    const textToSend = inputVal;
    setInputVal('');
    await sendMessage(textToSend, ephemeralTimer);
  };

  const handleClear = () => {
    if (!activeConversationId || !activeConversation) return;
    const confirmText = activeConversation.isGroup
      ? `Clear all messages in "${activeConversation.name}" for all members?`
      : `Clear this conversation with ${activeConversation.name}?`;

    if (confirm(confirmText)) {
      clearConversation(activeConversationId, activeConversation.isGroup);
    }
  };

  const addQuickEmoji = (emoji: string) => {
    setInputVal((prev) => prev + emoji);
  };

  if (!activeConversation) {
    return (
      <div
        id="chat-area-empty-state"
        className="flex-1 bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-400 select-none"
      >
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 mb-4 shadow-xl">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-base font-bold text-slate-200">
          Select or Start an Encrypted Conversation
        </h2>
        <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed">
          All messages and group broadcasts are end-to-end encrypted using Web Crypto ECDH key exchange and AES-GCM-256 cipher streams.
        </p>
      </div>
    );
  }

  const activeGroup = activeConversation.isGroup
    ? groups.find((g) => g.id === activeConversation.id)
    : null;

  return (
    <main
      id="chat-area-main"
      className="flex-1 bg-slate-950 flex flex-col h-full overflow-hidden"
    >
      {/* 1. Chat Header */}
      <div
        id="chat-header"
        className="p-3.5 px-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0 gap-3 z-10 backdrop-blur-md"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div
              className={`w-10 h-10 rounded-full bg-gradient-to-tr ${activeConversation.avatarColor} flex items-center justify-center text-white font-semibold text-sm shadow`}
            >
              {activeConversation.isGroup ? (
                <Users className="w-5 h-5" />
              ) : (
                activeConversation.name.charAt(0).toUpperCase()
              )}
            </div>
            {!activeConversation.isGroup && activeConversation.status && (
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-slate-900 ${
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
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-100 truncate">
                {activeConversation.name}
              </h2>

              {/* End-to-End Encryption Badge */}
              <span
                onClick={onOpenSafetyNumber}
                title="End-to-End Encrypted via Web Crypto. Click to verify safety numbers."
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 cursor-pointer hover:bg-emerald-500/25 transition-colors shrink-0"
              >
                <ShieldCheck className="w-3 h-3" />
                <span>E2EE</span>
              </span>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              {activeConversation.isGroup ? (
                <span className="flex items-center gap-1 font-mono">
                  <Users className="w-3 h-3 text-slate-400" />
                  <span>{activeConversation.memberCount} members</span>
                </span>
              ) : (
                <span className="capitalize font-mono text-[10px]">
                  Status: {activeConversation.status || 'Active'}
                </span>
              )}

              {ephemeralTimer && (
                <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-mono">
                  <Timer className="w-3 h-3" />
                  <span>{ephemeralTimer}s timer</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Disappearing Messages Option */}
          <div className="relative">
            <button
              id="btn-disappearing-timer"
              onClick={() => setShowTimerMenu(!showTimerMenu)}
              title="Disappearing Messages Timer"
              className={`p-2 rounded-xl transition-colors ${
                ephemeralTimer
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Timer className="w-4 h-4" />
            </button>

            {showTimerMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-slate-900 border border-slate-800 rounded-xl p-1.5 shadow-2xl z-30 space-y-1 text-xs font-medium">
                <div className="px-2 py-1 text-[10px] text-slate-400 uppercase font-mono">
                  Disappearing Messages
                </div>
                {[
                  { label: 'Off', val: undefined },
                  { label: '30 seconds', val: 30 },
                  { label: '5 minutes', val: 300 },
                  { label: '1 hour', val: 3600 },
                  { label: '24 hours', val: 86400 },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      setEphemeralTimer(item.val);
                      setShowTimerMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                      ephemeralTimer === item.val
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{item.label}</span>
                    {ephemeralTimer === item.val && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Safety Numbers Trigger */}
          <button
            id="btn-open-safety-number"
            onClick={onOpenSafetyNumber}
            title="Verify Cryptographic Safety Number"
            className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>

          {/* Group Info Trigger */}
          {activeConversation.isGroup && (
            <button
              id="btn-open-group-info"
              onClick={onOpenGroupInfo}
              title="Group Information and Member Keys"
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
            >
              <Info className="w-4 h-4" />
            </button>
          )}

          {/* Clear Chat */}
          <button
            id="btn-clear-chat"
            onClick={handleClear}
            title="Clear Chat History (Both sides)"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Message Stream */}
      <div
        id="message-stream-scroll-container"
        className="flex-1 overflow-y-auto p-4 md:px-6 space-y-1"
      >
        {/* Top Encryption Security Notice */}
        <div className="max-w-md mx-auto my-3 bg-slate-900/60 border border-emerald-500/20 rounded-xl p-3 text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 font-mono">
            <Lock className="w-3.5 h-3.5" />
            <span>End-to-End Encrypted Relay</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Messages in this {activeConversation.isGroup ? 'group' : 'chat'} are secured with end-to-end encryption. No third party or server can read your communication.
          </p>
        </div>

        {chatMessages.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs space-y-1">
            <p>No messages in this conversation yet.</p>
            <p className="text-[11px] text-slate-400">
              Send a message below to establish the encrypted session.
            </p>
          </div>
        ) : (
          chatMessages.map((msg, idx) => {
            const prevMsg = chatMessages[idx - 1];
            const isSequential = prevMsg?.senderId === msg.senderId && msg.timestamp - (prevMsg?.timestamp || 0) < 60000;
            return (
              <MessageItem
                key={msg.id}
                message={msg}
                isSequential={isSequential}
                onInspect={onInspectMessage}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Typing Indicator Banner */}
      {activeConversation.typingUsers && activeConversation.typingUsers.length > 0 && (
        <div className="px-5 py-1 text-[11px] text-emerald-400 font-mono animate-pulse flex items-center gap-1.5 shrink-0 bg-slate-950/80">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>{activeConversation.typingUsers.join(', ')} is typing…</span>
        </div>
      )}

      {/* 4. Message Input Bar */}
      <div className="p-3 md:p-4 bg-slate-900/90 border-t border-slate-800 shrink-0 space-y-2">
        {/* Quick Emoji Bar */}
        <div className="flex items-center gap-1.5 px-1 overflow-x-auto pb-1 text-sm">
          {['🔒', '🛡️', '🔑', '👍', '❤️', '🔥', '🚀', '✅'].map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => addQuickEmoji(emoji)}
              className="p-1 px-1.5 hover:bg-slate-800 rounded-lg transition-colors select-none text-xs md:text-sm"
            >
              {emoji}
            </button>
          ))}
        </div>

        <form onSubmit={handleSend} className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              id="input-chat-message"
              type="text"
              autoComplete="off"
              placeholder={`Send encrypted message to ${activeConversation.name}…`}
              value={inputVal}
              onChange={handleInputChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-4 pr-10 py-3 text-xs md:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/60 transition-all shadow-inner"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
              <Lock className="w-3.5 h-3.5 text-emerald-500/70" />
            </div>
          </div>

          <button
            id="btn-send-message"
            type="submit"
            disabled={!inputVal.trim()}
            className="w-11 h-11 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:hover:bg-emerald-500 text-slate-950 flex items-center justify-center transition-all shadow-lg shadow-emerald-500/20 shrink-0 cursor-pointer disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-mono">
          <span>Web Crypto AES-GCM 256-bit encrypted payload</span>
          <span>Zero-Knowledge Relay</span>
        </div>
      </div>
    </main>
  );
};
