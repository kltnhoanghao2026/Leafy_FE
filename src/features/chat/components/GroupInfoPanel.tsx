import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';
import { API_ENDPOINTS } from '../../../lib/routes';
import { fileApi } from '../../../lib/api/fileApi';
import { chatApi } from '../api/chatApi';
import type { ConversationResponse, ConversationMember } from '../api/chatApi';
import { Avatar } from '../../../components/ui/Avatar';

interface Profile { id: string; userId: string; fullName: string; avatar: string; role: string; }
type GroupSettings = Record<string, unknown>;
interface GroupInfoPanelProps { conversation: ConversationResponse; currentUserId: string; onClose: () => void; }

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconCrown = () => (
  <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 1l2.39 5.26L18 7.27l-4 3.9.94 5.5L10 14l-4.94 2.67.94-5.5-4-3.9 5.61-.01L10 1z"/>
  </svg>
);
const IconShield = () => (
  <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM13.707 8.207a1 1 0 00-1.414-1.414L9 10.086 7.707 8.793a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
  </svg>
);
const IconPromote = () => (
  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM13.707 8.207a1 1 0 00-1.414-1.414L9 10.086 7.707 8.793a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
  </svg>
);
const IconDemote = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
  </svg>
);
const IconKick = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6"/>
  </svg>
);

// ── RoleBadge ─────────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: ConversationMember['role'] }) {
  if (role === 'OWNER') return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md">
      <IconCrown /> Trưởng nhóm
    </span>
  );
  if (role === 'ADMIN') return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-md">
      <IconShield /> Quản trị
    </span>
  );
  return null;
}

// ── MemberMenu ────────────────────────────────────────────────────────────────
function MemberMenu({ member, currentUserRole, conversationId, onAction }: {
  member: ConversationMember; currentUserRole: ConversationMember['role'];
  conversationId: string; onAction: () => void;
}) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const done = () => { qc.invalidateQueries({ queryKey: ['conversations'] }); onAction(); setOpen(false); };

  const kick     = useMutation({ mutationFn: () => chatApi.removeMember(conversationId, member.userId),    onSuccess: done });
  const promote  = useMutation({ mutationFn: () => chatApi.promoteToAdmin(conversationId, member.userId),  onSuccess: done });
  const demote   = useMutation({ mutationFn: () => chatApi.demoteFromAdmin(conversationId, member.userId), onSuccess: done });

  const canManage =
    (currentUserRole === 'OWNER' && member.role !== 'OWNER') ||
    (currentUserRole === 'ADMIN' && member.role === 'MEMBER');
  if (!canManage) return null;

  const isPending = kick.isPending || promote.isPending || demote.isPending;

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen(v => !v)}
        className={`p-1.5 rounded-lg transition-all ${open ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)}/>
          <div className="absolute right-0 top-9 z-30 w-52 bg-white border border-gray-150 rounded-2xl shadow-2xl shadow-gray-200/60 overflow-hidden">
            {/* Target info */}
            <div className="px-3 py-2.5 border-b border-gray-100 bg-gray-50/80">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Quản lý thành viên</p>
              <p className="text-sm font-medium text-gray-800 truncate mt-0.5">{member.fullName}</p>
            </div>

            <div className="py-1">
              {currentUserRole === 'OWNER' && member.role === 'MEMBER' && (
                <button
                  onClick={() => promote.mutate()}
                  disabled={isPending}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-blue-700 hover:bg-blue-50 transition-colors disabled:opacity-50 font-medium"
                >
                  <span className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <IconPromote />
                  </span>
                  Thêm quyền Admin
                </button>
              )}
              {currentUserRole === 'OWNER' && member.role === 'ADMIN' && (
                <button
                  onClick={() => demote.mutate()}
                  disabled={isPending}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
                >
                  <span className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <IconDemote />
                  </span>
                  Hạ xuống Thành viên
                </button>
              )}
            </div>

            <div className="border-t border-gray-100 py-1">
              <button
                onClick={() => kick.mutate()}
                disabled={isPending}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 font-medium"
              >
                <span className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center shrink-0 text-red-500">
                  <IconKick />
                </span>
                Xóa khỏi nhóm
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Toggle Component ──────────────────────────────────────────────────────────
function Toggle({ checked, onChange, disabled }: { checked: boolean, onChange: (v: boolean) => void, disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${checked ? 'bg-emerald-500' : 'bg-gray-200'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function GroupInfoPanel({ conversation, currentUserId, onClose }: GroupInfoPanelProps) {
  const qc = useQueryClient();
  const [view, setView]             = useState<'MAIN' | 'SETTINGS'>('MAIN');
  const [copied, setCopied]         = useState(false);
  const [showAdd, setShowAdd]       = useState(false);
  const [addSearch, setAddSearch]   = useState('');
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(conversation.name);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const existingIds = new Set((conversation.members || []).map(m => m.userId));

  const { data: searchResults = [], isLoading: searching } = useQuery({
    queryKey: ['panel-search', addSearch],
    queryFn: async () => {
      const res = await apiClient.get<{ data?: { content?: Profile[] }; content?: Profile[] }>(API_ENDPOINTS.PROFILES.SEARCH, { params: { searchTerm: addSearch, page: 0, size: 20 } });
      return res.data?.data?.content || res.data?.content || [];
    },
    enabled: showAdd && addSearch.trim().length > 0,
  });

  const addMember   = useMutation({ mutationFn: (uid: string) => chatApi.addMembers(conversation.id, [uid]), onSuccess: () => { qc.invalidateQueries({ queryKey: ['conversations'] }); setAddSearch(''); } });
  const leave       = useMutation({ mutationFn: () => chatApi.leaveGroup(conversation.id),   onSuccess: () => { qc.invalidateQueries({ queryKey: ['conversations'] }); onClose(); } });
  const disband     = useMutation({ mutationFn: () => chatApi.disbandGroup(conversation.id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['conversations'] }); onClose(); } });
  const genLink     = useMutation({ mutationFn: () => chatApi.generateJoinLink(conversation.id), onSuccess: (token) => { copyText(`${window.location.origin}/chat/join/${token}`); } });

  const updateName  = useMutation({ mutationFn: (name: string) => chatApi.updateGroupName(conversation.id, name), onSuccess: () => { qc.invalidateQueries({ queryKey: ['conversations'] }); setIsEditingName(false); } });
  const updateAvatar = useMutation({ 
    mutationFn: async (file: File) => {
      const res = await fileApi.uploadFileDirectToS3(file);
      return chatApi.updateGroupAvatar(conversation.id, res.s3Key);
    }, 
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }) 
  });
  const updateSettings = useMutation({ mutationFn: (s: Partial<GroupSettings>) => chatApi.updateGroupSettings(conversation.id, s), onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }) });

  const copyText = (text: string) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const handleCopyLink = () => conversation.joinLinkToken ? copyText(`${window.location.origin}/chat/join/${conversation.joinLinkToken}`) : genLink.mutate();

  const currentRole = conversation.members?.find(m => m.userId === currentUserId)?.role ?? 'MEMBER';
  const isOwner = currentRole === 'OWNER';
  const canEditInfo = currentRole === 'OWNER' || currentRole === 'ADMIN';
  const memberCount = conversation.members?.length ?? 0;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) updateAvatar.mutate(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleNameSave = () => {
    if (editNameValue.trim() && editNameValue !== conversation.name) {
      updateName.mutate(editNameValue);
    } else {
      setIsEditingName(false);
      setEditNameValue(conversation.name);
    }
  };

  const sortedMembers = [...(conversation.members || [])].sort((a, b) => {
    const o: Record<string, number> = { OWNER: 0, ADMIN: 1, MEMBER: 2 };
    return (o[a.role ?? 'MEMBER'] ?? 2) - (o[b.role ?? 'MEMBER'] ?? 2);
  });

  return (
    <div className="w-80 border-l border-gray-200/60 bg-white flex flex-col h-full shrink-0 animate-in slide-in-from-right duration-200">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          {view === 'SETTINGS' && (
            <button onClick={() => setView('MAIN')} className="p-1 -ml-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            </button>
          )}
          <span className="text-sm font-bold text-gray-800 tracking-tight">
            {view === 'SETTINGS' ? 'Cài đặt nhóm' : 'Thông tin nhóm'}
          </span>
        </div>
        <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {view === 'MAIN' ? (
        <>
          {/* ── Scrollable body (MAIN) ── */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">

        {/* Hero */}
        <div className="flex flex-col items-center pt-6 pb-5 px-4 border-b border-gray-100">
          <div className="relative mb-3 group">
            <div 
              className={`w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-200 ${canEditInfo ? 'cursor-pointer' : ''}`}
              onClick={() => canEditInfo && fileInputRef.current?.click()}
            >
              {conversation.avatar
                ? <img src={conversation.avatar} alt="" className="w-full h-full object-cover"/>
                : <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              }
              {canEditInfo && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              )}
            </div>
            {canEditInfo && updateAvatar.isPending && (
               <div className="absolute inset-0 rounded-2xl bg-white/70 flex items-center justify-center backdrop-blur-sm z-10">
                 <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"/>
               </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
          </div>
          
          {isEditingName ? (
            <div className="flex items-center gap-2 w-full max-w-[200px] mt-1">
              <input
                type="text"
                value={editNameValue}
                onChange={e => setEditNameValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleNameSave()}
                autoFocus
                className="flex-1 px-2 py-1 text-sm font-bold text-center text-gray-900 border-b-2 border-emerald-500 focus:outline-none bg-emerald-50 rounded-t-md"
              />
              <button onClick={handleNameSave} disabled={updateName.isPending} className="text-emerald-600 hover:text-emerald-700">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <h4 className="font-bold text-gray-900 text-base text-center leading-snug">{conversation.name}</h4>
              {canEditInfo && (
                <button onClick={() => { setIsEditingName(true); setEditNameValue(conversation.name); }} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
              )}
            </div>
          )}
          <p className="text-xs text-gray-500 mt-0.5 font-medium">{memberCount} thành viên</p>
        </div>

        {/* Invite link */}
        <div className="px-4 py-3 border-b border-gray-100">
          <button
            onClick={handleCopyLink}
            disabled={genLink.isPending}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all border ${
              copied ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
            }`}
          >
            {copied ? (
              <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>Đã sao chép liên kết!</>
            ) : (
              <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>Sao chép liên kết mời</>
            )}
          </button>
        </div>

        {/* Settings Link */}
        {canEditInfo && (
          <div className="px-4 py-3 border-b border-gray-100">
            <button
              onClick={() => setView('SETTINGS')}
              className="w-full flex items-center justify-between py-2 px-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2.5 text-gray-700">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                <span className="text-sm font-semibold">Cài đặt nhóm</span>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        )}

        {/* Members */}
        <div className="px-4 pt-4 pb-3">
          {/* Section header */}
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Thành viên · {memberCount}</span>
            <button
              onClick={() => { setShowAdd(v => !v); setAddSearch(''); }}
              title="Thêm thành viên"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                showAdd ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
              Thêm
            </button>
          </div>

          {/* Add member search */}
          {showAdd && (
            <div className="mb-3 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200">
                <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <input
                  type="text" placeholder="Tìm người dùng..." value={addSearch}
                  onChange={e => setAddSearch(e.target.value)} autoFocus
                  className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder:text-gray-400"
                />
                {addSearch && (
                  <button onClick={() => setAddSearch('')} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                )}
              </div>
              <div className="max-h-44 overflow-y-auto custom-scrollbar">
                {searching && <div className="flex justify-center py-4"><div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"/></div>}
                {!searching && addSearch.trim() && searchResults.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">Không tìm thấy người dùng.</p>
                )}
                {!searching && !addSearch.trim() && (
                  <p className="text-xs text-gray-400 text-center py-4">Nhập tên để tìm kiếm...</p>
                )}
                {searchResults.map(p => {
                  const already = existingIds.has(p.userId);
                  return (
                    <div
                      key={p.userId}
                      onClick={() => !already && !addMember.isPending && addMember.mutate(p.userId)}
                      className={`flex items-center gap-2.5 px-3 py-2 transition-colors ${already ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 cursor-pointer'}`}
                    >
                      <Avatar src={p.avatar} name={p.fullName} size="sm" />
                      <span className="flex-1 text-sm font-medium text-gray-800 truncate">{p.fullName}</span>
                      {already ? <span className="text-[10px] text-gray-400 shrink-0">Đã có</span>
                        : <span className="text-[10px] font-semibold text-emerald-600 shrink-0">+ Thêm</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Member list */}
          <div className="space-y-0.5">
            {sortedMembers.map(member => {
              const isMe = member.userId === currentUserId;
              return (
                <div key={member.userId} className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors group">
                  <div className="relative shrink-0">
                    <Avatar
                      src={member.avatar}
                      name={member.fullName}
                      size="md"
                      className="border-2 border-white shadow-sm"
                    />
                    {member.role === 'OWNER' && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center">
                        <IconCrown />
                      </span>
                    )}
                    {member.role === 'ADMIN' && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-white">
                        <IconShield />
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate leading-snug">
                      {member.fullName || 'Người dùng'}
                      {isMe && <span className="ml-1.5 text-xs text-gray-400 font-normal">Bạn</span>}
                    </p>
                    <RoleBadge role={member.role}/>
                  </div>
                  {!isMe && (
                    <MemberMenu
                      member={member} currentUserRole={currentRole}
                      conversationId={conversation.id}
                      onAction={() => qc.invalidateQueries({ queryKey: ['conversations'] })}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="p-4 border-t border-gray-100 shrink-0 space-y-2">
        {!isOwner && (
          <button
            onClick={() => window.confirm('Bạn có chắc muốn rời khỏi nhóm này?') && leave.mutate()}
            disabled={leave.isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            Rời khỏi nhóm
          </button>
        )}
        {isOwner && (
          <button
            onClick={() => window.confirm('Giải tán nhóm? Hành động này không thể hoàn tác.') && disband.mutate()}
            disabled={disband.isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            Giải tán nhóm
          </button>
        )}
      </div>
      </>
      ) : (
      /* ── Scrollable body (SETTINGS) ── */
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/50">
        <div className="p-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Quyền thành viên</span>
            </div>
            <div className="px-4 divide-y divide-gray-100">
              <div className="flex items-center justify-between py-3.5">
                <span className="text-sm text-gray-800 font-medium">Gửi tin nhắn</span>
                <Toggle
                  checked={conversation.settings?.memberCanSendMessages ?? true}
                  onChange={v => updateSettings.mutate({ memberCanSendMessages: v })}
                  disabled={updateSettings.isPending}
                />
              </div>
              <div className="flex items-center justify-between py-3.5">
                <span className="text-sm text-gray-800 font-medium">Đổi thông tin nhóm</span>
                <Toggle
                  checked={conversation.settings?.memberCanChangeInfo ?? false}
                  onChange={v => updateSettings.mutate({ memberCanChangeInfo: v })}
                  disabled={updateSettings.isPending}
                />
              </div>
              <div className="flex items-center justify-between py-3.5">
                <span className="text-sm text-gray-800 font-medium">Ghim tin nhắn</span>
                <Toggle
                  checked={conversation.settings?.memberCanPinMessages ?? false}
                  onChange={v => updateSettings.mutate({ memberCanPinMessages: v })}
                  disabled={updateSettings.isPending}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Quản lý nhóm</span>
            </div>
            <div className="px-4 divide-y divide-gray-100">
              <div className="flex items-center justify-between py-3.5">
                <span className="text-sm text-gray-800 font-medium">Duyệt thành viên mới</span>
                <Toggle
                  checked={conversation.settings?.membershipApprovalEnabled ?? false}
                  onChange={v => updateSettings.mutate({ membershipApprovalEnabled: v })}
                  disabled={updateSettings.isPending}
                />
              </div>
              <div className="flex items-center justify-between py-3.5">
                <span className="text-sm text-gray-800 font-medium">Tham gia bằng link</span>
                <Toggle
                  checked={conversation.settings?.joinByLinkEnabled ?? true}
                  onChange={v => updateSettings.mutate({ joinByLinkEnabled: v })}
                  disabled={updateSettings.isPending}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
