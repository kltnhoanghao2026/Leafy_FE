import React from 'react';
import type { MessageResponse } from '../api/chatApi';

function formatSystemMessage(metadata: Record<string, any> | null | undefined): string {
  if (!metadata) return 'Tin nhắn hệ thống';
  const action = String(metadata.action ?? '');
  const actorName = String(metadata.actorName ?? 'Ai đó');
  const targetName = metadata.targetName ? String(metadata.targetName) : '';
  const newName = metadata.newName ? String(metadata.newName) : '';
  const affectedNames: string[] = Array.isArray(metadata.affectedNames) ? metadata.affectedNames : [];
  const affectedStr = affectedNames.length > 0 ? affectedNames.join(', ') : targetName;

  switch (action) {
    case 'CREATE_GROUP':           return `${actorName} đã tạo nhóm`;
    case 'ADD_MEMBERS':            return `${actorName} đã thêm ${affectedStr} vào nhóm`;
    case 'REMOVE_MEMBER':          return `${actorName} đã xóa ${targetName || 'thành viên'} khỏi nhóm`;
    case 'LEAVE_GROUP':            return `${actorName} đã rời nhóm`;
    case 'UPDATE_NAME':            return newName ? `${actorName} đã đổi tên nhóm thành "${newName}"` : `${actorName} đã đổi tên nhóm`;
    case 'UPDATE_AVATAR':          return `${actorName} đã đổi ảnh đại diện nhóm`;
    case 'DISBAND_GROUP':          return `${actorName} đã giải tán nhóm`;
    case 'PROMOTE_ADMIN':          return `${actorName} đã cấp quyền Admin cho ${targetName}`;
    case 'DEMOTE_ADMIN':           return `${actorName} đã thu hồi quyền Admin của ${targetName}`;
    case 'TRANSFER_OWNER':         return `${actorName} đã chuyển quyền trưởng nhóm cho ${targetName}`;
    case 'JOIN_BY_LINK':           return `${actorName} đã tham gia nhóm qua link mời`;
    case 'GENERATE_JOIN_LINK':     return `${actorName} đã tạo link tham gia nhóm`;
    case 'REFRESH_JOIN_LINK':      return `${actorName} đã làm mới link tham gia nhóm`;
    case 'PIN_MESSAGE':            return `${actorName} đã ghim một tin nhắn`;
    case 'UNPIN_MESSAGE':          return `${actorName} đã bỏ ghim một tin nhắn`;
    case 'JOIN_REQUEST_CREATED':   return `${actorName} đã gửi yêu cầu tham gia nhóm`;
    case 'JOIN_REQUEST_APPROVED':  return `${targetName || actorName} đã được chấp nhận vào nhóm`;
    case 'JOIN_REQUEST_REJECTED':  return `Yêu cầu tham gia của ${targetName || actorName} đã bị từ chối`;
    case 'BLOCK_MEMBER':           return `${actorName} đã chặn ${targetName} khỏi nhóm`;
    case 'BLOCKED_FROM_JOINING':   return `Một thành viên đã bị chặn tham gia nhóm`;
    case 'UPDATE_SETTINGS':        return `${actorName} đã cập nhật cài đặt nhóm`;
    case 'ADD_MEMBERS_FAILED':     return `Không thể thêm một số thành viên vào nhóm`;
    default:                       return `${actorName} đã thực hiện một thao tác`;
  }
}

interface Props {
  msg: MessageResponse;
}

export function SystemMessageBubble({ msg }: Props) {
  const text = formatSystemMessage(msg.metadata);
  return (
    <div className="flex justify-center my-2 px-4">
      <div className="flex items-center gap-1.5 bg-gray-100 border border-gray-200/80 text-gray-500 text-[12px] px-3.5 py-1.5 rounded-full max-w-[85%] text-center leading-snug select-none">
        <svg className="w-3 h-3 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{text}</span>
      </div>
    </div>
  );
}
