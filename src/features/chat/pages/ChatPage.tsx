import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { chatApi } from '../api/chatApi';
import { ConversationList } from '../components/ConversationList';
import { ChatArea } from '../components/ChatArea';
import { NewDMModal } from '../components/NewDMModal';
import { CreateGroupModal } from '../components/CreateGroupModal';
import { ConversationInfoPanel } from '../components/ConversationInfoPanel';
import { useAuthStore } from '../../../store/authStore';
import { useChatWebSocket } from '../hooks/useChatWebSocket';
import { useSidebarCollapsed } from '../../../layouts/SidebarContext';

export function ChatPage() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDMModalOpen, setIsDMModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const { user } = useAuthStore();
  const currentUserId = user?.profileId || '';
  const queryClient = useQueryClient();
  const sidebarCollapsed = useSidebarCollapsed();

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatApi.getConversations(),
  });

  // WS hook — pass activeId to track which conversation the user is viewing
  const { connected } = useChatWebSocket(activeId);

  const activeConversation = conversations.find((c) => c.id === activeId) || null;

  const location = useLocation();

  // Auto-open conversation when redirected from join link page
  useEffect(() => {
    const state = location.state as { openConversationId?: string } | null;
    if (state?.openConversationId) {
      setActiveId(state.openConversationId);
      // Clear state so refreshing the page doesn't re-open it
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  const handleSelect = (id: string) => {
    setActiveId(id);
    // Open info panel only if switching to a new conversation
    if (id !== activeId) setIsInfoOpen(false);
  };

  const handleStartChat = async (partnerId: string) => {
    setIsDMModalOpen(false);
    try {
      const conv = await chatApi.getOrCreateConversation(partnerId);
      setActiveId(conv.id);
      setIsInfoOpen(false);
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

  return (
    <>
      {/* Full-viewport chat shell — sits below header (top-16) and beside sidebar */}
      <div className={`fixed inset-0 top-16 flex overflow-hidden bg-white z-10 transition-all duration-300 ${sidebarCollapsed ? 'lg:left-14' : 'lg:left-56'}`}>

        {/* Left: conversation list */}
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          onSelect={handleSelect}
          onNewChat={() => setIsDMModalOpen(true)}
          onNewGroup={() => setIsGroupModalOpen(true)}
        />

        {/* Center: chat area — takes all remaining horizontal space */}
        <ChatArea
          conversation={activeConversation}
          currentUserId={currentUserId}
          wsConnected={connected}
          onToggleInfo={() => setIsInfoOpen((v) => !v)}
          isInfoOpen={isInfoOpen}
        />

        {/* Right: info panel — sibling to ChatArea (NOT nested inside it) */}
        {/* This prevents the panel from squishing the ChatArea's flex layout */}
        {isInfoOpen && activeConversation && (
          <ConversationInfoPanel
            conversation={activeConversation}
            currentUserId={currentUserId}
            onClose={() => setIsInfoOpen(false)}
          />
        )}
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
