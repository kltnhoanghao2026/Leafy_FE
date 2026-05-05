import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../../lib/apiClient';
import { API_ENDPOINTS } from '../../../../lib/routes';
import { chatApi } from '../../api/chatApi';
import type { ConversationResponse } from '../../api/chatApi';
import { Avatar } from '../../../../components/ui/Avatar';
import { Spinner } from './PanelShared';

interface Profile { id: string; userId: string; fullName: string; avatar: string; role: string; }

export function AddMemberView({ conversation }: { conversation: ConversationResponse }) {
  const [search, setSearch] = useState('');
  const qc = useQueryClient();
  const existingIds = new Set((conversation.members || []).map(m => m.userId));

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['panel-search', search],
    queryFn: async () => {
      const res = await apiClient.get<any>(API_ENDPOINTS.PROFILES.SEARCH, { params: { searchTerm: search, page: 0, size: 20 } });
      return (res.data?.data?.content || res.data?.content || []) as Profile[];
    },
    enabled: search.trim().length > 0,
  });

  const addMember = useMutation({
    mutationFn: (profileId: string) => chatApi.addMembers(conversation.id, [profileId]),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  });

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
          <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input
            autoFocus type="text" placeholder="Tìm người dùng..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder:text-gray-400"
          />
        </div>
      </div>
      <div className="p-2">
        {isLoading && <div className="flex justify-center py-6"><Spinner /></div>}
        {!isLoading && search.trim() && results.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">Không tìm thấy người dùng</p>
        )}
        {!search.trim() && <p className="text-sm text-gray-400 text-center py-8">Nhập tên để tìm kiếm...</p>}
        {results.map(p => {
          const already = existingIds.has(p.userId);
          return (
            <div
              key={p.id}
              onClick={() => !already && !addMember.isPending && addMember.mutate(p.id)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors ${already ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}`}
            >
              <Avatar src={p.avatar} name={p.fullName} size="md" />
              <span className="flex-1 text-sm font-medium text-gray-800 truncate">{p.fullName}</span>
              {already
                ? <span className="text-[10px] text-gray-400 shrink-0">Đã có</span>
                : <span className="text-[10px] font-semibold text-emerald-600 shrink-0">+ Thêm</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
