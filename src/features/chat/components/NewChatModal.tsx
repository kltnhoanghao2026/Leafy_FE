import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';
import { API_ENDPOINTS } from '../../../lib/routes';
import { chatApi } from '../api/chatApi';
import { ModalShell } from '../../../components/ui/ModalShell';
import type { ProfileResponse } from '../../profiles/api/profilesApi';

// ─── Profile type for DM search ───────────────────────────────────────────────
type Profile = ProfileResponse;

// ─── Props ────────────────────────────────────────────────────────────────────
interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChat: (userId: string) => void;
  onGroupCreated: (conversationId: string) => void;
}

// ─── Wizard steps ─────────────────────────────────────────────────────────────
type Tab = 'dm' | 'group';

// ─── Component ────────────────────────────────────────────────────────────────
export function NewChatModal({ isOpen, onClose, onStartChat, onGroupCreated }: NewChatModalProps) {
  const queryClient = useQueryClient();

  // DM tab state
  const [tab, setTab] = useState<Tab>('dm');
  const [searchTerm, setSearchTerm] = useState('');

  // Group panel state
  const [groupName, setGroupName] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Profile[]>([]);

  // ── DM user search ──
  const { data: profilesRaw, isLoading: dmLoading } = useQuery({
    queryKey: ['profile-search', searchTerm],
    queryFn: async () => {
      if (!searchTerm.trim()) return [];
      const res = await apiClient.get<{ data?: { content?: Profile[] }; content?: Profile[] }>(API_ENDPOINTS.PROFILES.SEARCH, {
        params: { searchTerm, page: 0, size: 20 },
      });
      return res.data?.data?.content || res.data?.content || [];
    },
    enabled: tab === 'dm' && searchTerm.trim().length > 0,
  });
  const profiles = profilesRaw || [];

  // ── Group member search — same PROFILES.SEARCH API as DM tab ──
  const { data: groupSearchResults = [], isLoading: memberLoading } = useQuery({
    queryKey: ['group-member-search', memberSearch],
    queryFn: async () => {
      if (!memberSearch.trim()) return [];
      const res = await apiClient.get<{ data?: { content?: Profile[] }; content?: Profile[] }>(API_ENDPOINTS.PROFILES.SEARCH, {
        params: { searchTerm: memberSearch, page: 0, size: 20 },
      });
      return res.data?.data?.content || res.data?.content || [];
    },
    enabled: tab === 'group' && memberSearch.trim().length > 0,
  });


  // ── Group create mutation ──
  const createGroupMutation = useMutation({
    mutationFn: () =>
      chatApi.createGroup({
        name: groupName.trim(),
        memberIds: selectedMembers.map((m) => m.userId),
      }),
    onSuccess: (conv) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      onGroupCreated(conv.id);
      handleClose();
    },
  });

  // ── Helpers ──
  const toggleMember = (member: Profile) => {
    setSelectedMembers((prev) =>
      prev.some((m) => m.userId === member.userId)
        ? prev.filter((m) => m.userId !== member.userId)
        : [...prev, member]
    );
  };

  const isSelected = (userId: string) =>
    selectedMembers.some((m) => m.userId === userId);

  const handleClose = () => {
    setTab('dm');
    setSearchTerm('');
    setGroupName('');
    setMemberSearch('');
    setSelectedMembers([]);
    onClose();
  };

  const canProceedStep1 = groupName.trim().length >= 2;
  const canProceedStep2 = selectedMembers.length >= 1;

  if (!isOpen) return null;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <ModalShell
      onClose={handleClose}
      title={tab === 'dm' ? 'Tin nhắn mới' : 'Tạo nhóm mới'}
      maxWidth="max-w-md"
      headerClassName="bg-white/80 backdrop-blur-md"
    >

        {/* Tab switcher */}
        <div className="flex border-b border-gray-100 shrink-0">
          {(['dm', 'group'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); }}
              className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${
                tab === t ? 'text-green-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'dm' ? (
                <span className="flex items-center justify-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Nhắn tin
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Tạo nhóm
                </span>
              )}
              {tab === t && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* ── DM TAB ── */}
        {tab === 'dm' && (
          <>
            <div className="p-4 border-b border-gray-50 bg-gray-50/30 shrink-0">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm người dùng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 text-sm transition-all shadow-sm"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
              {dmLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-4" />
                  <p className="text-sm font-medium">Đang tìm kiếm...</p>
                </div>
              ) : profiles.length > 0 ? (
                <div className="space-y-1">
                  {profiles.map((profile: Profile) => (
                    <div
                      key={profile.userId}
                      onClick={() => onStartChat(profile.userId)}
                      className="flex items-center p-3 hover:bg-gray-50 cursor-pointer rounded-xl transition-colors group"
                    >
                      <img
                        src={profile.avatar || `https://i.pravatar.cc/150?u=${profile.userId}`}
                        alt={profile.fullName}
                        className="w-12 h-12 rounded-full object-cover border border-gray-200 group-hover:border-green-300 transition-colors"
                      />
                      <div className="ml-4 flex-1">
                        <h4 className="text-sm font-bold text-gray-900 group-hover:text-green-700 transition-colors">{profile.fullName}</h4>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">{profile.role}</p>
                      </div>
                      <svg className="w-5 h-5 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  ))}
                </div>
              ) : searchTerm.trim() ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-sm font-medium">Không tìm thấy người dùng.</p>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <svg className="mx-auto h-12 w-12 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-sm font-medium">Nhập tên để tìm kiếm người dùng...</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── GROUP TAB ── */}
        {tab === 'group' && (
          <>
            {/* Group name */}
            <div className="px-5 pt-4 pb-3 border-b border-gray-100 shrink-0">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tên nhóm</label>
              <input
                type="text"
                placeholder="VD: Nhóm Nông nghiệp xanh..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                maxLength={50}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 text-sm transition-all"
                autoFocus
              />
            </div>

            {/* Selected chips */}
            {selectedMembers.length > 0 && (
              <div className="px-4 pt-3 pb-2 flex flex-wrap gap-2 border-b border-gray-100 shrink-0 max-h-24 overflow-y-auto custom-scrollbar">
                {selectedMembers.map((m) => (
                  <span key={m.userId} className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                    <img src={m.avatar || `https://i.pravatar.cc/40?u=${m.userId}`} alt="" className="w-4 h-4 rounded-full" />
                    {m.fullName}
                    <button onClick={() => toggleMember(m)} className="text-green-400 hover:text-red-500 transition-colors">✕</button>
                  </span>
                ))}
              </div>
            )}

            {/* Member search */}
            <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/30 shrink-0">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Tìm bạn bè..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 text-sm transition-all"
                />
              </div>
            </div>

            {/* Member list */}
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
              {memberLoading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-green-600" />
                </div>
              ) : groupSearchResults.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                  {memberSearch.trim() ? 'Không tìm thấy người dùng.' : 'Nhập tên để tìm kiếm người dùng...'}
                </div>
              ) : (
                <div className="space-y-1">
                  {groupSearchResults.map((member) => (
                    <div
                      key={member.userId}
                      onClick={() => toggleMember(member)}
                      className={`flex items-center p-3 rounded-xl transition-all cursor-pointer ${
                        isSelected(member.userId) ? 'bg-green-50 ring-1 ring-green-200' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <img
                          src={member.avatar || `https://i.pravatar.cc/150?u=${member.userId}`}
                          alt={member.fullName}
                          className="w-10 h-10 rounded-full object-cover border border-gray-200"
                        />
                        {isSelected(member.userId) && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-green-600 rounded-full flex items-center justify-center border-2 border-white">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{member.fullName}</p>
                        <p className="text-xs text-gray-400">{member.role}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 transition-all shrink-0 flex items-center justify-center ${
                        isSelected(member.userId) ? 'bg-green-600 border-green-600' : 'border-gray-300'
                      }`}>
                        {isSelected(member.userId) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>


            {/* Create button */}
            <div className="p-4 border-t border-gray-100 shrink-0">
              <button
                disabled={!canProceedStep1 || !canProceedStep2 || createGroupMutation.isPending}
                onClick={() => createGroupMutation.mutate()}
                className="w-full py-3 text-sm font-semibold text-white bg-green-600 rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:hover:bg-green-600 transition-all flex items-center justify-center gap-2"
              >
                {createGroupMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Tạo nhóm {selectedMembers.length > 0 && `(${selectedMembers.length + 1} thành viên)`}
                  </>
                )}
              </button>
            </div>
          </>
        )}

    </ModalShell>
  );
}
