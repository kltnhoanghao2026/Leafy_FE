import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../../lib/routes';
import { chatApi } from '../../api/chatApi';
import type { GroupMemberListItem } from '../../api/chatApi';
import { Avatar } from '../../../../components/ui/Avatar';
import {
  IconCrown, IconShield, RoleBadge, SectionHeader, Spinner,
  IconTransfer, IconBan, IconUserPlus,
} from './PanelShared';

// ── MemberRowMenu ─────────────────────────────────────────────────────────────
function MemberRowMenu({ member, currentRole, conversationId, isOwner }: {
  member: GroupMemberListItem;
  currentRole: string;
  conversationId: string;
  isOwner: boolean;
}) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const done = () => { qc.invalidateQueries({ queryKey: ['group-members', conversationId] }); setOpen(false); };

  const kick = useMutation({ mutationFn: () => chatApi.removeMember(conversationId, member.profileId, false), onSuccess: done });
  const promote = useMutation({ mutationFn: () => chatApi.promoteToAdmin(conversationId, member.profileId), onSuccess: done });
  const demote = useMutation({ mutationFn: () => chatApi.demoteFromAdmin(conversationId, member.profileId), onSuccess: done });
  const block = useMutation({ mutationFn: () => chatApi.blockMemberFromGroup(conversationId, member.profileId), onSuccess: done });
  const transfer = useMutation({ mutationFn: () => chatApi.transferOwnership(conversationId, member.profileId), onSuccess: () => { qc.invalidateQueries({ queryKey: ['conversations'] }); setOpen(false); } });

  const canManage =
    (currentRole === 'OWNER' && member.role !== 'OWNER') ||
    (currentRole === 'ADMIN' && member.role === 'MEMBER');
  if (!canManage) return null;
  const isPending = kick.isPending || promote.isPending || demote.isPending || block.isPending || transfer.isPending;

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
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-30 w-52 bg-white border border-gray-100 rounded-2xl shadow-2xl shadow-gray-200/60 overflow-hidden">
            <div className="px-3 py-2.5 border-b border-gray-100 bg-gray-50/80">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Quản lý thành viên</p>
              <p className="text-sm font-medium text-gray-800 truncate mt-0.5">{member.fullName}</p>
            </div>
            <div className="py-1">
              {currentRole === 'OWNER' && member.role === 'MEMBER' && (
                <button onClick={() => promote.mutate()} disabled={isPending} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-blue-700 hover:bg-blue-50 transition-colors disabled:opacity-50 font-medium">
                  <span className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0"><IconShield /></span>
                  Thêm quyền Admin
                </button>
              )}
              {currentRole === 'OWNER' && member.role === 'ADMIN' && (
                <button onClick={() => demote.mutate()} disabled={isPending} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium">
                  <span className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                  </span>
                  Hạ xuống Thành viên
                </button>
              )}
              {isOwner && (
                <button onClick={() => window.confirm('Chuyển quyền trưởng nhóm?') && transfer.mutate()} disabled={isPending} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-50 font-medium">
                  <span className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0"><IconTransfer /></span>
                  Chuyển quyền trưởng nhóm
                </button>
              )}
            </div>
            <div className="border-t border-gray-100 py-1">
              <button onClick={() => kick.mutate()} disabled={isPending} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 font-medium">
                <span className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center shrink-0 text-red-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6"/></svg>
                </span>
                Xóa khỏi nhóm
              </button>
              {(currentRole === 'OWNER' || currentRole === 'ADMIN') && member.role === 'MEMBER' && (
                <button onClick={() => window.confirm('Chặn thành viên này?') && block.mutate()} disabled={isPending} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-orange-600 hover:bg-orange-50 transition-colors disabled:opacity-50 font-medium">
                  <span className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center shrink-0"><IconBan /></span>
                  Chặn khỏi nhóm
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── GroupMembersView ──────────────────────────────────────────────────────────
export function GroupMembersView({ conversationId, currentRole, onAddMember }: {
  conversationId: string;
  currentUserId: string;
  currentRole: string;
  onAddMember: () => void;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const isOwner = currentRole === 'OWNER';

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['group-members', conversationId, debouncedQuery],
    queryFn: () => chatApi.getGroupMembers(conversationId, debouncedQuery || undefined),
    enabled: !!conversationId,
  });

  const handleSearch = (val: string) => {
    setQuery(val);
    clearTimeout((window as any)._memberSearchTimer);
    (window as any)._memberSearchTimer = setTimeout(() => setDebouncedQuery(val), 400);
  };

  const sorted = [...members].sort((a, b) => {
    const o: Record<string, number> = { OWNER: 0, ADMIN: 1, MEMBER: 2 };
    return (o[a.role] ?? 2) - (o[b.role] ?? 2);
  });

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="px-4 py-3 border-b border-gray-100 shrink-0 flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
          <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input
            type="text" placeholder="Tìm thành viên..." value={query}
            onChange={e => handleSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder:text-gray-400"
          />
        </div>
        {(isOwner || currentRole === 'ADMIN') && (
          <button onClick={onAddMember} className="flex items-center gap-1 px-2.5 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition-colors">
            <IconUserPlus /> Thêm
          </button>
        )}
      </div>

      {/* Count row */}
      <div className="px-4 py-2 shrink-0">
        <SectionHeader label={`Thành viên · ${members.length}`} />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-4">
        {isLoading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : (
          <div className="space-y-0.5">
            {sorted.map(member => (
              <div key={member.userId} className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors group">
                <div 
                  className="relative shrink-0 cursor-pointer"
                  onClick={() => navigate(ROUTES.DASHBOARD.PROFILE_VIEW(member.profileId))}
                >
                  <Avatar src={member.avatar} name={member.fullName} size="md" className="border-2 border-white shadow-sm transition-transform hover:scale-105" />
                  {member.role === 'OWNER' && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center"><IconCrown /></span>
                  )}
                  {member.role === 'ADMIN' && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-white"><IconShield /></span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p 
                    className="text-sm font-semibold text-gray-900 truncate leading-snug cursor-pointer hover:underline inline-block"
                    onClick={() => navigate(ROUTES.DASHBOARD.PROFILE_VIEW(member.profileId))}
                  >
                    {member.fullName || 'Người dùng'}
                    {member.isCurrentUser && <span className="ml-1.5 text-xs text-gray-400 font-normal hover:no-underline">Bạn</span>}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <RoleBadge role={member.role} />
                    {member.isFriend && !member.isCurrentUser && (
                      <span className="text-[10px] text-emerald-600 font-medium">Bạn bè</span>
                    )}
                  </div>
                </div>
                {!member.isCurrentUser && (
                  <MemberRowMenu
                    member={member}
                    currentRole={currentRole}
                    conversationId={conversationId}
                    isOwner={isOwner}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
