import { useState } from 'react';
import type { ConversationResponse } from '../api/chatApi';
import { IconClose, IconChevronLeft } from './panel/PanelShared';
import { AddMemberView } from './panel/AddMemberView';
import { GroupInfoMain } from './panel/GroupInfoMain';
import { DmInfoMain } from './panel/DmInfoMain';

import { GroupMembersView } from './panel/MembersView';
import { JoinRequestsView, SharedMediaView, SharedFilesView } from './panel/ContentViews';

type PanelView = 'MAIN' | 'ADD_MEMBER' | 'MEMBERS' | 'JOIN_REQUESTS' | 'MEDIA' | 'FILES';

interface Props { conversation: ConversationResponse; currentUserId: string; onClose: () => void; }

const VIEW_TITLES: Record<PanelView, string> = {
  MAIN: 'Thông tin hội thoại',
  ADD_MEMBER: 'Thêm thành viên',
  MEMBERS: 'Thành viên',
  JOIN_REQUESTS: 'Yêu cầu tham gia',
  MEDIA: 'Ảnh & Video',
  FILES: 'Tệp đính kèm',
};

// ── Main ConversationInfoPanel ─────────────────────────────────────────────────
export function ConversationInfoPanel({ conversation, currentUserId, onClose }: Props) {
  const [view, setView] = useState<PanelView>('MAIN');
  // currentUserId is now a profileId — members.userId also stores profileId
  const currentRole = conversation.members?.find(m => m.profileId === currentUserId)?.role ?? 'MEMBER';

  const goBack = () => setView('MAIN');

  const renderBody = () => {
    if (view === 'MAIN') {
      return conversation.isGroup
        ? <GroupInfoMain conversation={conversation} currentUserId={currentUserId} currentRole={currentRole} onNavigate={setView} />
        : <DmInfoMain conversation={conversation} currentUserId={currentUserId} onNavigate={setView} />;
    }
    if (view === 'ADD_MEMBER') return <AddMemberView conversation={conversation} />;
    if (view === 'MEMBERS') return <GroupMembersView conversationId={conversation.id} currentUserId={currentUserId} currentRole={currentRole} onAddMember={() => setView('ADD_MEMBER')} />;
    if (view === 'JOIN_REQUESTS') return <JoinRequestsView conversationId={conversation.id} />;
    if (view === 'MEDIA') return <div className="flex-1 overflow-y-auto"><SharedMediaView conversationId={conversation.id} isFullScreen /></div>;
    if (view === 'FILES') return <div className="flex-1 overflow-y-auto"><SharedFilesView conversationId={conversation.id} isFullScreen /></div>;
    return null;
  };

  return (
    <div className="w-96 border-l border-gray-200/60 bg-white flex flex-col h-full shrink-0 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-2">
          {view !== 'MAIN' && (
            <button onClick={goBack} className="p-1 -ml-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <IconChevronLeft />
            </button>
          )}
          <span className="text-sm font-bold text-gray-800 tracking-tight">{VIEW_TITLES[view]}</span>
        </div>
        <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <IconClose />
        </button>
      </div>

      {renderBody()}
    </div>
  );
}
