import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../../lib/routes';
import { chatApi } from '../../api/chatApi';
import type { ConversationResponse } from '../../api/chatApi';
import { Avatar } from '../../../../components/ui/Avatar';
import { CollapsibleSection, IconPin } from './PanelShared';
import { PinnedMessagesView, SharedMediaView, SharedFilesView } from './ContentViews';

export function DmInfoMain({ conversation, currentUserId, onNavigate }: { conversation: ConversationResponse, currentUserId: string, onNavigate: (v: 'MAIN' | 'ADD_MEMBER' | 'MEMBERS' | 'JOIN_REQUESTS' | 'MEDIA' | 'FILES') => void }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const deleteConv = useMutation({
    mutationFn: () => chatApi.deleteConversation(conversation.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  });
  const pinConv = useMutation({
    mutationFn: () => chatApi.pinConversation(conversation.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  });
  const unpinConv = useMutation({
    mutationFn: () => chatApi.unpinConversation(conversation.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  });

  const partner = conversation.members?.find(m => m.userId !== currentUserId);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {/* Hero */}
      <div className="flex flex-col items-center pt-6 pb-5 px-4 border-b border-gray-100">
        <div className="relative mb-3 cursor-pointer" onClick={() => partner && navigate(ROUTES.DASHBOARD.PROFILE_VIEW(partner.userId))}>
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
            <Avatar src={conversation.avatar} name={conversation.name} className="!w-full !h-full transition-transform hover:scale-105" />
          </div>
        </div>
        <h4 
          className="font-bold text-gray-900 text-lg text-center cursor-pointer hover:underline"
          onClick={() => partner && navigate(ROUTES.DASHBOARD.PROFILE_VIEW(partner.userId))}
        >
          {conversation.name}
        </h4>

        {/* Action Buttons */}
        <div className="flex items-center gap-6 mt-5">
          <button
            onClick={() => partner && navigate(ROUTES.DASHBOARD.PROFILE_VIEW(partner.userId))}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 group-hover:bg-gray-200 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="text-[11px] font-medium text-gray-600 group-hover:text-gray-900">Trang cá nhân</span>
          </button>

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
        </div>
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
          <PinnedMessagesView conversationId={conversation.id} canPin={true} />
        </CollapsibleSection>
      </div>

      {/* Danger zone */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={() => window.confirm('Xóa cuộc trò chuyện này?') && deleteConv.mutate()}
          disabled={deleteConv.isPending}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          Xóa hội thoại
        </button>
      </div>
    </div>
  );
}
