import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { Users, Check, Radio } from 'lucide-react';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVATAR_GRADIENTS = [
  'from-purple-600 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-blue-600 to-cyan-600',
  'from-rose-500 to-orange-500',
  'from-pink-600 to-rose-600',
  'from-amber-500 to-yellow-600',
];

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose }) => {
  const { users, currentUser, createGroup } = useChat();
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_GRADIENTS[0]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const availableContacts = users.filter((u) => u.id !== currentUser?.id);

  const toggleMember = (userId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setError('Please provide a group name');
      return;
    }
    if (selectedMemberIds.length === 0) {
      setError('Please select at least one team member to join the group');
      return;
    }

    createGroup(groupName.trim(), description.trim(), selectedMemberIds, selectedAvatar);
    setGroupName('');
    setDescription('');
    setSelectedMemberIds([]);
    setError(null);
    onClose();
  };

  return (
    <div
      id="create-group-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        id="create-group-modal-container"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl shadow-black/80 text-slate-100 animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                New Team Group Chat
              </h2>
              <p className="text-xs text-slate-400">
                Instant group messaging & conference calls
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-sm px-2.5 py-1 rounded-lg hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleCreate} className="py-4 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Group Avatar Color */}
          <div>
            <label className="block font-medium text-slate-300 mb-2">Group Avatar Theme</label>
            <div className="flex items-center gap-2.5">
              {AVATAR_GRADIENTS.map((gradient) => (
                <button
                  type="button"
                  key={gradient}
                  onClick={() => setSelectedAvatar(gradient)}
                  className={`w-8 h-8 rounded-full bg-gradient-to-tr ${gradient} flex items-center justify-center text-white transition-transform ${
                    selectedAvatar === gradient
                      ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900 scale-110'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {selectedAvatar === gradient && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>

          {/* Group Name */}
          <div>
            <label className="block font-medium text-slate-300 mb-1">
              Group Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Operations & Growth"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Group Description */}
          <div>
            <label className="block font-medium text-slate-300 mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Daily team updates and voice standups"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Member Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-medium text-slate-300">
                Select Team Members <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                {selectedMemberIds.length} selected
              </span>
            </div>

            <div className="max-h-40 overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl p-2 divide-y divide-slate-800/60">
              {availableContacts.length === 0 ? (
                <div className="p-3 text-center text-slate-500">
                  No other staff registered
                </div>
              ) : (
                availableContacts.map((contact) => {
                  const isSelected = selectedMemberIds.includes(contact.id);
                  return (
                    <div
                      key={contact.id}
                      onClick={() => toggleMember(contact.id)}
                      className={`p-2 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected ? 'bg-emerald-500/10' : 'hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-full bg-gradient-to-tr ${contact.avatarColor} flex items-center justify-center text-white font-semibold text-xs`}
                        >
                          {contact.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-medium text-slate-200">
                            {contact.displayName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {contact.role || 'Staff Member'}
                          </div>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                            : 'border-slate-700 bg-slate-900'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-emerald-500/20 rounded-xl p-3 flex items-start gap-2.5">
            <Radio className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-400 leading-normal">
              Group chats support real-time team messaging and group voice conference calls with screen sharing.
            </p>
          </div>

          {/* Modal Actions */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold py-2.5 rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
            >
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
