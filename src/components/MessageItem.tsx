import React, { useState } from 'react';
import { Message, MessageAttachment } from '../types/chat';
import { useChat } from '../context/ChatContext';
import { Clock, Check, CheckCheck, Smile, Plus, Eye, Pin, PinOff, FileText, Download, Image as ImageIcon, ExternalLink, Paperclip, X } from 'lucide-react';

interface MessageItemProps {
  message: Message;
  isSequential: boolean;
}

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '🎉', '😂', '👏', '👀', '🚀'];

export const MessageItem: React.FC<MessageItemProps> = ({ message, isSequential }) => {
  const { currentUser, users, toggleReaction, togglePinMessage } = useChat();
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const isMine = message.senderId === currentUser?.id;

  const senderUser = users.find((u) => u.id === message.senderId);
  const isClientSender = senderUser?.userType === 'client';

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Resolve names of colleagues who have viewed this message
  const colleaguesWhoRead = (message.readBy || [])
    .filter((id) => id !== currentUser?.id)
    .map((id) => {
      const u = users.find((user) => user.id === id);
      return u ? u.displayName : 'Colleague';
    });

  const isReadByColleagues = colleaguesWhoRead.length > 0 || message.status === 'read';

  const renderStatusReceipt = () => {
    if (!isMine) return null;

    if (isReadByColleagues) {
      return (
        <span
          className="inline-flex items-center gap-0.5 text-cyan-300 font-medium"
          title={
            colleaguesWhoRead.length > 0
              ? `Read by: ${colleaguesWhoRead.join(', ')}`
              : 'Read by recipient'
          }
        >
          <CheckCheck className="w-3 h-3 text-cyan-300" />
          <span className="text-[9px] uppercase tracking-wider font-semibold">Read</span>
        </span>
      );
    }

    switch (message.status) {
      case 'sending':
        return (
          <span className="inline-flex items-center gap-0.5 text-emerald-200/60" title="Sending message...">
            <Clock className="w-3 h-3 animate-pulse" />
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center gap-0.5 text-emerald-200/70" title="Sent to server">
            <Check className="w-3 h-3" />
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-0.5 text-emerald-200/80" title="Delivered to colleagues">
            <CheckCheck className="w-3 h-3" />
          </span>
        );
      default:
        return null;
    }
  };

  // Format read receipt label for group chat
  const renderColleagueReadSummary = () => {
    if (!isMine || !message.isGroup || colleaguesWhoRead.length === 0) return null;

    let text = '';
    if (colleaguesWhoRead.length === 1) {
      text = `Read by ${colleaguesWhoRead[0]}`;
    } else if (colleaguesWhoRead.length === 2) {
      text = `Read by ${colleaguesWhoRead[0]} and ${colleaguesWhoRead[1]}`;
    } else {
      text = `Read by ${colleaguesWhoRead[0]} + ${colleaguesWhoRead.length - 1} others`;
    }

    return (
      <div
        className="flex items-center gap-1 text-[10px] text-cyan-300/90 font-medium mt-0.5 pr-1 select-none"
        title={`Viewed by: ${colleaguesWhoRead.join(', ')}`}
      >
        <Eye className="w-2.5 h-2.5 text-cyan-400" />
        <span>{text}</span>
      </div>
    );
  };

  const handleDownload = (att: MessageAttachment) => {
    const link = document.createElement('a');
    link.href = att.url;
    link.download = att.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const contentText = message.content || message.decryptedContent || '';
  const reactionsMap = message.reactions || {};
  const activeReactionKeys = Object.keys(reactionsMap).filter(
    (emoji) => reactionsMap[emoji] && reactionsMap[emoji].length > 0
  );

  return (
    <div
      id={`message-${message.id}`}
      className={`relative flex flex-col ${isMine ? 'items-end' : 'items-start'} ${
        isSequential ? 'mt-1' : 'mt-3.5'
      } group`}
    >
      {/* Sender name & Client/Staff Role Badge for incoming messages */}
      {!isMine && !isSequential && (
        <div className="flex items-center gap-1.5 mb-1 ml-2 select-none">
          <span className={`text-[11px] font-semibold tracking-wide ${isClientSender ? 'text-amber-400' : 'text-emerald-400'}`}>
            {message.senderName}
          </span>
          {isClientSender ? (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
              Client • {senderUser?.organization || 'External'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
              Staff
            </span>
          )}
        </div>
      )}

      {/* Floating Action Bar (Reactions + Pin to Group) on Hover/Tap */}
      <div
        className={`absolute -top-7 ${
          isMine ? 'right-1' : 'left-1'
        } z-20 flex items-center gap-1 bg-slate-900/95 backdrop-blur-md px-1.5 py-0.5 rounded-full border border-slate-700/80 shadow-lg shadow-black/40 transition-all duration-200 ${
          showReactionPicker
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto'
        }`}
      >
        {QUICK_EMOJIS.map((emoji) => {
          const hasReacted = currentUser && reactionsMap[emoji]?.includes(currentUser.id);
          return (
            <button
              key={emoji}
              type="button"
              id={`react-btn-${message.id}-${emoji}`}
              onClick={() => {
                toggleReaction(message.id, emoji);
                setShowReactionPicker(false);
              }}
              className={`w-6 h-6 flex items-center justify-center text-xs rounded-full hover:scale-125 transition-transform ${
                hasReacted ? 'bg-emerald-500/30' : 'hover:bg-slate-800'
              }`}
              title={`React with ${emoji}`}
            >
              {emoji}
            </button>
          );
        })}

        {/* Pin / Unpin button in group conversations */}
        {message.isGroup && message.groupId && (
          <button
            type="button"
            id={`pin-btn-${message.id}`}
            onClick={() => togglePinMessage(message.id, message.groupId!)}
            className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors ml-0.5 border-l border-slate-700/80 pl-1 ${
              message.isPinned
                ? 'text-amber-400 hover:text-amber-300'
                : 'text-slate-400 hover:text-amber-300'
            }`}
            title={message.isPinned ? 'Unpin message' : 'Pin message to top'}
          >
            {message.isPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
          </button>
        )}
      </div>

      <div className="flex items-end gap-1.5 max-w-[85%] md:max-w-[78%] relative">
        {/* Message Bubble */}
        <div
          className={`relative rounded-2xl px-3.5 py-2 text-xs md:text-sm leading-relaxed shadow-sm transition-all ${
            isMine
              ? 'bg-emerald-600 text-white rounded-br-xs shadow-emerald-950/40'
              : isClientSender
              ? 'bg-slate-850 text-slate-100 rounded-bl-xs border border-amber-500/40 shadow-black/20'
              : 'bg-slate-800 text-slate-100 rounded-bl-xs border border-slate-700/60 shadow-black/20'
          }`}
        >
          {/* Pinned Tag if Message is Pinned */}
          {message.isPinned && (
            <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-300 mb-1 pb-1 border-b border-white/10">
              <Pin className="w-3 h-3 fill-amber-300 text-amber-300" />
              <span>Pinned Message</span>
            </div>
          )}

          {/* Text Content */}
          {contentText && (
            <div className="whitespace-pre-wrap break-words font-normal select-text">
              {contentText}
            </div>
          )}

          {/* File Attachments Area */}
          {message.attachments && message.attachments.length > 0 && (
            <div className={`flex flex-col gap-2 ${contentText ? 'mt-2 pt-2 border-t border-white/10' : ''}`}>
              {message.attachments.map((att) => {
                if (att.type === 'image') {
                  return (
                    <div
                      key={att.id}
                      className="relative rounded-xl overflow-hidden border border-white/15 group/att max-w-sm bg-black/40 cursor-pointer"
                      onClick={() => setPreviewImage(att.url)}
                    >
                      <img
                        src={att.url}
                        alt={att.name}
                        referrerPolicy="no-referrer"
                        className="w-full max-h-52 object-cover transition-transform duration-200 group-hover/att:scale-105"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 flex items-center justify-between text-[11px] text-white">
                        <span className="truncate max-w-[200px] font-medium">{att.name}</span>
                        <div className="flex items-center gap-1.5">
                          {att.size && <span className="text-[10px] text-slate-300">{formatFileSize(att.size)}</span>}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(att);
                            }}
                            className="p-1 rounded-full bg-black/50 hover:bg-black/80 text-white"
                            title="Download Image"
                          >
                            <Download className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Document / Generic File attachment
                return (
                  <div
                    key={att.id}
                    className="flex items-center gap-2.5 p-2 rounded-xl bg-black/25 hover:bg-black/35 border border-white/15 transition-all text-left"
                  >
                    <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex-shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate text-white">{att.name}</p>
                      <p className="text-[10px] text-slate-300">{formatFileSize(att.size) || 'Attachment'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownload(att)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition flex-shrink-0"
                      title="Download file"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer: Timestamp & Read Receipts */}
          <div
            className={`flex items-center justify-end gap-1.5 text-[10px] select-none pt-1 mt-0.5 ${
              isMine ? 'text-emerald-100/90' : 'text-slate-400'
            }`}
          >
            <span>{formatTime(message.timestamp)}</span>
            {renderStatusReceipt()}
          </div>
        </div>

        {/* Quick Reaction Trigger Button on Hover (Accessible for Mobile & Desktop) */}
        <button
          type="button"
          id={`quick-react-trigger-${message.id}`}
          onClick={() => setShowReactionPicker((prev) => !prev)}
          className={`p-1 rounded-full text-slate-400 hover:text-emerald-300 hover:bg-slate-800/80 transition opacity-0 group-hover:opacity-100 ${
            showReactionPicker ? 'opacity-100 text-emerald-400 bg-slate-800' : ''
          }`}
          title="Add emoji reaction"
        >
          <Smile className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Read by colleagues indicator in group chat */}
      {renderColleagueReadSummary()}

      {/* Emoji Reaction Badges / Pills */}
      {activeReactionKeys.length > 0 && (
        <div className={`flex flex-wrap items-center gap-1 mt-1.5 ${isMine ? 'justify-end mr-1' : 'justify-start ml-1'}`}>
          {activeReactionKeys.map((emoji) => {
            const userIds = reactionsMap[emoji] || [];
            const hasCurrentUserReacted = currentUser ? userIds.includes(currentUser.id) : false;
            const reactorNames = userIds
              .map((id) => (id === currentUser?.id ? 'You' : users.find((u) => u.id === id)?.displayName || 'Colleague'))
              .join(', ');

            return (
              <button
                key={emoji}
                type="button"
                id={`reaction-pill-${message.id}-${emoji}`}
                onClick={() => toggleReaction(message.id, emoji)}
                title={`Reacted by: ${reactorNames}`}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-all ${
                  hasCurrentUserReacted
                    ? 'bg-emerald-500/25 border-emerald-400/50 text-emerald-200 shadow-sm shadow-emerald-950/30'
                    : 'bg-slate-800/90 border-slate-700/80 text-slate-300 hover:bg-slate-700/80'
                }`}
              >
                <span>{emoji}</span>
                <span className="text-[10px] font-semibold text-slate-200">{userIds.length}</span>
              </button>
            );
          })}

          {/* Quick add extra reaction pill */}
          <button
            type="button"
            onClick={() => setShowReactionPicker((prev) => !prev)}
            className="w-5 h-5 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700/70 text-slate-400 hover:text-white flex items-center justify-center text-[10px] transition"
            title="Add reaction"
          >
            <Plus className="w-2.5 h-2.5" />
          </button>
        </div>
      )}

      {/* Lightbox / Full View Image Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 p-1.5 rounded-full bg-slate-800/90 hover:bg-slate-700 text-white transition"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage}
              alt="Enlarged Attachment"
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[80vh] rounded-xl object-contain border border-slate-700 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};
