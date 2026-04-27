import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';
import { API_ENDPOINTS } from '../../../lib/routes';
import { fileApi } from '../../../lib/api/fileApi';
import { chatApi } from '../api/chatApi';

interface Profile {
  id: string;
  userId: string;
  fullName: string;
  avatar: string;
  role: string;
}

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (conversationId: string) => void;
}

export function CreateGroupModal({ isOpen, onClose, onGroupCreated }: CreateGroupModalProps) {
  const queryClient = useQueryClient();
  const [groupName, setGroupName] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Profile[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Search via PROFILES.SEARCH (same as DM modal)
  const { data: searchResults = [], isLoading: memberLoading } = useQuery({
    queryKey: ['group-member-search', memberSearch],
    queryFn: async () => {
      if (!memberSearch.trim()) return [];
      const res = await apiClient.get<any>(API_ENDPOINTS.PROFILES.SEARCH, {
        params: { searchTerm: memberSearch, page: 0, size: 20 },
      });
      return (res.data?.data?.content || res.data?.content || []) as Profile[];
    },
    enabled: memberSearch.trim().length > 0,
  });

  const createGroupMutation = useMutation({
    mutationFn: async () => {
      let avatarUrl: string | undefined;
      if (avatarFile) {
        setIsUploadingAvatar(true);
        try {
          const res = await fileApi.uploadFileDirectToS3(avatarFile);
          avatarUrl = res.s3Key;
        } finally {
          setIsUploadingAvatar(false);
        }
      }
      return chatApi.createGroup({
        name: groupName.trim(),
        avatar: avatarUrl,
        memberIds: selectedMembers.map((m) => m.userId),
      });
    },
    onSuccess: (conv) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      onGroupCreated(conv.id);
      handleClose();
    },
  });

  const toggleMember = (member: Profile) => {
    setSelectedMembers((prev) =>
      prev.some((m) => m.userId === member.userId)
        ? prev.filter((m) => m.userId !== member.userId)
        : [...prev, member]
    );
  };

  const isSelected = (userId: string) => selectedMembers.some((m) => m.userId === userId);

  const handleClose = () => {
    setGroupName('');
    setMemberSearch('');
    setSelectedMembers([]);
    setAvatarFile(null);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
    onClose();
  };

  const canCreate = groupName.trim().length >= 2 && selectedMembers.length >= 2;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 overflow-hidden">

        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white/80 backdrop-blur-md shrink-0">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Tạo nhóm mới</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Group name and Avatar */}
        <div className="px-5 pt-4 pb-3 border-b border-gray-100 shrink-0">
          <div className="flex gap-4 items-center">
            <div className="relative shrink-0">
              <label className="cursor-pointer group block">
                <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center relative">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Group Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                  <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center transition-all">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setAvatarFile(file);
                      setAvatarPreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </label>
            </div>
            <div className="flex-1">
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
          </div>
          <p className="text-xs text-gray-400 mt-2">Tối thiểu 2 ký tự. Cần chọn ít nhất 2 thành viên.</p>
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
              placeholder="Tìm người dùng để thêm vào nhóm..."
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
          ) : searchResults.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              {memberSearch.trim() ? 'Không tìm thấy người dùng.' : 'Nhập tên để tìm kiếm người dùng...'}
            </div>
          ) : (
            <div className="space-y-1">
              {searchResults.map((member) => (
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
            disabled={!canCreate || createGroupMutation.isPending || isUploadingAvatar}
            onClick={() => createGroupMutation.mutate()}
            className="w-full py-3 text-sm font-semibold text-white bg-green-600 rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:hover:bg-green-600 transition-all flex items-center justify-center gap-2"
          >
            {createGroupMutation.isPending || isUploadingAvatar ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Tạo nhóm {selectedMembers.length >= 2 && `(${selectedMembers.length + 1} thành viên)`}
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
