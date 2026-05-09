import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../../api/chatApi';
import type { ConversationResponse } from '../../api/chatApi';
import { fileApi } from '../../../../lib/api/fileApi';
import { NavRow, Spinner, IconLink, IconCheck, IconUsers, IconClock, IconPin, CollapsibleSection } from './PanelShared';
import { PinnedMessagesView, BlockedMembersView, SharedMediaView, SharedFilesView } from './ContentViews';
import { SettingsView } from './SettingsView';

export function GroupInfoMain({ conversation, currentRole, onNavigate }: {
  conversation: ConversationResponse;
  currentUserId: string;
  currentRole: string;
  onNavigate: (v: 'MAIN' | 'ADD_MEMBER' | 'MEMBERS' | 'JOIN_REQUESTS' | 'MEDIA' | 'FILES') => void;
}) {
  const qc = useQueryClient();
  const isOwner = currentRole === 'OWNER';
  const canEditInfo = isOwner || currentRole === 'ADMIN';
  const [copied, setCopied] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(conversation.name);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const copyText = (text: string) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const genLink = useMutation({ mutationFn: () => chatApi.generateJoinLink(conversation.id), onSuccess: (token) => copyText(`${window.location.origin}/chat/join/${token}`) });
  const handleCopyLink = () => conversation.joinLinkToken ? copyText(`${window.location.origin}/chat/join/${conversation.joinLinkToken}`) : genLink.mutate();
  const updateName = useMutation({ mutationFn: (name: string) => chatApi.updateGroupName(conversation.id, name), onSuccess: () => { qc.invalidateQueries({ queryKey: ['conversations'] }); setIsEditingName(false); } });
  const updateAvatar = useMutation({ mutationFn: async (file: File) => { const res = await fileApi.uploadFileDirectToS3(file); return chatApi.updateGroupAvatar(conversation.id, res.s3Key); }, onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }) });
  const leave = useMutation({ mutationFn: () => chatApi.leaveGroup(conversation.id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['conversations'] }); } });
  const disband = useMutation({ mutationFn: () => chatApi.disbandGroup(conversation.id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['conversations'] }); } });
  const pinConv = useMutation({ mutationFn: () => chatApi.pinConversation(conversation.id), onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }) });
  const unpinConv = useMutation({ mutationFn: () => chatApi.unpinConversation(conversation.id), onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }) });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) updateAvatar.mutate(f); if (fileInputRef.current) fileInputRef.current.value = ''; };
  const handleNameSave = () => { if (editNameValue.trim() && editNameValue !== conversation.name) { updateName.mutate(editNameValue); } else { setIsEditingName(false); setEditNameValue(conversation.name); } };

  const memberCount = conversation.members?.length ?? 0;
  const pendingCount = conversation.pendingJoinRequestCount ?? 0;
  const canPin = isOwner || currentRole === 'ADMIN' || (conversation.settings?.memberCanPinMessages ?? false);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {/* Hero */}
      <div className="flex flex-col items-center pt-6 pb-5 px-4 border-b border-gray-100">
        <div className="relative mb-3 group">
          <div
            className={`w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-200 ${canEditInfo ? 'cursor-pointer' : ''}`}
            onClick={() => canEditInfo && fileInputRef.current?.click()}
          >
            {conversation.avatar
              ? <img src={conversation.avatar} alt="" className="w-full h-full object-cover" />
              : <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            }
            {canEditInfo && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </div>
            )}
          </div>
          {updateAvatar.isPending && (
            <div className="absolute inset-0 rounded-2xl bg-white/70 flex items-center justify-center z-10"><Spinner /></div>
          )}
          <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
        </div>

        {isEditingName ? (
          <div className="flex items-center gap-2 w-full max-w-[200px]">
            <input
              type="text" value={editNameValue} onChange={e => setEditNameValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleNameSave()} autoFocus
              className="flex-1 px-2 py-1 text-sm font-bold text-center text-gray-900 border-b-2 border-emerald-500 focus:outline-none bg-emerald-50 rounded-t-md"
            />
            <button onClick={handleNameSave} disabled={updateName.isPending} className="text-emerald-600 hover:text-emerald-700">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <h4 className="font-bold text-gray-900 text-base text-center">{conversation.name}</h4>
            {canEditInfo && (
              <button onClick={() => { setIsEditingName(true); setEditNameValue(conversation.name); }} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
              </button>
            )}
          </div>
        )}
        <p className="text-xs text-gray-500 mt-0.5 font-medium">{memberCount} thành viên</p>

        {/* Action Buttons */}
        <div className="flex items-center gap-6 mt-5">
          <button
            onClick={() => conversation.isPinned ? unpinConv.mutate() : pinConv.mutate()}
            disabled={pinConv.isPending || unpinConv.isPending}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              conversation.isPinned ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : 'bg-gray-100 text-gray-700 group-hover:bg-gray-200'
            }`}>
              <IconPin />
            </div>
            <span className={`text-[11px] font-medium ${conversation.isPinned ? 'text-emerald-600' : 'text-gray-600 group-hover:text-gray-900'}`}>
              {conversation.isPinned ? 'Bỏ ghim' : 'Ghim'}
            </span>
          </button>
          
          {isOwner && (
            <button
              onClick={() => window.confirm('Giải tán nhóm? Hành động này không thể hoàn tác.') && disband.mutate()}
              disabled={disband.isPending}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 group-hover:bg-red-100 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </div>
              <span className="text-[11px] font-medium text-red-600 group-hover:text-red-700">Giải tán</span>
            </button>
          )}
        </div>
      </div>

      {/* Invite link */}
      <div className="px-4 py-3 border-b border-gray-100">
        <button
          onClick={handleCopyLink} disabled={genLink.isPending}
          className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all border ${copied ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300'}`}
        >
          {copied ? <><IconCheck />Đã sao chép liên kết!</> : <><IconLink />Sao chép liên kết mời</>}
        </button>
      </div>

      {/* Quick Nav */}
      <div className="px-4 py-3 border-b border-gray-100 space-y-0.5">
        <NavRow icon={<IconUsers />} label="Thành viên" badge={memberCount} badgeType="count" onClick={() => onNavigate('MEMBERS')} />
        {canEditInfo && (
          <NavRow icon={<IconClock />} label="Yêu cầu tham gia" badge={pendingCount > 0 ? Number(pendingCount) : undefined} onClick={() => onNavigate('JOIN_REQUESTS')} />
        )}
      </div>

      {/* Collapsible Sections */}
      <div className="space-y-0 pb-4">
        <CollapsibleSection title="Ảnh & Video" defaultOpen={true} onViewAll={() => onNavigate('MEDIA')}>
          <SharedMediaView conversationId={conversation.id} />
        </CollapsibleSection>

        <CollapsibleSection title="Tệp đính kèm" defaultOpen={false} onViewAll={() => onNavigate('FILES')}>
          <SharedFilesView conversationId={conversation.id} />
        </CollapsibleSection>

        <CollapsibleSection title="Tin nhắn được ghim" defaultOpen={false}>
          <PinnedMessagesView conversationId={conversation.id} canPin={canPin} />
        </CollapsibleSection>

        {canEditInfo && (
          <CollapsibleSection title="Cài đặt nhóm" defaultOpen={false}>
            <SettingsView conversation={conversation} />
          </CollapsibleSection>
        )}

        {isOwner && (
          <CollapsibleSection title="Thành viên bị chặn" defaultOpen={false}>
            <BlockedMembersView conversationId={conversation.id} />
          </CollapsibleSection>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 space-y-2">
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
      </div>
    </div>
  );
}
