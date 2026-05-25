import { useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../../api/chatApi';
import type { ConversationResponse, GroupSettings } from '../../api/chatApi';
import { Toggle } from './PanelShared';

export function SettingsView({ conversation }: { conversation: ConversationResponse }) {
  const qc = useQueryClient();
  const updateSettings = useMutation({
    mutationFn: (s: Partial<GroupSettings>) => chatApi.updateGroupSettings(conversation.id, s),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  });

  const row = (label: string, key: keyof GroupSettings, defaultVal: boolean) => (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-gray-800 font-medium">{label}</span>
      <Toggle
        checked={(conversation.settings?.[key] as boolean) ?? defaultVal}
        onChange={v => updateSettings.mutate({ [key]: v })}
        disabled={updateSettings.isPending}
      />
    </div>
  );

  return (
    <div className="px-4 pb-2 space-y-4">
      <div>
        <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1 mt-2">Quyền thành viên</h5>
        <div className="divide-y divide-gray-50">
          {row('Gửi tin nhắn', 'memberCanSendMessages', true)}
          {row('Đổi thông tin nhóm', 'memberCanChangeInfo', false)}
          {row('Ghim tin nhắn', 'memberCanPinMessages', false)}
        </div>
      </div>
      <div>
        <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1 mt-2">Quản lý nhóm</h5>
        <div className="divide-y divide-gray-50">
          {row('Duyệt thành viên mới', 'membershipApprovalEnabled', false)}
          {row('Tham gia bằng link', 'joinByLinkEnabled', true)}
        </div>
      </div>
    </div>
  );
}
