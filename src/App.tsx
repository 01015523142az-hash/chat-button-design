import React from 'react';
import { ChatProvider } from './context/ChatContext';
import { PortalLayout } from './components/PortalLayout';
import { ChatWidget } from './components/ChatWidget';
import { CallModal } from './components/CallModal';
import { FloatingCallBar } from './components/FloatingCallBar';
import { IncomingCallBanner } from './components/IncomingCallBanner';

const AppContent: React.FC = () => {
  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-slate-100 overflow-x-hidden">
      {/* Main Staff Portal Application */}
      <PortalLayout />

      {/* Floating Chat Button & Panel (no encryption, real-time messaging) */}
      <ChatWidget />

      {/* Active Call Full Stage Modal (Screen share, audio wave grid, participant invites) */}
      <CallModal />

      {/* Floating Call Mini-Bar (persists while user browses portal or chats) */}
      <FloatingCallBar />

      {/* Incoming Call Prompt (Direct Voice or Group Conference) */}
      <IncomingCallBanner />
    </div>
  );
};

export default function App() {
  return (
    <ChatProvider>
      <AppContent />
    </ChatProvider>
  );
}
