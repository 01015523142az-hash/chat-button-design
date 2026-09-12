import React from 'react';
import { useChat } from '../context/ChatContext';
import {
  Mic,
  MicOff,
  ScreenShare,
  PhoneOff,
  Maximize2,
  Users,
  Activity,
} from 'lucide-react';

export const FloatingCallBar: React.FC = () => {
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
    currentUser,
  } = useChat();

  // Only show when there is an active call and modal is minimized
  if (!activeCall || isCallModalOpen) return null;

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isInitiator = currentUser?.id === activeCall.initiatorId;

  return (
    <div
      id="floating-call-bar"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center space-x-3 px-4 py-2.5 bg-slate-900/95 border border-emerald-500/40 rounded-full shadow-2xl shadow-emerald-950/30 backdrop-blur-md animate-in slide-in-from-bottom-4 duration-200"
    >
      {/* Live Indicator & Duration */}
      <div
        onClick={() => setIsCallModalOpen(true)}
        className="flex items-center space-x-2.5 cursor-pointer hover:opacity-80 transition pr-2"
      >
        <div className="relative flex items-center justify-center w-3 h-3">
          <span className="absolute w-full h-full rounded-full bg-emerald-400 animate-ping opacity-75" />
          <span className="relative w-2 h-2 rounded-full bg-emerald-500" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-white tracking-tight flex items-center space-x-1">
            <span className="truncate max-w-[160px]">{activeCall.title}</span>
            <span className="text-[10px] text-emerald-400 font-mono">({formatDuration(callDurationSeconds)})</span>
          </span>
          <span className="text-[10px] text-slate-400 flex items-center space-x-1">
            <Users className="w-3 h-3" />
            <span>{activeCall.participants.length} on call</span>
            {isScreenSharing && <span className="text-emerald-400 font-medium">• Presenting</span>}
          </span>
        </div>
      </div>

      <div className="h-6 w-px bg-slate-800" />

      {/* Quick Controls */}
      <div className="flex items-center space-x-2">
        {/* Mute toggle */}
        <button
          onClick={toggleMute}
          className={`p-2 rounded-full transition ${
            isMuted
              ? 'bg-rose-600 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-400" />}
        </button>

        {/* Screen share toggle */}
        <button
          onClick={toggleScreenShare}
          className={`p-2 rounded-full transition ${
            isScreenSharing
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
          title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
        >
          <ScreenShare className="w-4 h-4" />
        </button>

        {/* Expand to full modal */}
        <button
          onClick={() => setIsCallModalOpen(true)}
          className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          title="Open Call Video & Participants"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Hang up */}
        <button
          onClick={isInitiator && activeCall.type === 'direct' ? endCall : leaveCall}
          className="p-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white transition shadow"
          title="Leave / End Call"
        >
          <PhoneOff className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
