import { useState } from 'react';
import { Check, Clock, Inbox, X } from 'lucide-react';
import { Avatar } from '../../../components/ui/Avatar';
import { useTranslation } from '../../../i18n/useTranslation';
import { profilesApi } from '../../profiles/api/profilesApi';
import type {
  ConsultationRequestResponse,
  ConsultingDataAccessRequestResponse,
  ConsultingDataType,
} from '../../profiles/api/profilesApi';
import { toPageResponse } from '../../plant-management/shared/api/apiUtils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/* ─── Helpers ─────────────────────────────────────────────────────────── */

function formatDate(isoString: string | null | undefined) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const DATA_TYPE_LABELS: Record<ConsultingDataType, string> = {
  FARM_PLOTS: 'Thửa ruộng',
  PLANTS: 'Cây trồng',
  PLANT_EVENTS: 'Sự kiện cây trồng',
  PLANS: 'Kế hoạch điều trị',
};

/* ─── Consultation Requests Section ─────────────────────────────────────── */

function ConsultationRequestsSection() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);
  const [processId, setProcessId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['settings', 'consulting', 'requests', 'pending', page, pageSize],
    queryFn: async () => {
      const res = await profilesApi.getPendingConsultations({ page, size: pageSize });
      const d = res.data;
      if (d && typeof d === 'object' && 'data' in d) {
        return toPageResponse<ConsultationRequestResponse>(d.data);
      }
      return toPageResponse<ConsultationRequestResponse>([]);
    },
  });

  const respondMutation = useMutation({
    mutationFn: ({ followerId, accept }: { followerId: string; accept: boolean }) =>
      profilesApi.respondToConsultation(followerId, accept),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['settings', 'consulting', 'requests', 'pending'],
      });
    },
  });

  const requests = data?.content ?? [];

  const handleRespond = (followerId: string, accept: boolean) => {
    setProcessId(followerId);
    respondMutation.mutate({ followerId, accept });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="h-10 w-10 rounded-full bg-slate-100 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 rounded bg-slate-100 animate-pulse" />
              <div className="h-3 w-1/4 rounded bg-slate-100 animate-pulse" />
            </div>
            <div className="h-9 w-24 rounded-xl bg-slate-100 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-center">
        <p className="text-sm font-bold text-red-700">{t('settings.consulting.loadError')}</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
          <Inbox className="h-6 w-6" strokeWidth={2} />
        </div>
        <p className="mt-3 text-sm font-bold text-slate-700">{t('settings.consulting.consultation.empty')}</p>
        <p className="mt-1 text-xs font-medium text-slate-400">{t('settings.consulting.consultation.emptyDesc')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => {
        const processing = processId === request.followerId && respondMutation.isPending;
        return (
          <div
            key={request.connectionId}
            className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:border-emerald-100"
          >
            <Avatar
              src={request.followerAvatar || undefined}
              name={request.followerName}
              size="md"
              className="border border-slate-200 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-900">{request.followerName}</p>
              <p className="flex items-center gap-1 text-xs font-semibold text-slate-400">
                <Clock className="h-3 w-3 shrink-0" strokeWidth={2} />
                {formatDate(request.requestedAt)}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                disabled={!!processId}
                onClick={() => handleRespond(request.followerId, true)}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-[#245A34] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#1a4226] disabled:opacity-50"
              >
                {processing ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                    {t('settings.consulting.accept')}
                  </>
                )}
              </button>
              <button
                type="button"
                disabled={!!processId}
                onClick={() => handleRespond(request.followerId, false)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                {t('settings.consulting.reject')}
              </button>
            </div>
          </div>
        );
      })}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          {page > 0 && (
            <button
              type="button"
              onClick={() => setPage((p) => p - 1)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50"
            >
              {t('common.previousPage') ?? 'Previous'}
            </button>
          )}
          <span className="text-xs font-semibold text-slate-500">
            {page + 1} / {data.totalPages}
          </span>
          {page < data.totalPages - 1 && (
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50"
            >
              {t('common.nextPage') ?? 'Next'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Data Access Requests Section ─────────────────────────────────────── */

function DataAccessRequestsSection() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);
  const [processId, setProcessId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['settings', 'consulting', 'access', 'pending', page, pageSize],
    queryFn: async () => {
      const res = await profilesApi.getPendingAccessRequests({ page, size: pageSize });
      const d = res.data;
      if (d && typeof d === 'object' && 'data' in d) {
        return toPageResponse<ConsultingDataAccessRequestResponse>(d.data);
      }
      return toPageResponse<ConsultingDataAccessRequestResponse>([]);
    },
  });

  const approveMutation = useMutation({
    mutationFn: (requestId: string) => profilesApi.approveAccessRequest(requestId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['settings', 'consulting', 'access', 'pending'],
      });
    },
  });

  const denyMutation = useMutation({
    mutationFn: (requestId: string) => profilesApi.denyAccessRequest(requestId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['settings', 'consulting', 'access', 'pending'],
      });
    },
  });

  const requests = data?.content ?? [];

  const handleRespond = (requestId: string, approve: boolean) => {
    setProcessId(requestId);
    if (approve) {
      approveMutation.mutate(requestId);
    } else {
      denyMutation.mutate(requestId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="h-10 w-10 rounded-full bg-slate-100 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 rounded bg-slate-100 animate-pulse" />
              <div className="h-3 w-1/2 rounded bg-slate-100 animate-pulse" />
            </div>
            <div className="h-9 w-24 rounded-xl bg-slate-100 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-center">
        <p className="text-sm font-bold text-red-700">{t('settings.consulting.loadError')}</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
          <Inbox className="h-6 w-6" strokeWidth={2} />
        </div>
        <p className="mt-3 text-sm font-bold text-slate-700">{t('settings.consulting.dataAccess.empty')}</p>
        <p className="mt-1 text-xs font-medium text-slate-400">{t('settings.consulting.dataAccess.emptyDesc')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => {
        const processing = processId === request.id;
        const isPending = approveMutation.isPending || denyMutation.isPending;
        return (
          <div
            key={request.id}
            className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:border-emerald-100"
          >
            <Avatar
              src={request.expertAvatar || undefined}
              name={request.expertName || undefined}
              size="md"
              className="border border-slate-200 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-900">
                {request.expertName || t('common.unknown')}
              </p>
              <p className="truncate text-xs font-semibold text-slate-500">
                {DATA_TYPE_LABELS[request.dataType] ?? request.dataType}
              </p>
              <p className="flex items-center gap-1 text-xs font-semibold text-slate-400">
                <Clock className="h-3 w-3 shrink-0" strokeWidth={2} />
                {formatDate(request.requestedAt)}
              </p>
              {request.expertMessage && (
                <p className="mt-1 truncate rounded-lg bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 italic">
                  "{request.expertMessage}"
                </p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                disabled={!!processId && processing}
                onClick={() => handleRespond(request.id, true)}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-[#245A34] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#1a4226] disabled:opacity-50"
              >
                {(processing && approveMutation.isPending) ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                    {t('settings.consulting.approve')}
                  </>
                )}
              </button>
              <button
                type="button"
                disabled={!!processId && processing}
                onClick={() => handleRespond(request.id, false)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                {t('settings.consulting.deny')}
              </button>
            </div>
          </div>
        );
      })}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          {page > 0 && (
            <button
              type="button"
              onClick={() => setPage((p) => p - 1)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50"
            >
              {t('common.previousPage') ?? 'Previous'}
            </button>
          )}
          <span className="text-xs font-semibold text-slate-500">
            {page + 1} / {data.totalPages}
          </span>
          {page < data.totalPages - 1 && (
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50"
            >
              {t('common.nextPage') ?? 'Next'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────────── */

export function ConsultingRequestsSettingsCard() {
  const { t } = useTranslation();

  return (
    <section className="bg-[var(--app-card)] rounded-[24px] p-5 shadow-sm border border-slate-100">
      <div className="mb-5">
        <h2 className="text-base font-black text-slate-900">{t('settings.consulting.title')}</h2>
        <p className="mt-1 text-sm font-medium text-slate-500">{t('settings.consulting.subtitle')}</p>
      </div>

      <div className="space-y-8">
        {/* Consultation Requests */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
            {t('settings.consulting.consultation.title')}
          </h3>
          <ConsultationRequestsSection />
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100" />

        {/* Data Access Requests */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
            {t('settings.consulting.dataAccess.title')}
          </h3>
          <DataAccessRequestsSection />
        </div>
      </div>
    </section>
  );
}
