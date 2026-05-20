import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profilesApi } from "../../profiles/api/profilesApi";
import type { ConsultingDataAccessRequestResponse } from "../../profiles/api/profilesApi";
import { Avatar } from "../../../components/ui/Avatar";
import { Loader2, Check, X, MessageSquare, MapPin, Leaf, ClipboardList, Sprout } from "lucide-react";
import { useTranslation } from "../../../i18n";

const DATA_TYPE_CONFIG: Record<string, { label: string; labelVi: string; Icon: React.ElementType }> = {
  FARM_PLOTS: { label: "Farm Plots & Zones", labelVi: "Thửa ruộng & Khu vực", Icon: MapPin },
  PLANTS: { label: "Plants", labelVi: "Cây trồng", Icon: Leaf },
  PLANT_EVENTS: { label: "Plant Events", labelVi: "Sự kiện cây trồng", Icon: ClipboardList },
  PLANS: { label: "Treatment Plans", labelVi: "Kế hoạch điều trị", Icon: Sprout },
};

interface PendingAccessRequestsProps {
  compact?: boolean;
}

export function PendingAccessRequests({ compact = false }: PendingAccessRequestsProps) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const isVi = i18n?.language === "vi";

  const { data, isLoading, error } = useQuery({
    queryKey: ["consulting-access-requests", "pending"],
    queryFn: () => profilesApi.getPendingAccessRequests({ size: 50 }),
    select: (r) => r.data.data?.content ?? [],
  });

  const approve = useMutation({
    mutationFn: (requestId: string) => profilesApi.approveAccessRequest(requestId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["consulting-access-requests"] }),
  });

  const deny = useMutation({
    mutationFn: (requestId: string) => profilesApi.denyAccessRequest(requestId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["consulting-access-requests"] }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-[#245A34]" />
      </div>
    );
  }

  if (error || !data || data.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {!compact && (
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare className="w-4 h-4 text-[#245A34]" />
          <p className="text-sm font-bold text-slate-700">
            {isVi ? "Yêu cầu truy cập từ chuyên gia" : "Expert Access Requests"}
          </p>
        </div>
      )}
      {data.map((request) => (
        <AccessRequestCard
          key={request.id}
          request={request}
          onApprove={approve.mutate}
          onDeny={deny.mutate}
          isApproving={approve.isPending}
          isDenying={deny.isPending}
          isVi={isVi}
        />
      ))}
    </div>
  );
}

interface AccessRequestCardProps {
  request: ConsultingDataAccessRequestResponse;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
  isApproving: boolean;
  isDenying: boolean;
  isVi: boolean;
}

function AccessRequestCard({
  request,
  onApprove,
  onDeny,
  isApproving,
  isDenying,
  isVi,
}: AccessRequestCardProps) {
  const { t } = useTranslation();
  const config = DATA_TYPE_CONFIG[request.dataType] ?? {
    label: request.dataType,
    labelVi: request.dataType,
    Icon: Leaf,
  };
  const { Icon } = config;

  return (
    <div className="border border-[#245A34]/20 bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <Avatar
          src={request.expertAvatar ?? undefined}
          name={request.expertName ?? ""}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800">
            {request.expertName ?? "Expert"}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {isVi ? "yêu cầu truy cập" : "requests access to"}
            {" "}
            <span className="font-semibold text-[#245A34]">
              {isVi ? config.labelVi : config.label}
            </span>
          </p>
          {request.expertMessage && (
            <p className="text-xs text-slate-600 italic mt-2 bg-slate-50 rounded-lg px-3 py-2">
              "{request.expertMessage}"
            </p>
          )}
        </div>
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#245A34]/10 shrink-0">
          <Icon className="w-4 h-4 text-[#245A34]" strokeWidth={2} />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 mt-3">
        <button
          type="button"
          onClick={() => onDeny(request.id)}
          disabled={isApproving || isDenying}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          {isDenying ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <X className="w-3.5 h-3.5" />
          )}
          {isVi ? "Từ chối" : "Deny"}
        </button>
        <button
          type="button"
          onClick={() => onApprove(request.id)}
          disabled={isApproving || isDenying}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#245A34] hover:bg-[#1e4a2c] transition-colors disabled:opacity-50"
        >
          {isApproving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
          {isVi ? "Chấp thuận" : "Approve"}
        </button>
      </div>
    </div>
  );
}
