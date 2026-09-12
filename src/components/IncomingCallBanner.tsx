import React from 'react';
import { useChat } from '../context/ChatContext';
import { Phone, PhoneOff, Users, Radio } from 'lucide-react';

export const IncomingCallBanner: React.FC = () => {
  const { incomingCall, acceptCall, declineCall } = useChat();

  if (!incomingCall) return null;

  return (
    <div
      id="incoming-call-banner"
      className="fixed top-6 right-6 z-50 flex items-center p-4 bg-slate-900/95 border-2 border-emerald-500 rounded-2xl shadow-2xl shadow-emerald-950/50 backdrop-blur-md animate-in slide-in-from-top-6 duration-200 max-w-sm w-full"
    >
      <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mr-3 shrink-0">
        <Radio className="w-6 h-6 animate-pulse" />
        <span className="absolute -inset-1 rounded-full border-2 border-emerald-400 animate-ping opacity-60" />
      </div>

      <div className="flex-1 min-w-0 mr-3">
        <div className="flex items-center space-x-1.5">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            Incoming {incomingCall.type === 'conference' ? 'Conference' : 'Voice Call'}
          </span>
        </div>
        <h4 className="text-sm font-bold text-white truncate">
          {incomingCall.title || incomingCall.initiatorName}
        </h4>
        <p className="text-xs text-slate-400">
          From {incomingCall.initiatorName}
        </p>
      </div>

      <div className="flex items-center space-x-2 shrink-0">
        {/* Accept */}
        <button
          id="accept-call-btn"
          onClick={() => acceptCall(incomingCall.id)}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition shadow-lg shadow-emerald-950/40"
          title="Accept Call"
        >
          <Phone className="w-5 h-5" />
        </button>

        {/* Decline */}
        <button
          id="decline-call-btn"
          onClick={() => declineCall(incomingCall.id)}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-rose-600 hover:bg-rose-500 text-white transition shadow-lg shadow-rose-950/40"
          title="Decline"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
