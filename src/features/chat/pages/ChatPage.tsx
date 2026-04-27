import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../api/chatApi';
import { ConversationList } from '../components/ConversationList';
import { ChatArea } from '../components/ChatArea';
import { NewDMModal } from '../components/NewDMModal';
import { CreateGroupModal } from '../components/CreateGroupModal';
import { GroupInfoPanel } from '../components/GroupInfoPanel';
import { useAuthStore } from '../../../store/authStore';

export function ChatPage() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDMModalOpen, setIsDMModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const { user } = useAuthStore();
  const currentUserId = user?.id || '';
  const queryClient = useQueryClient();

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatApi.getConversations(),
    refetchInterval: 5000,
  });

  const activeConversation = conversations.find((c) => c.id === activeId) || null;

  const handleSelect = (id: string) => {
    if (id !== activeId) setIsInfoOpen(false);
    setActiveId(id);
  };

  const handleStartChat = async (partnerId: string) => {
    setIsDMModalOpen(false);
    try {
      const conv = await chatApi.getOrCreateConversation(partnerId);
      setIsInfoOpen(false);
      setActiveId(conv.id);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    } catch (error) {
      console.error('Failed to start chat', error);
    }
  };

  const handleGroupCreated = (conversationId: string) => {
    setIsGroupModalOpen(false);
    setIsInfoOpen(false);
    setActiveId(conversationId);
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  };

  const showInfoPanel = isInfoOpen && activeConversation?.isGroup;

  return (
    <>
      <div className="fixed inset-0 top-16 lg:left-64 flex overflow-hidden bg-white z-10">
        <div className="flex-1 flex h-full w-full min-w-0 relative">

          <ConversationList
            conversations={conversations}
            activeId={activeId}
            onSelect={handleSelect}
            onNewChat={() => setIsDMModalOpen(true)}
            onNewGroup={() => setIsGroupModalOpen(true)}
          />

          <ChatArea
            conversation={activeConversation}
            currentUserId={currentUserId}
            onToggleInfo={() => setIsInfoOpen((v) => !v)}
            isInfoOpen={showInfoPanel}
          />

          {showInfoPanel && activeConversation && (
            <GroupInfoPanel
              conversation={activeConversation}
              currentUserId={currentUserId}
              onClose={() => setIsInfoOpen(false)}
            />
          )}
        </div>
      </div>

      {/* Modals — in root stacking context so z-50 covers the header */}
      <NewDMModal
        isOpen={isDMModalOpen}
        onClose={() => setIsDMModalOpen(false)}
        onStartChat={handleStartChat}
      />
      <CreateGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onGroupCreated={handleGroupCreated}
      />
    </>
  );
}