import React from 'react';
import { Link } from 'react-router-dom';
import type { MessageResponse } from '../api/chatApi';
import { ROUTES } from '../../../lib/routes';

// ── Types ──────────────────────────────────────────────────────────────────────
interface NamedTarget {
  id: string;
  name: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildTargets(metadata: Record<string, unknown>): NamedTarget[] {
  const targetIds: string[] = Array.isArray(metadata.targetIds) ? metadata.targetIds as string[] : [];
  const payload: Record<string, unknown> = (metadata.payload as Record<string, unknown>) ?? {};
  const targetNames: string[] = Array.isArray(payload.targetNames) ? payload.targetNames as string[] : [];
  const targetName: string = payload.targetName ? String(payload.targetName) : '';

  if (targetIds.length === 0) return [];

  return targetIds.map((id, i) => ({
    id,
    name: targetNames[i] ?? targetName ?? 'Người dùng',
  }));
}

// Renders an inline list of clickable profile links
function TargetLinks({ targets }: { targets: NamedTarget[] }) {
  return (
    <>
      {targets.map((t, i) => (
        <React.Fragment key={t.id}>
          {i > 0 && <span>, </span>}
          <Link
            to={ROUTES.DASHBOARD.PROFILE_VIEW(t.id)}
            className="font-semibold text-gray-700 hover:text-emerald-600 hover:underline transition-colors"
            onClick={e => e.stopPropagation()}
          >
            {t.name}
          </Link>
        </React.Fragment>
      ))}
    </>
  );
}

// ── Main render ───────────────────────────────────────────────────────────────
function buildSystemContent(metadata: Record<string, unknown>): React.ReactNode {
  const action = String(metadata.action ?? '');
  const actorName = String(metadata.actorName ?? 'Ai đó');
  const payload: Record<string, unknown> = (metadata.payload as Record<string, unknown>) ?? {};
  const newName: string = payload.newName ? String(payload.newName) : '';
  const targets = buildTargets(metadata);

  const Actor = <span className="font-semibold text-gray-700">{actorName}</span>;
  const Targets = targets.length > 0
    ? <TargetLinks targets={targets} />
    : <span>thành viên</span>;

  switch (action) {
    case 'CREATE_GROUP':
      return <>{Actor} đã tạo nhóm</>;
    case 'ADD_MEMBERS':
      return <>{Actor} đã thêm {Targets} vào nhóm</>;
    case 'REMOVE_MEMBER':
      return <>{Actor} đã xóa {Targets} khỏi nhóm</>;
    case 'LEAVE_GROUP':
      return <>{Actor} đã rời nhóm</>;
    case 'UPDATE_NAME':
      return newName
        ? <>{Actor} đã đổi tên nhóm thành <span className="font-semibold text-gray-700">"{newName}"</span></>
        : <>{Actor} đã đổi tên nhóm</>;
    case 'UPDATE_AVATAR':
      return <>{Actor} đã đổi ảnh đại diện nhóm</>;
    case 'DISBAND_GROUP':
      return <>{Actor} đã giải tán nhóm</>;
    case 'PROMOTE_ADMIN':
      return <>{Actor} đã cấp quyền Admin cho {Targets}</>;
    case 'DEMOTE_ADMIN':
      return <>{Actor} đã thu hồi quyền Admin của {Targets}</>;
    case 'TRANSFER_OWNER':
      return <>{Actor} đã chuyển quyền trưởng nhóm cho {Targets}</>;
    case 'JOIN_BY_LINK':
      return <>{Actor} đã tham gia nhóm qua link mời</>;
    case 'GENERATE_JOIN_LINK':
      return <>{Actor} đã tạo link tham gia nhóm</>;
    case 'REFRESH_JOIN_LINK':
      return <>{Actor} đã làm mới link tham gia nhóm</>;
    case 'PIN_MESSAGE':
      return <>{Actor} đã ghim một tin nhắn</>;
    case 'UNPIN_MESSAGE':
      return <>{Actor} đã bỏ ghim một tin nhắn</>;
    case 'JOIN_REQUEST_CREATED':
      return <>{Actor} đã gửi yêu cầu tham gia nhóm</>;
    case 'JOIN_REQUEST_APPROVED':
      return <>{targets.length > 0 ? Targets : Actor} đã được chấp nhận vào nhóm</>;
    case 'JOIN_REQUEST_REJECTED':
      return <>Yêu cầu tham gia của {targets.length > 0 ? Targets : Actor} đã bị từ chối</>;
    case 'BLOCK_MEMBER':
      return <>{Actor} đã chặn {Targets} khỏi nhóm</>;
    case 'BLOCKED_FROM_JOINING':
      return <>Một thành viên đã bị chặn tham gia nhóm</>;
    case 'UPDATE_SETTINGS': {
      const setting = payload.setting as string | undefined;
      const value = payload.value;
      if (setting === 'memberCanSendMessages') {
        return value
          ? <>{Actor} đã <span className="font-semibold text-emerald-600">cho phép</span> tất cả thành viên nhắn tin</>
          : <>{Actor} đã <span className="font-semibold text-red-500">tắt</span> quyền nhắn tin của thành viên</>;
      }
      if (setting === 'membershipApprovalEnabled') {
        return value
          ? <>{Actor} đã bật <span className="font-semibold">xét duyệt thành viên</span></>
          : <>{Actor} đã tắt <span className="font-semibold">xét duyệt thành viên</span></>;
      }
      if (setting === 'joinByLinkEnabled') {
        return value
          ? <>{Actor} đã bật <span className="font-semibold">link mời</span></>
          : <>{Actor} đã tắt <span className="font-semibold">link mời</span></>;
      }
      return <>{Actor} đã cập nhật cài đặt nhóm</>;
    }
    case 'ADD_MEMBERS_FAILED':
      return <>Không thể thêm một số thành viên vào nhóm</>;
    default:
      return <>{Actor} đã thực hiện một thao tác</>;
  }
}

// ── Export ────────────────────────────────────────────────────────────────────
interface Props { msg: MessageResponse; }

export function SystemMessageBubble({ msg }: Props) {
  if (!msg.metadata) return null;

  const content = buildSystemContent(msg.metadata);

  return (
    <div className="flex justify-center my-2 px-4">
      <div className="flex items-center gap-1.5 bg-gray-100 border border-gray-200/80 text-gray-500 text-[12px] px-3.5 py-1.5 rounded-full max-w-[85%] text-center leading-snug">
        <svg className="w-3 h-3 shrink-0 text-gray-400 flex-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="flex flex-wrap items-center gap-x-1 gap-y-0">{content}</span>
      </div>
    </div>
  );
}
