import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '../context/ChatContext';
import {
  Mic,
  MicOff,
  ScreenShare,
  PhoneOff,
  Minimize2,
  Users,
  UserPlus,
  Maximize2,
  Volume2,
  Activity,
  Check,
} from 'lucide-react';

export const CallModal: React.FC = () => {
  const {
    activeCall,
    isCallModalOpen,
    setIsCallModalOpen,
    isMuted,
    toggleMute,
    isScreenSharing,
    toggleScreenShare,
    leaveCall,
    endCall,
    callDurationSeconds,
    activeScreenStream,
    users,
    currentUser,
    inviteToConference,
  } = useChat();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [showInviteMenu, setShowInviteMenu] = useState(false);
  const [invitedMap, setInvitedMap] = useState<Record<string, boolean>>({});

  // Bind screen share stream to video element
  useEffect(() => {
    if (videoRef.current) {
      if (activeScreenStream) {
        videoRef.current.srcObject = activeScreenStream;
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [activeScreenStream, isScreenSharing]);

  if (!activeCall || !isCallModalOpen) return null;

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isInitiator = currentUser?.id === activeCall.initiatorId;

  // Available users to invite
  const availableToInvite = users.filter(
    (u) =>
      u.id !== currentUser?.id &&
      !activeCall.participants.some((p) => p.userId === u.id)
  );

  const handleInvite = (userId: string) => {
    inviteToConference(userId);
    setInvitedMap((prev) => ({ ...prev, [userId]: true }));
    setTimeout(() => {
      setInvitedMap((prev) => ({ ...prev, [userId]: false }));
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-5xl h-[85vh] max-h-[860px] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900/90 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-semibold text-white tracking-tight">
                  {activeCall.title}
                </h3>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {activeCall.type === 'conference' ? 'Group Conference' : 'Direct Voice Call'}
                </span>
                {activeCall.status === 'calling' && (
                  <span className="text-xs text-amber-400 animate-pulse font-medium">
                    (Calling...)
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-3 text-xs text-slate-400 mt-0.5">
                <span className="font-mono text-emerald-400 font-semibold">
                  {formatDuration(callDurationSeconds)}
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>{activeCall.participants.length} participant{activeCall.participants.length !== 1 ? 's' : ''}</span>
                </span>
                <span>•</span>
                <span className="text-slate-400">Opus 48kHz HD Audio</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Invite Button */}
            <div className="relative">
              <button
                id="call-invite-btn"
                onClick={() => setShowInviteMenu(!showInviteMenu)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
              >
                <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Add Participant</span>
              </button>

              {/* Invite Dropdown */}
              {showInviteMenu && (
                <div className="absolute right-0 mt-2 w-64 p-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20">
                  <p className="text-xs font-medium text-slate-400 px-2 py-1">
                    Invite to Conference:
                  </p>
                  {availableToInvite.length === 0 ? (
                    <p className="text-xs text-slate-500 px-2 py-2">All members are in the call.</p>
                  ) : (
                    <div className="space-y-1 mt-1 max-h-48 overflow-y-auto">
                      {availableToInvite.map((u) => (
                        <div
                          key={u.id}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-700/60 transition"
                        >
                          <div className="flex items-center space-x-2">
                            <div className={`w-7 h-7 rounded-full bg-gradient-to-tr ${u.avatarColor} flex items-center justify-center text-xs font-bold text-white`}>
                              {u.displayName[0]}
                            </div>
                            <div>
                              <p className="text-xs font-medium text-white">{u.displayName}</p>
                              <p className="text-[10px] text-slate-400">{u.role || 'Team Member'}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleInvite(u.id)}
                            disabled={invitedMap[u.id]}
                            className="px-2 py-1 text-[11px] font-medium rounded bg-emerald-600 hover:bg-emerald-500 text-white disabled:bg-emerald-800 transition"
                          >
                            {invitedMap[u.id] ? (
                              <span className="flex items-center space-x-1">
                                <Check className="w-3 h-3" />
                                <span>Invited</span>
                              </span>
                            ) : (
                              'Invite'
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Minimize button to floating bar */}
            <button
              id="call-minimize-btn"
              onClick={() => setIsCallModalOpen(false)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              title="Minimize call (continue browsing portal)"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Stage: Screen Share or Participant Grid */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden bg-slate-950/60">
          {isScreenSharing || activeCall.isScreenSharing ? (
            /* Screen Sharing Mode */
            <div className="flex-1 flex flex-col md:flex-row gap-4 h-full min-h-0">
              {/* Big Screen Share View */}
              <div className="flex-1 relative rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain rounded-xl"
                />
                
                {/* Overlay Header */}
                <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-slate-950/80 backdrop-blur border border-slate-700/60 flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-medium text-emerald-300">
                    Live Screen Presentation
                  </span>
                  <span className="text-xs text-slate-400">
                    ({activeCall.screenSharerName || currentUser?.displayName})
                  </span>
                </div>
              </div>

              {/* Side Strip: Participant Tiles */}
              <div className="w-full md:w-64 flex md:flex-col gap-2 overflow-y-auto">
                {activeCall.participants.map((p) => {
                  const isMe = p.userId === currentUser?.id;
                  return (
                    <div
                      key={p.userId}
                      className="relative flex items-center p-3 rounded-xl bg-slate-900 border border-slate-800"
                    >
                      <div className={`relative w-10 h-10 rounded-xl bg-gradient-to-tr ${p.avatarColor} flex items-center justify-center font-bold text-white text-sm shrink-0`}>
                        {p.displayName[0]}
                        {/* Audio Wave / Speaking ring */}
                        <div className="absolute -inset-0.5 rounded-xl border-2 border-emerald-400/80 animate-pulse" />
                      </div>
                      <div className="ml-3 min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white truncate">
                          {p.displayName} {isMe && '(You)'}
                        </p>
                        <p className="text-[10px] text-slate-400 flex items-center space-x-1">
                          {p.isMuted ? (
                            <span className="text-rose-400 flex items-center space-x-1">
                              <MicOff className="w-3 h-3" />
                              <span>Muted</span>
                            </span>
                          ) : (
                            <span className="text-emerald-400 flex items-center space-x-1">
                              <Volume2 className="w-3 h-3" />
                              <span>Audio Active</span>
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Audio Conference Grid Mode */
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl max-h-full overflow-y-auto">
                {activeCall.participants.map((p) => {
                  const isMe = p.userId === currentUser?.id;
                  return (
                    <div
                      key={p.userId}
                      className="relative flex flex-col items-center justify-center p-8 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition group shadow-lg"
                    >
                      {/* Avatar with speaking wave pulses */}
                      <div className="relative">
                        <div className={`w-24 h-24 rounded-2xl bg-gradient-to-tr ${p.avatarColor} flex items-center justify-center text-3xl font-bold text-white shadow-xl ring-4 ring-slate-800`}>
                          {p.displayName[0]}
                        </div>

                        {/* Animated sound ripple rings */}
                        {!p.isMuted && (
                          <div className="absolute -inset-2 rounded-2xl border-2 border-emerald-500/40 animate-ping opacity-60 pointer-events-none" />
                        )}

                        {/* Mute icon badge */}
                        {p.isMuted && (
                          <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-rose-500 text-white shadow">
                            <MicOff className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      <div className="mt-4 text-center">
                        <h4 className="text-sm font-semibold text-white">
                          {p.displayName} {isMe && <span className="text-emerald-400 text-xs font-normal">(You)</span>}
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {p.isMuted ? 'Muted' : 'Speaking (HD Voice)'}
                        </p>
                      </div>

                      {/* Speaking Wave Visualizer bars */}
                      <div className="flex items-center space-x-1 mt-3">
                        <span className={`w-1 h-3 rounded-full ${p.isMuted ? 'bg-slate-700' : 'bg-emerald-500 animate-bounce'}`} style={{ animationDelay: '0ms' }} />
                        <span className={`w-1 h-5 rounded-full ${p.isMuted ? 'bg-slate-700' : 'bg-emerald-400 animate-bounce'}`} style={{ animationDelay: '150ms' }} />
                        <span className={`w-1 h-2 rounded-full ${p.isMuted ? 'bg-slate-700' : 'bg-emerald-500 animate-bounce'}`} style={{ animationDelay: '300ms' }} />
                        <span className={`w-1 h-4 rounded-full ${p.isMuted ? 'bg-slate-700' : 'bg-emerald-400 animate-bounce'}`} style={{ animationDelay: '200ms' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Call Controls Toolbar */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Encrypted WebRTC Mesh Channel</span>
          </div>

          <div className="flex items-center space-x-3 mx-auto sm:mx-0">
            {/* Mute Button */}
            <button
              id="call-mute-toggle-btn"
              onClick={toggleMute}
              className={`flex items-center justify-center w-12 h-12 rounded-full transition shadow-md ${
                isMuted
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-emerald-400" />}
            </button>

            {/* Screen Share Button */}
            <button
              id="call-screen-share-btn"
              onClick={toggleScreenShare}
              className={`flex items-center justify-center w-12 h-12 rounded-full transition shadow-md ${
                isScreenSharing
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
              title={isScreenSharing ? 'Stop sharing screen' : 'Share your screen'}
            >
              <ScreenShare className="w-5 h-5" />
            </button>

            {/* Leave / End Call */}
            {isInitiator && activeCall.type === 'direct' ? (
              <button
                id="call-end-btn"
                onClick={endCall}
                className="flex items-center space-x-2 px-6 h-12 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm transition shadow-lg shadow-rose-950/40"
              >
                <PhoneOff className="w-5 h-5" />
                <span>End Call</span>
              </button>
            ) : (
              <button
                id="call-leave-btn"
                onClick={leaveCall}
                className="flex items-center space-x-2 px-6 h-12 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm transition shadow-lg shadow-rose-950/40"
              >
                <PhoneOff className="w-5 h-5" />
                <span>Leave Call</span>
              </button>
            )}
          </div>

          <div className="hidden sm:flex items-center space-x-2">
            <button
              onClick={() => setIsCallModalOpen(false)}
              className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
            >
              Keep Call in Background
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
