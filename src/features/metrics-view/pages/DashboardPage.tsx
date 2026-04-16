import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Map,
  Radio,
  RefreshCw,
} from "lucide-react";
import { ROUTES } from "../../../lib/routes";
import { useDashboardOverview } from "../queries";
import {
  getConfiguredFarmPlotId,
  saveConfiguredFarmPlotId,
} from "../config";
import { formatDateTime, formatNumber } from "../utils/format";

interface SummaryCardProps {
  label: string;
  value: string;
  detail: string;
  icon: typeof Activity;
  iconClass: string;
  iconBgClass: string;
}

function SummaryCard({
  label,
  value,
  detail,
  icon: Icon,
  iconClass,
  iconBgClass,
}: SummaryCardProps) {
  return (
    <div className="flex items-center p-4 bg-white rounded-[2rem] border-2 border-slate-50 shadow-sm">
      <div
        className={`flex items-center justify-center w-14 h-14 rounded-full mr-4 shrink-0 ${iconBgClass}`}
      >
        <Icon className={`w-6 h-6 ${iconClass}`} strokeWidth={2.5} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">
          {label}
        </p>
        <p className="text-2xl font-black text-slate-800 leading-none">
          {value}
        </p>
        <p className="mt-2 text-xs font-semibold text-slate-500 truncate">
          {detail}
        </p>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [farmPlotId, setFarmPlotId] = useState(getConfiguredFarmPlotId);
  const [draftFarmPlotId, setDraftFarmPlotId] = useState(farmPlotId);
  const [draftZoneId, setDraftZoneId] = useState("");
  const dashboardQuery = useDashboardOverview(farmPlotId);
  const overview = dashboardQuery.data;

  const handleFarmPlotSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextFarmPlotId = draftFarmPlotId.trim();
    saveConfiguredFarmPlotId(nextFarmPlotId);
    setFarmPlotId(nextFarmPlotId);
  };

  const handleZoneSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const zoneId = draftZoneId.trim();
    if (zoneId) {
      navigate(ROUTES.DASHBOARD.ZONE_METRICS(zoneId));
    }
  };

  const hasConfiguredFarmPlot = !!farmPlotId;
  const isEmpty =
    overview &&
    overview.totalDevices === 0 &&
    overview.totalZones === 0 &&
    overview.openAlerts === 0;

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div>
          <h2 className="text-[28px] font-bold text-[#111827] tracking-tight">
            Garden overview
          </h2>
          <p className="text-[#6B7280] text-[15px] font-medium mt-1 max-w-2xl">
            Live collector counters for the configured farm plot. Zone cards
            are not shown until the backend returns zone summaries.
          </p>
        </div>

        <form
          onSubmit={handleFarmPlotSubmit}
          className="flex flex-col sm:flex-row gap-3 bg-white border border-slate-100 rounded-3xl p-3 shadow-sm"
        >
          <label className="sr-only" htmlFor="farmPlotId">
            Farm plot ID
          </label>
          <input
            id="farmPlotId"
            value={draftFarmPlotId}
            onChange={(event) => setDraftFarmPlotId(event.target.value)}
            placeholder="Farm plot ID"
            className="min-w-[280px] rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34]"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-2xl bg-[#245A34] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#1b432a]"
          >
            <RefreshCw className="mr-2 h-4 w-4" strokeWidth={2.5} />
            Load
          </button>
        </form>
      </div>

      {!hasConfiguredFarmPlot ? (
        <div className="rounded-[2rem] border-2 border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
          <Map className="mx-auto h-10 w-10 text-slate-400" />
          <h3 className="mt-4 text-xl font-black text-slate-800">
            Farm plot ID required
          </h3>
          <p className="mx-auto mt-2 max-w-xl text-sm font-semibold text-slate-500">
            Enter a backend farmPlotId to load dashboard data from
            /iot/dashboard/overview.
          </p>
        </div>
      ) : null}

      {dashboardQuery.isLoading ? (
        <div
          aria-label="Loading dashboard overview"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6"
        >
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-28 rounded-[2rem] bg-slate-100 animate-pulse"
            />
          ))}
        </div>
      ) : null}

      {dashboardQuery.isError ? (
        <div className="rounded-[2rem] border border-red-100 bg-red-50 p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-red-700">
                Dashboard data could not be loaded
              </h3>
              <p className="mt-1 text-sm font-semibold text-red-600">
                Check the farm plot ID or collector service availability.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void dashboardQuery.refetch()}
              className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" strokeWidth={2.5} />
              Retry
            </button>
          </div>
        </div>
      ) : null}

      {overview && !dashboardQuery.isError ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <SummaryCard
              label="Devices online"
              value={`${formatNumber(overview.onlineDevices)} / ${formatNumber(
                overview.totalDevices,
              )}`}
              detail={`${formatNumber(overview.offlineDevices)} offline`}
              icon={Radio}
              iconClass="text-[#245A34]"
              iconBgClass="bg-[#EAF3EA]"
            />
            <SummaryCard
              label="Zones"
              value={formatNumber(overview.totalZones)}
              detail={`Farm plot ${overview.farmPlotId}`}
              icon={Map}
              iconClass="text-blue-500"
              iconBgClass="bg-blue-50"
            />
            <SummaryCard
              label="Open alerts"
              value={formatNumber(overview.openAlerts)}
              detail="Read-only alert center"
              icon={AlertTriangle}
              iconClass="text-orange-500"
              iconBgClass="bg-orange-50"
            />
            <SummaryCard
              label="Last update"
              value={formatDateTime(overview.lastUpdatedAt)}
              detail="Collector overview"
              icon={CheckCircle2}
              iconClass="text-[#10B981]"
              iconBgClass="bg-[#ECFDF5]"
            />
          </div>

          {isEmpty ? (
            <div className="rounded-[2rem] border border-slate-100 bg-white p-8 text-center shadow-sm">
              <h3 className="text-lg font-black text-slate-800">
                No live monitoring data yet
              </h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                The collector returned zero devices, zones, and alerts for this
                farm plot.
              </p>
            </div>
          ) : null}

          <div
            className="relative w-full bg-white rounded-[2rem] border-2 border-slate-100 overflow-hidden shadow-sm p-6 lg:p-8"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, #E5E7EB 2px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          >
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 items-stretch">
              <div className="rounded-[2rem] bg-white/90 border border-slate-100 p-6 shadow-sm">
                <h3 className="text-xl font-black text-slate-900">
                  Backend-driven monitoring
                </h3>
                <p className="mt-2 text-sm font-semibold text-slate-500 leading-6">
                  This dashboard now reads collector counters only. Zone cards
                  from local mock data were removed because the overview API
                  does not return per-zone metrics.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    to={ROUTES.DASHBOARD.ALERTS}
                    className="inline-flex items-center justify-center rounded-2xl bg-[#245A34] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#1b432a]"
                  >
                    Open alert center
                  </Link>
                  <Link
                    to={ROUTES.DASHBOARD.DEVICES}
                    className="inline-flex items-center justify-center rounded-2xl border-2 border-[#245A34] bg-white px-4 py-2.5 text-sm font-bold text-[#245A34] hover:bg-green-50"
                  >
                    Manage devices
                  </Link>
                </div>
              </div>

              <form
                onSubmit={handleZoneSubmit}
                className="rounded-[2rem] bg-[#F2FCF4] p-6"
              >
                <h3 className="text-lg font-black text-[#245A34]">
                  Open zone metrics
                </h3>
                <p className="mt-2 text-sm font-semibold text-slate-600">
                  Paste a backend zoneId to inspect latest readings and charts.
                </p>
                <label className="sr-only" htmlFor="zoneId">
                  Zone ID
                </label>
                <input
                  id="zoneId"
                  value={draftZoneId}
                  onChange={(event) => setDraftZoneId(event.target.value)}
                  placeholder="Zone ID"
                  className="mt-5 w-full rounded-2xl border border-green-100 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34]"
                />
                <button
                  type="submit"
                  className="mt-3 w-full rounded-2xl bg-[#245A34] px-4 py-3 text-sm font-bold text-white hover:bg-[#1b432a]"
                >
                  View zone
                </button>
              </form>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default DashboardPage;
