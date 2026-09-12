import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { UserProfile, UserStatus } from '../types/chat';
import {
  Shield,
  Lock,
  Users,
  Search,
  Plus,
  Bell,
  Check,
  ChevronDown,
  UserCheck,
  Radio,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  onOpenCreateGroup: () => void;
  onOpenNotificationSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenCreateGroup,
  onOpenNotificationSettings,
}) => {
  const {
    currentUser,
    users,
    conversations,
    activeConversationId,
    setActiveConversationId,
    isConnected,
    switchUserIdentity,
    createNewUserIdentity,
    setUserStatus,
    notificationSettings,
  } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'staff' | 'clients' | 'groups'>('all');
  const [isIdentityMenuOpen, setIsIdentityMenuOpen] = useState(false);
  const [isCreatingIdentity, setIsCreatingIdentity] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newUsername, setNewUsername] = useState('');

  // Filter conversations based on tab and search query
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

  const handleCreateIdentitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDisplayName.trim() || !newUsername.trim()) return;
    await createNewUserIdentity(newDisplayName.trim(), newUsername.trim());
    setNewDisplayName('');
    setNewUsername('');
    setIsCreatingIdentity(false);
    setIsIdentityMenuOpen(false);
  };

  const statusColors: Record<UserStatus, string> = {
    online: 'bg-emerald-500',
    away: 'bg-amber-500',
    offline: 'bg-slate-500',
  };

  return (
    <aside
      id="chat-sidebar"
      className="w-full md:w-80 lg:w-96 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0 select-none"
    >
      {/* 1. Header: Branding & User Profile / Identity Switcher */}
      <div className="p-4 border-b border-slate-800 shrink-0 space-y-3">
        {/* Top Logo Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-100 flex items-center gap-1.5">
                <span>E2EE Messenger</span>
              </h1>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                  }`}
                />
                <span className="font-mono">
                  {isConnected ? 'Real-Time E2EE Relay' : 'Reconnecting…'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Notification settings button */}
            <button
              id="btn-notification-settings"
              onClick={onOpenNotificationSettings}
              title="Push Notification Settings"
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl relative transition-colors"
            >
              <Bell className="w-4 h-4" />
              {notificationSettings.enabled && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
              )}
            </button>

            {/* Create Group Button */}
            <button
              id="btn-create-group"
              onClick={onOpenCreateGroup}
              title="Create New Group Chat"
              className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Current Active Identity Selector */}
        {currentUser && (
          <div className="relative">
            <button
              id="btn-switch-identity-dropdown"
              onClick={() => setIsIdentityMenuOpen(!isIdentityMenuOpen)}
              className="w-full bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-slate-700/80 rounded-xl p-2 flex items-center justify-between gap-2.5 transition-all text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative shrink-0">
                  <div
                    className={`w-8 h-8 rounded-full bg-gradient-to-tr ${currentUser.avatarColor} flex items-center justify-center text-white font-semibold text-xs shadow`}
                  >
                    {currentUser.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-slate-950 ${
                      statusColors[currentUser.status]
                    }`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-slate-200 truncate flex items-center gap-1.5">
                    <span>{currentUser.displayName}</span>
                    <span className="text-[10px] text-emerald-400 font-mono font-normal">
                      (You)
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">
                    @{currentUser.username} · {currentUser.status}
                  </div>
                </div>
              </div>

              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                  isIdentityMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Identity Switcher Dropdown */}
            {isIdentityMenuOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-2 z-40 space-y-2 animate-in fade-in duration-100">
                <div className="px-2 py-1 text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
                  Switch Active Testing Identity
                </div>

                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {users.map((user) => {
                    const isSelected = user.id === currentUser.id;
                    return (
                      <button
                        key={user.id}
                        onClick={() => {
                          switchUserIdentity(user);
                          setIsIdentityMenuOpen(false);
                        }}
                        className={`w-full p-1.5 rounded-lg flex items-center justify-between text-left transition-colors ${
                          isSelected ? 'bg-emerald-500/15 text-emerald-400' : 'hover:bg-slate-900 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`w-6 h-6 rounded-full bg-gradient-to-tr ${user.avatarColor} flex items-center justify-center text-white text-[10px] font-semibold shrink-0`}
                          >
                            {user.displayName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs truncate font-medium">{user.displayName}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Status Toggle */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between px-2 text-xs">
                  <span className="text-slate-400 text-[11px]">My Presence:</span>
                  <div className="flex items-center gap-1">
                    {(['online', 'away', 'offline'] as UserStatus[]).map((st) => (
                      <button
                        key={st}
                        onClick={() => setUserStatus(st)}
                        className={`px-2 py-0.5 rounded text-[10px] capitalize transition-colors ${
                          currentUser.status === st
                            ? 'bg-slate-800 text-slate-100 font-semibold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Create Custom Identity Trigger */}
                <div className="pt-1 border-t border-slate-800/80">
                  {isCreatingIdentity ? (
                    <form onSubmit={handleCreateIdentitySubmit} className="space-y-2 p-1">
                      <input
                        type="text"
                        placeholder="Full Name (e.g. David)"
                        value={newDisplayName}
                        onChange={(e) => setNewDisplayName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Username (e.g. david)"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none"
                      />
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setIsCreatingIdentity(false)}
                          className="flex-1 text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-400 py-1 rounded-md"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 text-[11px] bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold py-1 rounded-md"
                        >
                          Generate Identity
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setIsCreatingIdentity(true)}
                      className="w-full text-center text-xs text-emerald-400 hover:text-emerald-300 py-1 font-medium"
                    >
                      + Create Custom Identity
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search Field */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="input-search-conversations"
            type="text"
            placeholder="Search contacts & group chats…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800/80 rounded-xl pl-8 pr-3.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-slate-700"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 pt-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-1 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'all'
                ? 'bg-slate-800 text-slate-100'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('direct')}
            className={`flex-1 py-1 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'direct'
                ? 'bg-slate-800 text-slate-100'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Direct
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`flex-1 py-1 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'groups'
                ? 'bg-slate-800 text-slate-100'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Groups
          </button>
        </div>
      </div>

      {/* 2. Conversations List Stream */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/30 p-2 space-y-0.5">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-10 px-4 text-slate-500 text-xs">
            {searchQuery ? 'No matching conversations' : 'No active chats found'}
          </div>
        ) : (
          filteredConversations.map((c) => {
            const isActive = c.id === activeConversationId;
            const isTyping = c.typingUsers && c.typingUsers.length > 0;
            const lastMsg = c.lastMessage;
            const isMine = lastMsg?.senderId === currentUser?.id;

            return (
              <div
                key={c.id}
                id={`conversation-item-${c.id}`}
                onClick={() => setActiveConversationId(c.id)}
                className={`w-full p-2.5 rounded-xl flex items-center gap-3 cursor-pointer transition-colors text-left ${
                  isActive
                    ? 'bg-slate-800/90 text-slate-100'
                    : 'hover:bg-slate-800/40 text-slate-300'
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div
                    className={`w-10 h-10 rounded-full bg-gradient-to-tr ${c.avatarColor} flex items-center justify-center text-white font-semibold text-sm shadow`}
                  >
                    {c.isGroup ? (
                      <Users className="w-5 h-5" />
                    ) : (
                      c.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  {!c.isGroup && c.status && (
                    <span
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-slate-900 ${
                        statusColors[c.status]
                      }`}
                    />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-semibold text-slate-100 truncate">
                        {c.name}
                      </span>
                      {!c.isGroup ? (
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase tracking-wider shrink-0 border ${
                            c.status === 'online'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : c.status === 'away'
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700/60'
                          }`}
                        >
                          {c.status === 'online' ? (
                            <span className="inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Online
                            </span>
                          ) : c.status === 'away' ? (
                            'Away'
                          ) : (
                            'Offline'
                          )}
                        </span>
                      ) : (
                        <span className="text-[10px] bg-slate-800 text-slate-400 font-mono px-1.5 py-0.2 rounded shrink-0">
                          {c.memberCount} members
                        </span>
                      )}
                    </div>
                    {lastMsg && (
                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                        {new Date(lastMsg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] truncate flex items-center gap-1">
                      {isTyping ? (
                        <span className="text-emerald-400 animate-pulse font-medium">
                          {c.typingUsers.join(', ')} typing…
                        </span>
                      ) : lastMsg ? (
                        <>
                          {isMine && <span className="text-slate-400">You: </span>}
                          <span className="text-slate-400">
                            {lastMsg.decryptedContent || '[Encrypted payload]'}
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-400 italic">No messages yet</span>
                      )}
                    </p>

                    {/* Unread Pill */}
                    {c.unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500 text-slate-950 rounded-full shrink-0 shadow-sm">
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

      {/* 3. Footer Zero-Knowledge Privacy Seal */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>E2EE Active (Web Crypto)</span>
        </div>
        <span className="font-mono text-[10px] text-slate-400">P-256 + AES-GCM</span>
      </div>
    </aside>
  );
};
