import { useEffect } from 'react';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { ModalShell } from '../../../../components/ui/ModalShell';
import { useDeletableChildren, useDeleteWithChildrenMutation } from '../queries/plant-event.queries';
import type { PlantEventResponse } from '../../shared/types';

interface DeleteEventModalProps {
  event: PlantEventResponse;
  onClose: () => void;
  zIndex?: string;
}

export function DeleteEventModal({ event, onClose, zIndex }: DeleteEventModalProps) {
  const childrenQuery = useDeletableChildren(event.id);
  const deleteMutation = useDeleteWithChildrenMutation();

  // Close modal after successful delete
  useEffect(() => {
    if (deleteMutation.isSuccess) {
      onClose();
    }
  }, [deleteMutation.isSuccess, onClose]);

  const handleConfirm = () => {
    deleteMutation.mutate({ eventId: event.id, confirmDelete: true });
  };

  const isLoading = childrenQuery.isLoading || deleteMutation.isPending;
  const hasChildren = (childrenQuery.data?.length ?? 0) > 1;
  const childrenToDelete = (childrenQuery.data ?? []).filter(e => e.id !== event.id);

  return (
    <ModalShell
      onClose={onClose}
      zIndex={zIndex}
      icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
      iconBg="bg-red-50"
      title="Xóa lịch chăm sóc"
      subtitle={
        <p className="text-sm text-slate-500 mt-0.5">
          Sự kiện này có sự kiện con đã hoàn thành. Bạn có chắc muốn xóa không?
        </p>
      }
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang xóa...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Xóa
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="px-6 py-4 space-y-4">
        {childrenQuery.isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
          </div>
        ) : childrenQuery.isError ? (
          <p className="text-sm text-red-500 text-center">Không thể tải danh sách sự kiện con.</p>
        ) : (
          <>
            {/* Parent event */}
            <div className="rounded-xl border border-red-100 bg-red-50/60 p-3">
              <p className="text-xs font-semibold text-red-600 mb-1">Sự kiện đang xóa</p>
              <p className="text-sm font-semibold text-slate-800">{event.note || event.eventType}</p>
              {event.calculatedStartDate && (
                <p className="text-xs text-slate-500 mt-0.5">
                  {event.calculatedStartDate}{event.calculatedEndDate ? ` → ${event.calculatedEndDate}` : ''}
                </p>
              )}
            </div>

            {/* Children to be deleted */}
            {hasChildren ? (
              <>
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-2">
                    {childrenToDelete.length} sự kiện con đã hoàn thành cũng sẽ bị xóa:
                  </p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {childrenToDelete.map(child => (
                      <div
                        key={child.id}
                        className="flex items-center gap-2.5 rounded-lg border border-slate-100 bg-white px-3 py-2.5"
                      >
                        <Trash2 className="h-3.5 w-3.5 shrink-0 text-red-400" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-700 truncate">
                            {child.note || child.eventType}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {child.calculatedStartDate}
                            {child.calculatedEndDate && ` → ${child.calculatedEndDate}`}
                            {child.plant?.nickName && ` · ${child.plant.nickName}`}
                            {child.farmZone?.zoneName && ` · ${child.farmZone.zoneName}`}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-600">
                          Hoàn thành
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <p className="text-sm text-slate-600">
                  Không có sự kiện con nào đã hoàn thành để xóa.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </ModalShell>
  );
}
