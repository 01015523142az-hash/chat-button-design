import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { GroupChat } from '../types/chat';
import { Users, ShieldCheck, UserPlus, Shield, UserX, X } from 'lucide-react';

interface GroupInfoModalProps {
  group: GroupChat | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenSafetyNumber: () => void;
}

export const GroupInfoModal: React.FC<GroupInfoModalProps> = ({
  group,
  isOpen,
  onClose,
  onOpenSafetyNumber,
}) => {
  const { users, currentUser, updateGroupMembers } = useChat();
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState<string[]>([]);

  if (!isOpen || !group) return null;

  const groupMembers = users.filter((u) => group.memberIds.includes(u.id));
  const nonMembers = users.filter((u) => !group.memberIds.includes(u.id));
  const isCurrentUserAdmin = group.adminIds.includes(currentUser?.id || '');

  const handleAddMembers = () => {
    if (selectedToAdd.length === 0) return;
    const updated = Array.from(new Set([...group.memberIds, ...selectedToAdd]));
    updateGroupMembers(group.id, updated);
    setSelectedToAdd([]);
    setIsAddingMember(false);
  };

  const handleRemoveMember = (memberId: string) => {
    if (!confirm('Remove member from group?')) return;
    const updated = group.memberIds.filter((id) => id !== memberId);
    updateGroupMembers(group.id, updated);
  };

  return (
    <div
      id="group-info-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        id="group-info-modal-container"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl shadow-black/80 text-slate-100 flex flex-col animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <h2 className="text-base font-bold text-slate-100">Group Details</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-sm px-2 py-1 rounded-lg hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto py-4 space-y-4 text-xs">
          {/* Header Banner */}
          <div className="flex items-center gap-3.5 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div
              className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${group.avatarColor} flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0`}
            >
              <Users className="w-7 h-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-slate-100 truncate">{group.name}</h3>
              <p className="text-slate-400 text-xs mt-0.5 line-clamp-2">
                {group.description || 'Confidential end-to-end encrypted group'}
              </p>
              <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-emerald-400 font-mono">
                <ShieldCheck className="w-3 h-3" />
                <span>{group.memberIds.length} Verified Participants</span>
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenSafetyNumber();
              }}
              className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-emerald-400 font-medium transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verify Keys</span>
            </button>

            {isCurrentUserAdmin && (
              <button
                onClick={() => setIsAddingMember(!isAddingMember)}
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-medium transition-colors"
              >
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span>Add Member</span>
              </button>
            )}
          </div>

          {/* Add Member Drawer */}
          {isAddingMember && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200 text-xs">Add New Member</span>
                <button
                  onClick={() => setIsAddingMember(false)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {nonMembers.length === 0 ? (
                <div className="text-slate-500 py-2 text-center text-xs">
                  All available contacts are already in this group.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {nonMembers.map((user) => {
                    const isChecked = selectedToAdd.includes(user.id);
                    return (
                      <div
                        key={user.id}
                        onClick={() =>
                          setSelectedToAdd((prev) =>
                            isChecked ? prev.filter((id) => id !== user.id) : [...prev, user.id]
                          )
                        }
                        className={`p-2 rounded-lg flex items-center justify-between cursor-pointer text-xs ${
                          isChecked ? 'bg-emerald-500/10' : 'hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-full bg-gradient-to-tr ${user.avatarColor} flex items-center justify-center text-white text-[10px] font-semibold`}
                          >
                            {user.displayName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-slate-200 font-medium">{user.displayName}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          readOnly
                          className="accent-emerald-500"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {nonMembers.length > 0 && (
                <button
                  disabled={selectedToAdd.length === 0}
                  onClick={handleAddMembers}
                  className="w-full bg-emerald-500 disabled:opacity-40 hover:bg-emerald-400 text-slate-950 font-semibold py-2 rounded-lg transition-colors"
                >
                  Confirm & Share Group Keys
                </button>
              )}
            </div>
          )}

          {/* Members List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-300 text-xs">
                Group Members ({groupMembers.length})
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {groupMembers.filter((u) => u.status === 'online').length} Online
              </span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl divide-y divide-slate-800/60 overflow-hidden">
              {groupMembers.map((member) => {
                const isAdmin = group.adminIds.includes(member.id);
                const isMe = member.id === currentUser?.id;
                return (
                  <div
                    key={member.id}
                    className="p-2.5 flex items-center justify-between hover:bg-slate-900/50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <div
                          className={`w-8 h-8 rounded-full bg-gradient-to-tr ${member.avatarColor} flex items-center justify-center text-white font-semibold text-xs`}
                        >
                          {member.displayName.charAt(0).toUpperCase()}
                        </div>
                        <span
                          className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ring-2 ring-slate-950 ${
                            member.status === 'online' ? 'bg-emerald-500' : 'bg-slate-600'
                          }`}
                        />
                      </div>

                      <div>
                        <div className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                          <span>{member.displayName}</span>
                          {isMe && <span className="text-[10px] text-slate-500">(You)</span>}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          @{member.username} · {member.publicKeyJwk ? 'Key active' : 'Syncing key'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isAdmin && (
                        <span className="text-[10px] bg-purple-500/15 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded font-mono">
                          Admin
                        </span>
                      )}

                      {isCurrentUserAdmin && !isMe && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-rose-500/10 transition-colors"
                          title="Remove member"
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-2 rounded-xl text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
