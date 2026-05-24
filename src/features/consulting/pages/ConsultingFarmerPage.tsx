import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  TreePine,
  CalendarDays,
  ClipboardList,
  MapPin,
  Sprout,
  ShieldCheck,
  ShieldOff,
  Calendar,
} from 'lucide-react';
import { ROUTES } from '../../../lib/routes';
import {
  useConsultingFarmers,
  useConsultingFarmerSummaryBulk,
} from '../queries/consulting.queries';
import { usePrivacySettingsByProfileId } from '../../settings/queries';
import { Avatar } from '../../../components/ui/Avatar';
import { FarmPlotsTab } from '../components/FarmPlotsTab';
import { PlantsTab } from '../components/PlantsTab';
import { CalendarTab } from '../components/CalendarTab';
import { PlanningTab } from '../components/PlanningTab';
import type { ConsultationRequestResponse } from '../../profiles/api/profilesApi';

// ── Types ─────────────────────────────────────────────────────────────────────

type MainTab = 'profile' | 'info' | 'calendar' | 'planning';
type InfoTab = 'plots' | 'plants';

// ── Sharing Badge ───────────────────────────────────────────────────────────────

interface SharingBadgeProps {
  icon: React.ReactNode;
  label: string;
  enabled: boolean;
}

function SharingBadge({ icon, label, enabled }: SharingBadgeProps) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
        enabled
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
          : 'bg-slate-100 text-slate-400 border border-slate-200'
      }`}
    >
      <span className={enabled ? 'text-emerald-600' : 'text-slate-400'}>{icon}</span>
      <span className="truncate">{label}</span>
      {enabled ? (
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 ml-auto shrink-0" strokeWidth={2.5} />
      ) : (
        <ShieldOff className="w-3.5 h-3.5 text-slate-400 ml-auto shrink-0" strokeWidth={2.5} />
      )}
    </div>
  );
}

// ── TabBar ────────────────────────────────────────────────────────────────────

interface TabBarProps<T extends string> {
  tabs: { id: T; label: string; icon?: React.ReactNode }[];
  active: T;
  onChange: (id: T) => void;
}

function TabBar<T extends string>({ tabs, active, onChange }: TabBarProps<T>) {
  return (
    <div className="flex overflow-x-auto overflow-y-hidden border-b border-slate-100 px-2 sm:px-3">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-bold transition-all border-b-2 -mb-px ${
            active === tab.id
              ? 'border-[#245A34] text-[#245A34]'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200'
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function ConsultingFarmerPage() {
  const { farmerProfileId } = useParams<{ farmerProfileId: string }>();
  const fid = farmerProfileId ?? '';

  const [mainTab, setMainTab] = useState<MainTab>('profile');
  const [infoTab, setInfoTab] = useState<InfoTab>('plots');

  const { data: farmers } = useConsultingFarmers();
  const { data: summaryMap } = useConsultingFarmerSummaryBulk(fid ? [fid] : [], !!fid);
  const { data: privacySettings } = usePrivacySettingsByProfileId(fid);

  const farmer = useMemo(
    () =>
      ((farmers ?? []) as ConsultationRequestResponse[]).find(
        (f) => f.followerId === fid,
      ),
    [farmers, fid],
  );
  const summary = summaryMap?.[fid];

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-5">
      {/* Back nav + breadcrumb */}
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Link
          to={ROUTES.DASHBOARD.CONSULTING}
          className="flex items-center gap-1.5 text-slate-500 hover:text-[#245A34] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
          Nông dân tư vấn
        </Link>
        {farmer && (
          <>
            <span className="text-slate-300">/</span>
            <Avatar
              src={farmer.followerAvatar || undefined}
              name={farmer.followerName}
              size="sm"
              className="shrink-0"
            />
            <span className="text-slate-800">{farmer.followerName}</span>
          </>
        )}
      </div>

      {/* Main tab container */}
      <div
        className={`flex flex-col rounded-2xl border border-slate-100 bg-white shadow-sm ${mainTab === 'calendar' ? 'flex-1 min-h-150 overflow-hidden' : ''}`}
      >
        <TabBar
          tabs={[
            {
              id: 'profile' as MainTab,
              label: 'Hồ sơ',
              icon: <User className="w-4 h-4" strokeWidth={2.5} />,
            },
            {
              id: 'info' as MainTab,
              label: 'Thông tin',
              icon: <TreePine className="w-4 h-4" strokeWidth={2.5} />,
            },
            {
              id: 'calendar' as MainTab,
              label: 'Lịch sự kiện',
              icon: <CalendarDays className="w-4 h-4" strokeWidth={2.5} />,
            },
            {
              id: 'planning' as MainTab,
              label: 'Kế hoạch',
              icon: <ClipboardList className="w-4 h-4" strokeWidth={2.5} />,
            },
          ]}
          active={mainTab}
          onChange={setMainTab}
        />

        <div
          className={`p-4 sm:p-6 flex flex-col ${mainTab === 'calendar' ? 'flex-1 min-h-0' : ''}`}
        >
          {mainTab === 'profile' && (
            <div className="flex flex-col gap-6">
              {/* Identity */}
              <div className="flex items-center gap-5">
                {farmer ? (
                  <Avatar
                    src={farmer.followerAvatar || undefined}
                    name={farmer.followerName}
                    size="xl"
                    className="shrink-0"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-100">
                    <User className="w-7 h-7 text-slate-400" strokeWidth={2} />
                  </div>
                )}
                <div className="min-w-0">
                  {farmer ? (
                    <>
                      <h2 className="truncate text-2xl font-black tracking-tight text-slate-800">
                        {farmer.followerName}
                      </h2>
                      <p className="mt-0.5 text-sm capitalize text-slate-500">
                        {farmer.followerRole?.toLowerCase() ?? 'Nông dân'}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="h-7 w-48 rounded-lg bg-slate-100 animate-pulse" />
                      <div className="mt-1.5 h-4 w-24 rounded-md bg-slate-100 animate-pulse" />
                    </>
                  )}
                </div>
              </div>

              {/* Stats — only shown when at least one data category is shared */}
              {(privacySettings?.shareFarmPlotsWithConsultants || privacySettings?.sharePlantsWithConsultants || privacySettings?.sharePlantEventsWithConsultants) && (
                <div className="grid grid-cols-3 gap-3 sm:max-w-sm">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Vườn</p>
                    <p className="text-2xl font-black text-slate-800">{summary?.plotCount ?? '—'}</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Khu</p>
                    <p className="text-2xl font-black text-slate-800">{summary?.zoneCount ?? '—'}</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Cây</p>
                    <p className="text-2xl font-black text-slate-800">{summary?.plantCount ?? '—'}</p>
                  </div>
                </div>
              )}

              {/* Privacy Sharing Status */}
              {privacySettings && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="w-4 h-4 text-[#245A34]" strokeWidth={2.5} />
                    <p className="text-xs font-black uppercase tracking-wide text-slate-600">
                      Chia sẻ dữ liệu với chuyên gia
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <SharingBadge
                      icon={<MapPin className="w-3.5 h-3.5" />}
                      label="Trang trại"
                      enabled={privacySettings.shareFarmPlotsWithConsultants}
                    />
                    <SharingBadge
                      icon={<Sprout className="w-3.5 h-3.5" />}
                      label="Cây trồng"
                      enabled={privacySettings.sharePlantsWithConsultants}
                    />
                    <SharingBadge
                      icon={<Calendar className="w-3.5 h-3.5" />}
                      label="Sự kiện"
                      enabled={privacySettings.sharePlantEventsWithConsultants}
                    />
                    <SharingBadge
                      icon={<ClipboardList className="w-3.5 h-3.5" />}
                      label="Kế hoạch"
                      enabled={privacySettings.sharePlansWithConsultants}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {mainTab === 'info' && (
            <>
              {/* Info sub-tabs */}
              <div className="flex gap-1 bg-slate-50 rounded-xl p-1 self-start">
                {[
                  {
                    id: 'plots' as InfoTab,
                    label: 'Trang trại',
                    icon: <MapPin className="w-3.5 h-3.5" strokeWidth={2.5} />,
                  },
                  {
                    id: 'plants' as InfoTab,
                    label: 'Cây trồng',
                    icon: <Sprout className="w-3.5 h-3.5" strokeWidth={2.5} />,
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setInfoTab(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                      infoTab === tab.id
                        ? 'bg-white text-[#245A34] shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {infoTab === 'plots' && <FarmPlotsTab farmerProfileId={fid} privacySettings={privacySettings} />}
              {infoTab === 'plants' && <PlantsTab farmerProfileId={fid} privacySettings={privacySettings} />}
            </>
          )}

          {mainTab === 'calendar' && <CalendarTab farmerProfileId={fid} privacySettings={privacySettings} />}
          {mainTab === 'planning' && <PlanningTab farmerProfileId={fid} privacySettings={privacySettings} />}
        </div>
      </div>
    </div>
  );
}
