import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../api/chatApi';
import { ROUTES } from '../../../lib/routes';

function AvatarStack({ previews }: { previews: { name: string; avatar: string | null }[] }) {
  const shown = previews.slice(0, 5);
  return (
    <div className="flex -space-x-2">
      {shown.map((m, i) => (
        <div key={i} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden ring-1 ring-gray-200 shrink-0">
          {m.avatar
            ? <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white text-[10px] font-bold">
                {m.name.charAt(0).toUpperCase()}
              </div>
          }
        </div>
      ))}
    </div>
  );
}

export function GroupJoinPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [joinAnswer, setJoinAnswer] = useState('');

  const { data: preview, isLoading, isError } = useQuery({
    queryKey: ['join-preview', token],
    queryFn: () => chatApi.getJoinLinkPreview(token!),
    enabled: !!token,
    retry: false,
  });

  const joinMutation = useMutation({
    mutationFn: () => chatApi.joinByLink(token!, joinAnswer || undefined),
    onSuccess: (conv) => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
      // Navigate to chat and select the conversation
      navigate(ROUTES.DASHBOARD.CHAT, { state: { openConversationId: conv.id } });
    },
  });

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">Đang tải thông tin nhóm…</p>
        </div>
      </div>
    );
  }

  // ── Error / invalid token ────────────────────────────────────────────────────
  if (isError || !preview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10 max-w-sm w-full text-center flex flex-col items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Link không hợp lệ</h2>
            <p className="text-sm text-gray-500">Link mời đã hết hạn hoặc không tồn tại. Vui lòng liên hệ quản trị viên nhóm để nhận link mới.</p>
          </div>
          <button
            onClick={() => navigate(ROUTES.DASHBOARD.CHAT)}
            className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
          >
            Quay lại Tin nhắn
          </button>
        </div>
      </div>
    );
  }

  // ── Blocked ──────────────────────────────────────────────────────────────────
  if (preview.isBlockedFromGroup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10 max-w-sm w-full text-center flex flex-col items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Bạn bị chặn</h2>
            <p className="text-sm text-gray-500">Bạn không thể tham gia nhóm <strong>{preview.groupName}</strong> vì đã bị quản trị viên chặn.</p>
          </div>
          <button onClick={() => navigate(ROUTES.DASHBOARD.CHAT)}
            className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors">
            Quay lại Tin nhắn
          </button>
        </div>
      </div>
    );
  }

  const isPending = joinMutation.isPending;
  const isSuccess = joinMutation.isSuccess;
  const isAlready = preview.isAlreadyMember;
  const hasPending = preview.hasPendingRequest;
  const needsApproval = preview.membershipApprovalEnabled;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden max-w-sm w-full">

        {/* ── Hero banner ─────────────────────────────────────────────────── */}
        <div className="relative h-24 bg-gradient-to-br from-emerald-400 to-green-600">
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
            <div className="w-16 h-16 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-white">
              {preview.groupAvatar
                ? <img src={preview.groupAvatar} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
              }
            </div>
          </div>
        </div>

        {/* ── Content ─────────────────────────────────────────────────────── */}
        <div className="pt-12 pb-7 px-7 flex flex-col items-center gap-4">
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900">{preview.groupName || 'Nhóm Leafy'}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              <span className="font-medium">{preview.memberCount}</span> thành viên
              {preview.createdByName && <> · Tạo bởi <span className="font-medium">{preview.createdByName}</span></>}
            </p>
          </div>

          {/* Member preview stack */}
          {preview.memberPreviews.length > 0 && (
            <div className="flex flex-col items-center gap-1.5">
              <AvatarStack previews={preview.memberPreviews} />
              {preview.memberCount > 5 && (
                <p className="text-xs text-gray-400">và {preview.memberCount - 5} người khác</p>
              )}
            </div>
          )}

          {/* Approval notice */}
          {needsApproval && !isAlready && !hasPending && (
            <div className="w-full bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-start gap-2">
              <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-amber-700 font-medium">Nhóm này yêu cầu xét duyệt. Yêu cầu của bạn sẽ được gửi đến quản trị viên.</p>
            </div>
          )}

          {/* Join question input */}
          {needsApproval && preview.joinQuestion && !isAlready && !hasPending && (
            <div className="w-full">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Câu hỏi từ nhóm
              </label>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-xl px-3 py-2 mb-2 border border-gray-100">{preview.joinQuestion}</p>
              <textarea
                value={joinAnswer}
                onChange={e => setJoinAnswer(e.target.value)}
                placeholder="Nhập câu trả lời của bạn…"
                rows={2}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 resize-none outline-none transition-all"
              />
            </div>
          )}

          {/* ── Action buttons ─────────────────────────────────────────── */}
          {isAlready ? (
            <button
              onClick={() => navigate(ROUTES.DASHBOARD.CHAT, { state: { openConversationId: preview.conversationId } })}
              className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Mở cuộc trò chuyện
            </button>
          ) : hasPending ? (
            <div className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-500 font-semibold text-sm text-center">
              ⏳ Đang chờ duyệt
            </div>
          ) : (
            <button
              onClick={() => joinMutation.mutate()}
              disabled={isPending || isSuccess}
              className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isPending
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Đang tham gia…</>
                : needsApproval
                  ? '📨 Gửi yêu cầu tham gia'
                  : '✅ Tham gia nhóm'
              }
            </button>
          )}

          {joinMutation.isError && (
            <p className="text-xs text-red-500 text-center font-medium">Có lỗi xảy ra. Vui lòng thử lại.</p>
          )}

          <button
            onClick={() => navigate(ROUTES.DASHBOARD.CHAT)}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Không phải bây giờ
          </button>
        </div>
      </div>
    </div>
  );
}
