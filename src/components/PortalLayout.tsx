import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import {
  Users,
  Phone,
  PhoneCall,
  ScreenShare,
  Radio,
  Activity,
  MessageSquare,
  ShieldCheck,
  Search,
  Bell,
  ChevronDown,
  Clock,
  Sparkles,
  Laptop,
  CheckCircle2,
  Volume2,
} from 'lucide-react';

export const PortalLayout: React.FC = () => {
  const {
    currentUser,
    users,
    conferenceRooms,
    startVoiceCall,
    joinConferenceRoom,
    openChatWith,
    switchUserIdentity,
    setUserStatus,
    activeCall,
    setIsCallModalOpen,
  } = useChat();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'conferences' | 'directory' | 'logs'>('dashboard');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [directorySearch, setDirectorySearch] = useState('');

  const onlineCount = users.filter((u) => u.status === 'online').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* =========================================================
          Top Portal Header & Navigation Bar
         ========================================================= */}
      <header className="sticky top-0 z-30 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand & Badge */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-950/40">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold text-white tracking-tight">
                  Staff Portal
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Live Operations
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Real-Time Voice Conferencing, Screen Sharing & Messaging
              </p>
            </div>
          </div>

          {/* Portal Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'dashboard'
                  ? 'bg-slate-800 text-emerald-400 font-semibold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('conferences')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center space-x-1.5 ${
                activeTab === 'conferences'
                  ? 'bg-slate-800 text-emerald-400 font-semibold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Voice Rooms</span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-[10px] text-emerald-300">
                {conferenceRooms.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('directory')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'directory'
                  ? 'bg-slate-800 text-emerald-400 font-semibold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              Staff Directory ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'logs'
                  ? 'bg-slate-800 text-emerald-400 font-semibold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              Meeting Records
            </button>
          </nav>

          {/* Right Section: Conference Launcher & Identity Selector */}
          <div className="flex items-center space-x-3">
            {/* Quick Conference Launcher */}
            <button
              id="header-start-conf-btn"
              onClick={() =>
                startVoiceCall({
                  isConference: true,
                  title: 'Instant Team Conference',
                })
              }
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-950/40 transition"
              title="Launch instant group voice conference"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Start Conference</span>
            </button>

            {/* User Profile Switcher */}
            <div className="relative">
              <button
                id="portal-profile-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition"
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${currentUser?.avatarColor} flex items-center justify-center font-bold text-white text-xs shadow`}>
                  {currentUser?.displayName[0]}
                </div>
                <div className="text-left hidden lg:block pr-1">
                  <p className="text-xs font-semibold text-white leading-tight">
                    {currentUser?.displayName}
                  </p>
                  <p className="text-[10px] text-emerald-400 leading-tight">
                    {currentUser?.role || 'Staff Member'}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Profile Menu Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 p-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 animate-in fade-in duration-150">
                  <div className="p-2 border-b border-slate-800">
                    <p className="text-xs font-semibold text-white">{currentUser?.displayName}</p>
                    <p className="text-[11px] text-slate-400">{currentUser?.department} • {currentUser?.role}</p>
                    
                    {/* Status Toggle */}
                    <div className="flex items-center space-x-1 mt-2">
                      <button
                        onClick={() => {
                          setUserStatus('online');
                          setShowUserMenu(false);
                        }}
                        className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                      >
                        ● Online
                      </button>
                      <button
                        onClick={() => {
                          setUserStatus('away');
                          setShowUserMenu(false);
                        }}
                        className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                      >
                        ● Away
                      </button>
                    </div>
                  </div>

                  <div className="py-1">
                    <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Switch User Identity (Simulate Staff):
                    </p>
                    {users.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          switchUserIdentity(u);
                          setShowUserMenu(false);
                        }}
                        className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg text-left text-xs transition ${
                          u.id === currentUser?.id ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-300 hover:bg-slate-800/60'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-gradient-to-tr ${u.avatarColor} flex items-center justify-center text-[10px] font-bold text-white`}>
                          {u.displayName[0]}
                        </div>
                        <span className="truncate flex-1">{u.displayName}</span>
                        {u.id === currentUser?.id && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================
          Main Content Container
         ========================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Active Call Alert Banner (if in call but minimized) */}
        {activeCall && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/50 flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>In Active Call: {activeCall.title}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300">
                    {activeCall.participants.length} connected
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Microphone active • High-Definition audio channel open
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCallModalOpen(true)}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow transition"
            >
              Open Call Stage
            </button>
          </div>
        )}

        {/* =========================================================
            TAB 1: Dashboard & Live Voice Hub
           ========================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            
            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Online Staff */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium">Active Staff Online</span>
                  <Users className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-white">{onlineCount}</span>
                  <span className="text-xs text-emerald-400 font-medium">/ {users.length} registered</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Direct calls available</p>
              </div>

              {/* Conference Voice Rooms */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium">Voice Conference Rooms</span>
                  <Radio className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-white">{conferenceRooms.length}</span>
                  <span className="text-xs text-emerald-400 font-medium">Ready</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Mesh group conferencing</p>
              </div>

              {/* Screen Share Engine */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium">Screen Sharing Engine</span>
                  <Laptop className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-white">1080p 60fps</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Direct display capture enabled</p>
              </div>

              {/* Network Latency & Quality */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium">Audio WebRTC Health</span>
                  <Activity className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-emerald-400">0% Loss</span>
                  <span className="text-xs text-slate-400 font-medium">• 18ms</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Adaptive echo suppression</p>
              </div>

            </div>

            {/* Live Voice Conference Hub Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
                    <Radio className="w-5 h-5 text-emerald-400" />
                    <span>Voice Conference Rooms</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Instant group audio rooms with multi-participant conference and screen share
                  </p>
                </div>

                <button
                  onClick={() =>
                    startVoiceCall({
                      isConference: true,
                      title: 'Staff Standup & All-Hands',
                    })
                  }
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Custom Room</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {conferenceRooms.map((room) => (
                  <div
                    key={room.id}
                    className="flex flex-col justify-between p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition group shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-slate-800 text-emerald-400 border border-slate-700">
                          HD Voice Room
                        </span>
                        <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          <span>{room.activeParticipantsCount} online</span>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition">
                        {room.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {room.description}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center space-x-1 text-slate-500 text-xs">
                        <ScreenShare className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Screen Share ready</span>
                      </div>

                      <button
                        id={`join-room-${room.id}`}
                        onClick={() => joinConferenceRoom(room.id)}
                        className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-md shadow-emerald-950/40"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Join Call</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Team Roster & Presence Quick Launch */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
                    <Users className="w-5 h-5 text-emerald-400" />
                    <span>Staff Team Directory</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Connect directly via 1-on-1 voice call or send instant real-time messages
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {users.map((user) => {
                  const isMe = user.id === currentUser?.id;
                  return (
                    <div
                      key={user.id}
                      className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between shadow-sm"
                    >
                      <div>
                        <div className="flex items-center space-x-3 mb-3">
                          <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-tr ${user.avatarColor} flex items-center justify-center font-bold text-white text-base shadow`}>
                            {user.displayName[0]}
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
                                user.status === 'online'
                                  ? 'bg-emerald-500'
                                  : user.status === 'away'
                                  ? 'bg-amber-500'
                                  : 'bg-slate-500'
                              }`}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-white truncate">
                              {user.displayName} {isMe && <span className="text-emerald-400 font-normal">(You)</span>}
                            </h4>
                            <p className="text-[11px] text-slate-400 truncate">
                              {user.role || 'Team Member'}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate">
                              {user.department || 'Operations'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 flex items-center space-x-2">
                        {/* Voice Call Button */}
                        <button
                          disabled={isMe}
                          onClick={() =>
                            startVoiceCall({
                              recipientId: user.id,
                              isConference: false,
                              title: `Call with ${user.displayName}`,
                            })
                          }
                          className="flex-1 flex items-center justify-center space-x-1 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-medium disabled:opacity-40 disabled:hover:bg-emerald-600/20 transition"
                          title={`Voice call ${user.displayName}`}
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call</span>
                        </button>

                        {/* Open Chat Widget Button */}
                        <button
                          disabled={isMe}
                          onClick={() => openChatWith(user.id)}
                          className="flex-1 flex items-center justify-center space-x-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium disabled:opacity-40 transition"
                          title={`Message ${user.displayName}`}
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Chat</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* =========================================================
            TAB 2: Conference Rooms & Calling
           ========================================================= */}
        {activeTab === 'conferences' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <h2 className="text-xl font-bold text-white tracking-tight mb-2">
                Active Conference Rooms
              </h2>
              <p className="text-xs text-slate-400 max-w-2xl mb-6 leading-relaxed">
                Connect staff members simultaneously in high-fidelity mesh conference voice calls.
                Any participant can present their screen, invite additional members, and toggle HD audio.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {conferenceRooms.map((r) => (
                  <div
                    key={r.id}
                    className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs text-slate-400">{r.activeParticipantsCount} active</span>
                      </div>
                      <h3 className="text-lg font-bold text-white">{r.name}</h3>
                      <p className="text-xs text-slate-400 mt-1">{r.description}</p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                      <button
                        onClick={() => joinConferenceRoom(r.id)}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950/40"
                      >
                        <PhoneCall className="w-4 h-4" />
                        <span>Enter Voice Conference</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 3: Staff Directory
           ========================================================= */}
        {activeTab === 'directory' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Staff Directory</h2>
                  <p className="text-xs text-slate-400">All registered company team members</p>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name, role, dept..."
                    value={directorySearch}
                    onChange={(e) => setDirectorySearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 uppercase tracking-wider border-b border-slate-800 bg-slate-950/40">
                    <tr>
                      <th className="py-3 px-4">Member</th>
                      <th className="py-3 px-4">Role & Dept</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {users
                      .filter((u) =>
                        `${u.displayName} ${u.role} ${u.department}`
                          .toLowerCase()
                          .includes(directorySearch.toLowerCase())
                      )
                      .map((u) => {
                        const isMe = u.id === currentUser?.id;
                        return (
                          <tr key={u.id} className="hover:bg-slate-800/40 transition">
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${u.avatarColor} flex items-center justify-center font-bold text-white text-xs`}>
                                  {u.displayName[0]}
                                </div>
                                <span className="font-semibold text-white">
                                  {u.displayName} {isMe && '(You)'}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-slate-300">{u.role || 'Staff Member'}</span>
                              <span className="text-slate-500 text-[10px] block">{u.department || 'Operations'}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                                  u.status === 'online'
                                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                    : u.status === 'away'
                                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                    : 'bg-slate-800 text-slate-400 border-slate-700/60'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    u.status === 'online'
                                      ? 'bg-emerald-400 animate-pulse'
                                      : u.status === 'away'
                                      ? 'bg-amber-400'
                                      : 'bg-slate-500'
                                  }`}
                                />
                                <span className="capitalize">{u.status}</span>
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="inline-flex items-center space-x-2">
                                <button
                                  disabled={isMe}
                                  onClick={() =>
                                    startVoiceCall({
                                      recipientId: u.id,
                                      title: `Call with ${u.displayName}`,
                                    })
                                  }
                                  className="px-3 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 disabled:opacity-30 transition"
                                >
                                  Call
                                </button>
                                <button
                                  disabled={isMe}
                                  onClick={() => openChatWith(u.id)}
                                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-30 transition"
                                >
                                  Chat
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 4: Meeting Records & Audio Logs
           ========================================================= */}
        {activeTab === 'logs' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <h2 className="text-xl font-bold text-white tracking-tight mb-1">
                Recent Meeting & Conference Sessions
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                Audit logs of staff group conference calls and screen presentations
              </p>

              <div className="space-y-3">
                {[
                  {
                    title: 'All-Hands Architecture Review',
                    duration: '42 mins',
                    date: 'Today, 10:30 AM',
                    participants: 'Alice Vance, Bob Martin, Charlie Davis',
                    screenShared: true,
                  },
                  {
                    title: 'Operations Standup',
                    duration: '18 mins',
                    date: 'Today, 09:00 AM',
                    participants: 'Bob Martin, Diana Prince',
                    screenShared: false,
                  },
                  {
                    title: 'Client Demo Walkthrough',
                    duration: '25 mins',
                    date: 'Yesterday, 04:15 PM',
                    participants: 'Charlie Davis, Alice Vance',
                    screenShared: true,
                  },
                ].map((log, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400">
                        <PhoneCall className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">{log.title}</h4>
                        <p className="text-xs text-slate-400">
                          {log.participants} • {log.date}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {log.screenShared && (
                        <span className="hidden sm:inline-flex items-center space-x-1 text-[11px] text-emerald-400">
                          <ScreenShare className="w-3.5 h-3.5" />
                          <span>Screen Shared</span>
                        </span>
                      )}
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-mono text-slate-300">
                        {log.duration}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

    </div>
  );
};

function Plus(props: any) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}
