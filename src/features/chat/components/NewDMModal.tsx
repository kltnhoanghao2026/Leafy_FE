import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';
import { API_ENDPOINTS } from '../../../lib/routes';

interface Profile {
  id: string;
  userId: string;
  fullName: string;
  avatar: string;
  role: string;
}

interface NewDMModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChat: (userId: string) => void;
}

export function NewDMModal({ isOpen, onClose, onStartChat }: NewDMModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: profilesRaw = [], isLoading } = useQuery({
    queryKey: ['profile-search', searchTerm],
    queryFn: async () => {
      if (!searchTerm.trim()) return [];
      const res = await apiClient.get<any>(API_ENDPOINTS.PROFILES.SEARCH, {
        params: { searchTerm, page: 0, size: 20 },
      });
      return (res.data?.data?.content || res.data?.content || []) as Profile[];
    },
    enabled: searchTerm.trim().length > 0,
  });

  const handleClose = () => {
    setSearchTerm('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 overflow-hidden">

        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white/80 backdrop-blur-md shrink-0">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Tin nhắn mới</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
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

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-4" />
              <p className="text-sm font-medium">Đang tìm kiếm...</p>
            </div>
          ) : profilesRaw.length > 0 ? (
            <div className="space-y-1">
              {profilesRaw.map((profile: Profile) => (
                <div
                  key={profile.userId}
                  onClick={() => { onStartChat(profile.userId); handleClose(); }}
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

      </div>
    </div>
  );
}
