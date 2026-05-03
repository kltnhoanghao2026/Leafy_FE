import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../api/chatApi';
import type { ConversationResponse } from '../api/chatApi';
import { Avatar } from '../../../components/ui/Avatar';

interface ConversationListProps {
  conversations: ConversationResponse[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onNewGroup: () => void;
}

function formatTimestamp(ts: string | null | undefined): string {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Hôm qua';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

function GroupIcon() {
  return (
    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-green-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
      </svg>
    </div>
  );
}

export function ConversationList({ conversations, activeId, onSelect, onNewChat, onNewGroup }: ConversationListProps) {
  const qc = useQueryClient();
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const { data: fetchedPinned = [] } = useQuery({
    queryKey: ['pinnedConversations'],
    queryFn: chatApi.getPinnedConversations,
  });

  const pinMutation = useMutation({
    mutationFn: (id: string) => chatApi.pinConversation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pinnedConversations'] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
      setMenuOpenId(null);
    }
  });

  const unpinMutation = useMutation({
    mutationFn: (id: string) => chatApi.unpinConversation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pinnedConversations'] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
      setMenuOpenId(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => chatApi.deleteConversation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
      setMenuOpenId(null);
    }
  });

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Bạn có chắc muốn xóa cuộc trò chuyện này?')) {
      deleteMutation.mutate(id);
    }
  };

  const pinnedIds = new Set(fetchedPinned.map(c => c.id));
  const normalList = conversations.filter(c => !pinnedIds.has(c.id));
  const displayConversations = [
    ...fetchedPinned.map(c => ({ ...c, isPinned: true })), 
    ...normalList
  ];

  return (
    <div className="w-80 border-r border-gray-200/60 bg-white/50 backdrop-blur-sm flex flex-col h-full shrink-0 z-10">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Tin nhắn</h2>
        <div className="flex items-center gap-1.5">
          {/* New DM */}
          <button
            onClick={onNewChat}
            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
            title="Tin nhắn mới"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          {/* New group */}
          <button
            onClick={onNewGroup}
            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
            title="Tạo nhóm mới"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
        {displayConversations.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center h-full opacity-60">
            <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm text-gray-500 font-medium">Chưa có tin nhắn</p>
            <p className="text-xs text-gray-400 mt-1">Nhấn + để bắt đầu trò chuyện</p>
          </div>
        ) : (
          <div className="p-2 space-y-0.5">
            {displayConversations.map((conv) => {
              const isSelected = activeId === conv.id;
              const isDisbanded = conv.isDisbanded;
              const memberCount = conv.members?.length ?? 0;

              // Last message preview text
              let lastText = 'Bắt đầu trò chuyện...';
              if (isDisbanded) lastText = 'Nhóm đã giải tán';
              else if (conv.lastMessage?.content) {
                lastText = conv.isGroup && conv.lastMessage.senderName
                  ? `${conv.lastMessage.senderName}: ${conv.lastMessage.content}`
                  : conv.lastMessage.content;
              }

              return (
                <div
                  key={conv.id}
                  onClick={() => !isDisbanded && onSelect(conv.id)}
                  onMouseLeave={() => setMenuOpenId(null)}
                  className={`relative flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200 group ${
                    isDisbanded ? 'opacity-50 cursor-default' :
                    isSelected ? 'bg-green-50/80 shadow-sm ring-1 ring-green-100' : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <Avatar
                      src={conv.avatar}
                      name={conv.name}
                      size="xl"
                      className={`border-2 transition-colors ${
                        isSelected ? 'border-green-200' : 'border-transparent group-hover:border-gray-200'
                      }`}
                    />
                    {conv.isGroup && <GroupIcon />}

                    {conv.unreadCount > 0 && !isDisbanded && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                        {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <h3 className={`text-sm font-semibold truncate pr-2 flex items-center gap-1.5 ${isSelected ? 'text-green-900' : 'text-gray-900'}`}>
                        {conv.isPinned && (
                          <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                          </svg>
                        )}
                        <span className="truncate">{conv.name || 'Người dùng ẩn danh'}</span>
                      </h3>
                      <span className="text-[10px] text-gray-400 font-medium shrink-0 text-right">
                        {formatTimestamp(conv.lastMessage?.timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 pr-6">

                      <p className={`text-xs truncate ${
                        conv.unreadCount > 0 && !isDisbanded
                          ? 'text-gray-900 font-semibold'
                          : isDisbanded ? 'text-red-400 italic' : 'text-gray-500'
                      }`}>
                        {lastText}
                      </p>
                    </div>
                  </div>

                  {/* Actions Menu */}
                  <div className={`absolute right-3 bottom-2.5 transition-opacity ${menuOpenId === conv.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === conv.id ? null : conv.id); }}
                      className="flex items-center justify-center p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-400/20 rounded transition-colors"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" /></svg>
                    </button>
                    
                    {menuOpenId === conv.id && (
                      <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 py-1.5 z-[100] animate-in fade-in zoom-in-95 duration-100">
                        {conv.isPinned ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              unpinMutation.mutate(conv.id);
                            }}
                            disabled={unpinMutation.isPending}
                            className="w-full text-left px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors disabled:opacity-50"
                          >
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            Bỏ ghim
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              pinMutation.mutate(conv.id);
                            }}
                            disabled={pinMutation.isPending}
                            className="w-full text-left px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors disabled:opacity-50"
                          >
                            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" /></svg>
                            Ghim hội thoại
                          </button>
                        )}
                        <div className="h-px bg-gray-100 my-1 mx-2" />
                        <button
                          onClick={(e) => handleDelete(e, conv.id)}
                          disabled={deleteMutation.isPending}
                          className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors disabled:opacity-50"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          Xóa hội thoại
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
