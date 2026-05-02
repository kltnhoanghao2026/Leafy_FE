import React from 'react';
import ReactDOM from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../../lib/routes';
import { chatApi } from '../../api/chatApi';
import type { PinnedMessageInfo, JoinRequestResponse, SearchMemberResponse } from '../../api/chatApi';
import { Avatar } from '../../../../components/ui/Avatar';
import { SectionHeader, Spinner, IconPin, IconImage } from './PanelShared';


// ── PinnedMessagesView ────────────────────────────────────────────────────────
export function PinnedMessagesView({ conversationId, canPin }: { conversationId: string; canPin: boolean }) {
  const qc = useQueryClient();
  const { data: pins = [], isLoading } = useQuery({
    queryKey: ['pins', conversationId],
    queryFn: () => chatApi.getPins(conversationId),
  });
  const unpin = useMutation({
    mutationFn: (messageId: string) => chatApi.unpinMessage(conversationId, messageId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pins', conversationId] }),
  });

  const formatTime = (ts: string | null) => {
    if (!ts) return '';
    return new Date(ts).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const typeLabel = (type: string) => {
    if (type === 'IMAGE') return '📷 Hình ảnh';
    if (type === 'FILE') return '📎 Tệp đính kèm';
    return null;
  };

  if (isLoading) return <div className="flex justify-center py-6"><Spinner /></div>;

  return (
    <div className="px-4 pb-2">
      {pins.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3 text-gray-400">
            <IconPin />
          </div>
          <p className="text-sm text-gray-500 font-medium">Chưa có tin nhắn được ghim</p>
          <p className="text-xs text-gray-400 mt-1">Ghim tin nhắn quan trọng để dễ tìm lại</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pins.map((pin: PinnedMessageInfo) => (
            <div key={pin.messageId} className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <IconPin />
                    <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide">Được ghim</span>
                  </div>
                  <p className="text-sm text-gray-800 leading-snug line-clamp-2">
                    {typeLabel(pin.messageType) || pin.contentSnapshot || '(Nội dung đã bị xóa)'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-[10px] text-gray-400">bởi {pin.pinnedByName || 'Ai đó'}</span>
                    {pin.pinnedAt && <span className="text-[10px] text-gray-300">·</span>}
                    {pin.pinnedAt && <span className="text-[10px] text-gray-400">{formatTime(pin.pinnedAt)}</span>}
                  </div>
                </div>
                {canPin && (
                  <button
                    onClick={() => unpin.mutate(pin.messageId)}
                    disabled={unpin.isPending}
                    className="shrink-0 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Bỏ ghim"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── JoinRequestsView ──────────────────────────────────────────────────────────
export function JoinRequestsView({ conversationId }: { conversationId: string }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['join-requests', conversationId],
    queryFn: () => chatApi.getJoinRequests(conversationId),
  });
  const approve = useMutation({
    mutationFn: (reqId: string) => chatApi.approveJoinRequest(conversationId, reqId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['join-requests', conversationId] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
  const reject = useMutation({
    mutationFn: (reqId: string) => chatApi.rejectJoinRequest(conversationId, reqId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['join-requests', conversationId] }),
  });

  const formatTime = (ts: string | null) =>
    ts ? new Date(ts).toLocaleDateString('vi-VN') : '';

  if (isLoading) return <div className="flex justify-center py-10"><Spinner /></div>;

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4">
      <div className="py-3"><SectionHeader label={`Yêu cầu tham gia · ${requests.length}`} /></div>
      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3 text-gray-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
          </div>
          <p className="text-sm text-gray-500 font-medium">Không có yêu cầu nào</p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {requests.map((req: JoinRequestResponse) => (
            <div key={req.id} className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div 
                  className="relative shrink-0 cursor-pointer"
                  onClick={() => navigate(ROUTES.DASHBOARD.PROFILE_VIEW(req.userId))}
                >
                  <Avatar src={req.avatar} name={req.fullName} size="md" className="transition-transform hover:scale-105" />
                </div>
                <div className="flex-1 min-w-0">
                  <p 
                    className="text-sm font-semibold text-gray-900 truncate cursor-pointer hover:underline inline-block"
                    onClick={() => navigate(ROUTES.DASHBOARD.PROFILE_VIEW(req.userId))}
                  >
                    {req.fullName}
                  </p>
                  <p className="text-[10px] text-gray-400">{formatTime(req.requestedAt)}</p>
                </div>
              </div>
              {req.joinAnswer && (
                <div className="mb-2 px-2.5 py-1.5 bg-gray-50 rounded-lg text-xs text-gray-600 italic border-l-2 border-gray-200">
                  "{req.joinAnswer}"
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => approve.mutate(req.id)}
                  disabled={approve.isPending || reject.isPending}
                  className="flex-1 py-1.5 text-xs font-semibold bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                >
                  Duyệt
                </button>
                <button
                  onClick={() => reject.mutate(req.id)}
                  disabled={approve.isPending || reject.isPending}
                  className="flex-1 py-1.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Từ chối
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── BlockedMembersView ────────────────────────────────────────────────────────
export function BlockedMembersView({ conversationId }: { conversationId: string }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: blocked = [], isLoading } = useQuery({
    queryKey: ['blocked-members', conversationId],
    queryFn: () => chatApi.getBlockedMembers(conversationId),
  });
  const unblock = useMutation({
    mutationFn: (uid: string) => chatApi.unblockMemberFromGroup(conversationId, uid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blocked-members', conversationId] }),
  });

  if (isLoading) return <div className="flex justify-center py-6"><Spinner /></div>;

  return (
    <div className="px-4 pb-2">
      {blocked.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3 text-gray-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
          </div>
          <p className="text-sm text-gray-500 font-medium">Không có thành viên bị chặn</p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {blocked.map((m: SearchMemberResponse) => (
            <div key={m.userId} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors">
              <div 
                className="relative shrink-0 cursor-pointer"
                onClick={() => navigate(ROUTES.DASHBOARD.PROFILE_VIEW(m.userId))}
              >
                <Avatar src={m.avatar} name={m.fullName} size="md" className="transition-transform hover:scale-105" />
              </div>
              <div className="flex-1 min-w-0">
                <p 
                  className="text-sm font-semibold text-gray-900 truncate cursor-pointer hover:underline inline-block"
                  onClick={() => navigate(ROUTES.DASHBOARD.PROFILE_VIEW(m.userId))}
                >
                  {m.fullName}
                </p>
              </div>
              <button
                onClick={() => unblock.mutate(m.userId)}
                disabled={unblock.isPending}
                className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50 font-medium shrink-0"
              >
                Bỏ chặn
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── SharedMediaView ───────────────────────────────────────────────────────────
export function SharedMediaView({ conversationId, isFullScreen }: { conversationId: string; isFullScreen?: boolean }) {
  const PAGE_SIZE = isFullScreen ? 12 : 6;
  const [page, setPage] = React.useState(0);
  const [allItems, setAllItems] = React.useState<import('../../api/chatApi').MessageResponse[]>([]);
  const [hasMore, setHasMore] = React.useState(false);
  const [lightboxUrls, setLightboxUrls] = React.useState<string[]>([]);
  const [lightboxIdx, setLightboxIdx] = React.useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['media-messages', conversationId, 'IMAGE,VIDEO', page],
    queryFn: () => chatApi.getMediaPage(conversationId, ['IMAGE', 'VIDEO'], page, PAGE_SIZE),
  });

  React.useEffect(() => {
    if (!data) return;
    setAllItems(prev => page === 0 ? data.data : [...prev, ...data.data]);
    setHasMore(page < data.totalPages - 1);
  }, [data, page]);

  // Flatten all attachments into a url list for the lightbox
  const allImageUrls = allItems.flatMap(msg =>
    (msg.attachments ?? []).filter(a => a.contentType?.startsWith('image/')).map(a => a.url)
  );

  if (isLoading && page === 0) return <div className="flex justify-center py-6"><Spinner /></div>;

  const flatAtts = allItems.flatMap(msg =>
    (msg.attachments ?? [])
      .filter(a => a.contentType?.startsWith('image/') || a.contentType?.startsWith('video/'))
      .map(a => ({ ...a, msgType: msg.type }))
  );

  const displayAtts = isFullScreen ? flatAtts : flatAtts.slice(0, 6);
  const hasMoreMedia = data && (flatAtts.length > 6 || data.totalPages > 1);
  const extraCount = data ? (data.totalElements - displayAtts.length) : 0; // rough estimate


  return (
    <div className="px-4 pb-2">
      {flatAtts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3 text-gray-400">
            <IconImage />
          </div>
          <p className="text-sm text-gray-500 font-medium">Chưa có ảnh được chia sẻ</p>
        </div>
      ) : (
        <>
          {/* Image lightbox — portaled to body to escape panel stacking context */}
          {lightboxIdx !== null && ReactDOM.createPortal(
            <div
              className="fixed inset-0 bg-black/92 z-[9999] flex items-center justify-center"
              onClick={() => setLightboxIdx(null)}
            >
              <div className="relative max-w-[90vw] max-h-[92vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
                <img
                  src={lightboxUrls[lightboxIdx]}
                  className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg shadow-2xl"
                  alt=""
                />
                <button
                  onClick={() => setLightboxIdx(null)}
                  className="absolute -top-3 -right-3 w-8 h-8 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                {lightboxUrls.length > 1 && (
                  <>
                    <button
                      disabled={lightboxIdx === 0}
                      onClick={() => setLightboxIdx(i => Math.max(0, (i ?? 0) - 1))}
                      className="absolute left-[-48px] top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 disabled:opacity-20 text-white rounded-full flex items-center justify-center"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button
                      disabled={lightboxIdx === lightboxUrls.length - 1}
                      onClick={() => setLightboxIdx(i => Math.min(lightboxUrls.length - 1, (i ?? 0) + 1))}
                      className="absolute right-[-48px] top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 disabled:opacity-20 text-white rounded-full flex items-center justify-center"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                    <div className="absolute bottom-7 left-1/2 -translate-x-1/2 text-white/50 text-[11px] bg-black/40 px-2 py-0.5 rounded-full">
                      {lightboxIdx + 1} / {lightboxUrls.length}
                    </div>
                  </>
                )}
              </div>
            </div>,
            document.body
          )}

          {/* Thumbnail grid */}
          <div className="grid grid-cols-3 gap-1">
            {displayAtts.map((att, i) => {
              const isVideo = att.msgType === 'VIDEO' || att.contentType?.startsWith('video/');
              const imgUrl = att.url;
              const imgIdx = allImageUrls.indexOf(imgUrl);
              const isLastLimited = !isFullScreen && i === 5 && hasMoreMedia;
              return (
                <div
                  key={att.key ?? i}
                  className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative cursor-pointer group border border-gray-200/60"
                  onClick={() => {
                    if (!isVideo && !isLastLimited) {
                      setLightboxUrls(allImageUrls);
                      setLightboxIdx(imgIdx >= 0 ? imgIdx : 0);
                    }
                  }}
                >
                  {isVideo ? (
                    <video src={att.url} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={att.url} alt="" className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" />
                  )}
                  {isVideo && !isLastLimited && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      </div>
                    </div>
                  )}
                  {isLastLimited && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">+{extraCount > 0 ? extraCount : ''}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Load more */}
          {hasMore && isFullScreen && (
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={isLoading}
              className="w-full mt-3 py-2 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Đang tải...' : 'Xem thêm'}
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ── SharedFilesView ───────────────────────────────────────────────────────────
export function SharedFilesView({ conversationId, isFullScreen }: { conversationId: string; isFullScreen?: boolean }) {
  const PAGE_SIZE = isFullScreen ? 10 : 4;
  const [page, setPage] = React.useState(0);
  const [allItems, setAllItems] = React.useState<import('../../api/chatApi').MessageResponse[]>([]);
  const [hasMore, setHasMore] = React.useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['file-messages', conversationId, page],
    queryFn: () => chatApi.getFilesPage(conversationId, page, PAGE_SIZE),
  });

  React.useEffect(() => {
    if (!data) return;
    setAllItems(prev => page === 0 ? data.data : [...prev, ...data.data]);
    setHasMore(page < data.totalPages - 1);
  }, [data, page]);

  // Helpers
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const FileIcon = ({ contentType }: { contentType: string }) => {
    const cls = 'w-5 h-5';
    if (contentType?.includes('pdf')) return <svg className={`${cls} text-red-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
    if (contentType?.includes('zip') || contentType?.includes('rar') || contentType?.includes('tar')) return <svg className={`${cls} text-yellow-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
    if (contentType?.startsWith('video/')) return <svg className={`${cls} text-purple-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
    if (contentType?.startsWith('audio/')) return <svg className={`${cls} text-pink-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>;
    return <svg className={`${cls} text-blue-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
  };

  if (isLoading && page === 0) return <div className="flex justify-center py-6"><Spinner /></div>;

  const flatFiles = allItems.flatMap(msg => msg.attachments ?? []);
  const displayFiles = isFullScreen ? flatFiles : flatFiles.slice(0, 4);

  return (
    <div className="px-4 pb-2">
      {flatFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3 text-gray-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 font-medium">Chưa có tệp nào được chia sẻ</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {displayFiles.map((att, i) => (
            <a
              key={att.key ?? i}
              href={att.url}
              download={att.originalFileName}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 p-2.5 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-colors group overflow-hidden"
            >
              {/* Accent strip */}
              <div className="w-1 self-stretch rounded-full shrink-0 bg-emerald-400" />
              {/* Icon */}
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <FileIcon contentType={att.contentType} />
              </div>
              {/* Name + size */}
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-gray-800 truncate">{att.originalFileName}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{formatSize(att.size ?? 0)}</p>
              </div>
              {/* Download icon */}
              <svg className="w-3.5 h-3.5 shrink-0 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </a>
          ))}

          {/* Load more */}
          {hasMore && isFullScreen && (
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={isLoading}
              className="w-full mt-2 py-2 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Đang tải...' : 'Xem thêm'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

