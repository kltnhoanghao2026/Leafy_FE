import { useState } from "react";
import {
  AlertTriangle,
  Users,
  Sprout,
  Leaf,
  MessageSquare,
  FlaskConical,
  BadgeCheck,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2,
  TriangleAlert,
} from "lucide-react";
import {
  useSeedAccounts,
  useSeedFarms,
  useSeedPlants,
  useSeedSpeciesPerenual,
  useSeedCommunity,
  useSeedCertificates,
} from "./seeding.queries";

function NumInput({
  label,
  value,
  onChange,
  min = 1,
  max,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min?: number;
  max?: number;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-500">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
      />
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-800 tabular-nums">
        {value.toLocaleString()}
      </span>
    </div>
  );
}

function ConfirmBanner({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex flex-col gap-2">
      <div className="flex items-start gap-2 text-sm text-amber-800">
        <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
        <span>{message}</span>
      </div>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-3 py-1 text-xs rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
        >
          Huỷ
        </button>
        <button
          onClick={onConfirm}
          className="px-3 py-1 text-xs rounded-md bg-amber-600 text-white hover:bg-amber-700 font-medium"
        >
          Xác nhận xoá & tái tạo
        </button>
      </div>
    </div>
  );
}

// ── Seeder Card ──────────────────────────────────────────────────────────────

interface SeederCardProps {
  step?: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  destructive?: boolean;
  isPending: boolean;
  children: React.ReactNode; // param inputs
  result: React.ReactNode; // result breakdown
  onRun: () => void;
  confirmMessage?: string;
}

function SeederCard({
  step,
  icon,
  title,
  description,
  destructive = false,
  isPending,
  children,
  result,
  onRun,
  confirmMessage,
}: SeederCardProps) {
  const [confirming, setConfirming] = useState(false);

  function handleRunClick() {
    if (destructive && confirmMessage) {
      setConfirming(true);
    } else {
      onRun();
    }
  }

  function handleConfirm() {
    setConfirming(false);
    onRun();
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50">
        {step != null && (
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold shrink-0">
            {step}
          </span>
        )}
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 text-sm leading-tight">
            {title}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            {description}
          </p>
        </div>
        {destructive && (
          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 ring-1 ring-red-200">
            <AlertTriangle className="w-3 h-3" />
            Xoá & tái tạo
          </span>
        )}
      </div>

      {/* Body */}
      <div className="px-5 py-4 flex flex-col gap-4">
        {/* Params */}
        {children}

        {/* Confirm banner */}
        {confirming && confirmMessage && (
          <ConfirmBanner
            message={confirmMessage}
            onConfirm={handleConfirm}
            onCancel={() => setConfirming(false)}
          />
        )}

        {/* Run button */}
        {!confirming && (
          <button
            onClick={handleRunClick}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang chạy...
              </>
            ) : (
              "Chạy Seeder"
            )}
          </button>
        )}

        {/* Result */}
        {result}
      </div>
    </div>
  );
}

// ── Result panels ────────────────────────────────────────────────────────────

function ResultPanel({
  title,
  children,
  ok,
}: {
  title: string;
  children: React.ReactNode;
  ok: boolean;
}) {
  return (
    <div
      className={`rounded-lg border px-4 py-3 ${ok ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}
    >
      <div className="flex items-center gap-2 mb-2">
        {ok ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        ) : (
          <XCircle className="w-4 h-4 text-red-500" />
        )}
        <span className="text-xs font-semibold text-slate-700">{title}</span>
      </div>
      <div className="divide-y divide-slate-100">{children}</div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DataSeedingPage() {
  // ── Account seeder state
  const [accountCount, setAccountCount] = useState("100");
  const seedAccounts = useSeedAccounts();
  const accountResult = seedAccounts.data?.data?.data;

  // ── Farm seeder state
  const [plotsPerProfile, setPlotsPerProfile] = useState("");
  const [zonesPerPlot, setZonesPerPlot] = useState("");
  const seedFarms = useSeedFarms();
  const farmResult = seedFarms.data?.data?.data;

  // ── Plant seeder state
  const [speciesCount, setSpeciesCount] = useState("");
  const [plantCount, setPlantCount] = useState("");
  const [eventsPerPlant, setEventsPerPlant] = useState("");
  const seedPlants = useSeedPlants();
  const plantResult = seedPlants.data?.data?.data;

  // ── Species/Perenual seeder state
  const [perenualStartPage, setPerenualStartPage] = useState("1");
  const [perenualPages, setPerenualPages] = useState("1");
  const [perenualPerPage, setPerenualPerPage] = useState("30");
  const seedSpeciesPerenual = useSeedSpeciesPerenual();
  const perenualResult = seedSpeciesPerenual.data?.data?.data;

  // ── Community seeder
  const seedCommunity = useSeedCommunity();
  const communityResult = seedCommunity.data?.data?.data;

  // ── Certificate seeder state
  const [certRequestCount, setCertRequestCount] = useState("20");
  const [certsPerRequest, setCertsPerRequest] = useState("2");
  const seedCertificates = useSeedCertificates();
  const certResult = seedCertificates.data?.data?.data;

  function toOptInt(s: string): number | undefined {
    const n = parseInt(s, 10);
    return isNaN(n) ? undefined : n;
  }

  return (
    <div className="p-4 flex flex-col gap-5 max-w-5xl mx-auto">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Khởi tạo dữ liệu</h1>
        <p className="text-sm text-slate-500 mt-1">
          Tạo dữ liệu mẫu cho môi trường phát triển và kiểm thử.
        </p>
      </div>

      {/* Destructive warning */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <span className="font-semibold">Chú ý:</span> Các seeder có nhãn{" "}
          <span className="font-medium text-red-600">Xoá &amp; tái tạo</span> sẽ{" "}
          <span className="font-semibold">xoá toàn bộ dữ liệu hiện tại</span>{" "}
          rồi tái tạo từ đầu. Chỉ sử dụng trong môi trường{" "}
          <span className="font-semibold">development / staging</span>. Thứ tự
          khuyến nghị:{" "}
          <span className="font-semibold">
            Tài khoản → Nông trại → Cây trồng → Cộng đồng
          </span>
          .
        </div>
      </div>

      {/* Dependency flow */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
        {[
          { label: "1. Tài khoản", color: "bg-emerald-100 text-emerald-700" },
          { label: "2. Nông trại", color: "bg-sky-100 text-sky-700" },
          { label: "3. Cây trồng", color: "bg-violet-100 text-violet-700" },
          { label: "4. Cộng đồng", color: "bg-rose-100 text-rose-700" },
          { label: "5. Chứng chỉ", color: "bg-amber-100 text-amber-700" },
        ].map((step, i, arr) => (
          <span key={step.label} className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-full font-semibold ${step.color}`}
            >
              {step.label}
            </span>
            {i < arr.length - 1 && (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            )}
          </span>
        ))}
        <span className="ml-2 text-slate-400 font-normal">
          • Perenual API (độc lập)
        </span>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 1. Accounts */}
        <SeederCard
          step={1}
          icon={<Users className="w-4 h-4" />}
          title="Tài khoản & Hồ sơ"
          description="Tạo tài khoản người dùng và hồ sơ tương ứng. Cần chạy đầu tiên."
          isPending={seedAccounts.isPending}
          onRun={() => seedAccounts.mutate(parseInt(accountCount, 10) || 100)}
          result={
            accountResult && (
              <ResultPanel title="Kết quả seeder tài khoản" ok>
                <StatRow
                  label="Tài khoản tạo mới"
                  value={accountResult.created}
                />
                <StatRow
                  label="Bỏ qua (đã tồn tại)"
                  value={accountResult.skipped}
                />
                <StatRow
                  label="Hồ sơ tạo mới"
                  value={accountResult.profileCreated}
                />
                <StatRow
                  label="Kafka events"
                  value={accountResult.eventsPublished}
                />
                {accountResult.seededPassword && (
                  <div className="pt-1 text-xs text-slate-500">
                    Mật khẩu mặc định:{" "}
                    <code className="font-mono bg-white px-1 rounded border border-slate-200">
                      {accountResult.seededPassword}
                    </code>
                  </div>
                )}
              </ResultPanel>
            )
          }
        >
          <div className="grid grid-cols-1 gap-3">
            <NumInput
              label="Số lượng tài khoản"
              value={accountCount}
              onChange={setAccountCount}
              min={1}
              max={5000}
              placeholder="Mặc định: 100"
            />
          </div>
        </SeederCard>

        {/* 2. Farms */}
        <SeederCard
          step={2}
          icon={<Sprout className="w-4 h-4" />}
          title="Nông trại (Mảnh đất & Vùng)"
          description="Xoá toàn bộ mảnh đất & vùng, tái tạo dựa trên hồ sơ thực từ DB."
          destructive
          confirmMessage="Thao tác này sẽ XOÁ toàn bộ mảnh đất và vùng hiện tại, sau đó tạo lại từ đầu. Tiếp tục?"
          isPending={seedFarms.isPending}
          onRun={() =>
            seedFarms.mutate({
              plotsPerProfile: toOptInt(plotsPerProfile),
              zonesPerPlot: toOptInt(zonesPerPlot),
            })
          }
          result={
            farmResult && (
              <ResultPanel title="Kết quả seeder nông trại" ok>
                <StatRow
                  label="Mảnh đất đã xoá"
                  value={farmResult.deletedPlotCount}
                />
                <StatRow
                  label="Vùng đã xoá"
                  value={farmResult.deletedZoneCount}
                />
                <StatRow
                  label="Mảnh đất tạo mới"
                  value={farmResult.seededPlotCount}
                />
                <StatRow
                  label="Vùng tạo mới"
                  value={farmResult.seededZoneCount}
                />
                <StatRow
                  label="Hồ sơ làm nguồn"
                  value={farmResult.sourceProfileCount}
                />
              </ResultPanel>
            )
          }
        >
          <div className="grid grid-cols-2 gap-3">
            <NumInput
              label="Mảnh đất / hồ sơ"
              value={plotsPerProfile}
              onChange={setPlotsPerProfile}
              min={1}
              placeholder="Mặc định: 2"
            />
            <NumInput
              label="Vùng / mảnh đất"
              value={zonesPerPlot}
              onChange={setZonesPerPlot}
              min={1}
              placeholder="Mặc định: 3"
            />
          </div>
        </SeederCard>

        {/* 3. Plants */}
        <SeederCard
          step={3}
          icon={<Leaf className="w-4 h-4" />}
          title="Cây trồng & Sự kiện"
          description="Xoá toàn bộ cây trồng & sự kiện, tái tạo dựa trên nông trại thực."
          destructive
          confirmMessage="Thao tác này sẽ XOÁ toàn bộ cây trồng và sự kiện hiện tại, sau đó tạo lại từ đầu. Tiếp tục?"
          isPending={seedPlants.isPending}
          onRun={() =>
            seedPlants.mutate({
              speciesCount: toOptInt(speciesCount),
              plantCount: toOptInt(plantCount),
              eventsPerPlant: toOptInt(eventsPerPlant),
            })
          }
          result={
            plantResult && (
              <ResultPanel title="Kết quả seeder cây trồng" ok>
                <StatRow
                  label="Loài cây upsert"
                  value={plantResult.seededSpeciesCount}
                />
                <StatRow
                  label="Loài cây tạo mới"
                  value={plantResult.createdSpeciesCount}
                />
                <StatRow
                  label="Loài cây cập nhật"
                  value={plantResult.updatedSpeciesCount}
                />
                <StatRow
                  label="Cây trồng đã xoá"
                  value={plantResult.deletedPlantCount}
                />
                <StatRow
                  label="Cây trồng tạo mới"
                  value={plantResult.seededPlantCount}
                />
                <StatRow
                  label="Sự kiện đã xoá"
                  value={plantResult.deletedEventCount}
                />
                <StatRow
                  label="Sự kiện tạo mới"
                  value={plantResult.seededEventCount}
                />
              </ResultPanel>
            )
          }
        >
          <div className="grid grid-cols-3 gap-3">
            <NumInput
              label="Số loài"
              value={speciesCount}
              onChange={setSpeciesCount}
              min={1}
              placeholder="Mặc định: 15"
            />
            <NumInput
              label="Số cây"
              value={plantCount}
              onChange={setPlantCount}
              min={1}
              placeholder="Mặc định: 30"
            />
            <NumInput
              label="Sự kiện / cây"
              value={eventsPerPlant}
              onChange={setEventsPerPlant}
              min={1}
              placeholder="Mặc định: 5"
            />
          </div>
        </SeederCard>

        {/* 4. Community */}
        <SeederCard
          step={4}
          icon={<MessageSquare className="w-4 h-4" />}
          title="Cộng đồng (Bài viết, Bình luận, Vote)"
          description="Xoá toàn bộ bài viết, bình luận và vote, tái tạo bằng dữ liệu mẫu."
          destructive
          confirmMessage="Thao tác này sẽ XOÁ toàn bộ bài viết, bình luận và vote hiện tại, sau đó tạo lại từ đầu. Tiếp tục?"
          isPending={seedCommunity.isPending}
          onRun={() => seedCommunity.mutate()}
          result={
            communityResult && (
              <ResultPanel title="Kết quả seeder cộng đồng" ok>
                <StatRow
                  label="Bài viết đã xoá"
                  value={communityResult.deletedPostCount}
                />
                <StatRow
                  label="Bình luận đã xoá"
                  value={communityResult.deletedCommentCount}
                />
                <StatRow
                  label="Vote đã xoá"
                  value={communityResult.deletedVoteCount}
                />
                <StatRow
                  label="Bài viết tạo mới"
                  value={communityResult.seededPostCount}
                />
                <StatRow
                  label="Bình luận tạo mới"
                  value={communityResult.seededCommentCount}
                />
                <StatRow
                  label="Vote tạo mới"
                  value={communityResult.seededVoteCount}
                />
                <StatRow
                  label="Hồ sơ làm nguồn"
                  value={communityResult.sourceProfileCount}
                />
              </ResultPanel>
            )
          }
        >
          <p className="text-xs text-slate-400 italic">
            Số lượng được cấu hình qua config server (100 bài / 400 bình luận /
            700 vote).
          </p>
        </SeederCard>

        {/* 5. Certificates */}
        <SeederCard
          step={5}
          icon={<BadgeCheck className="w-4 h-4" />}
          title="Chứng chỉ (Yêu cầu phê duyệt)"
          description="Xoá toàn bộ yêu cầu phê duyệt đang chờ, tái tạo dữ liệu mẫu phân bổ qua các hồ sơ thực."
          destructive
          confirmMessage="Thao tác này sẽ XOÁ toàn bộ yêu cầu chứng chỉ đang chờ duyệt, sau đó tạo lại từ đầu. Tiếp tục?"
          isPending={seedCertificates.isPending}
          onRun={() =>
            seedCertificates.mutate({
              requestCount: toOptInt(certRequestCount),
              certsPerRequest: toOptInt(certsPerRequest),
            })
          }
          result={
            certResult && (
              <ResultPanel title="Kết quả seeder chứng chỉ" ok>
                <StatRow
                  label="Yêu cầu đã xoá"
                  value={certResult.deletedPendingCount}
                />
                <StatRow
                  label="Yêu cầu tạo mới"
                  value={certResult.seededRequestCount}
                />
                <StatRow
                  label="Chứng chỉ tổng cộng"
                  value={certResult.seededCertificateCount}
                />
                <StatRow
                  label="Hồ sơ làm nguồn"
                  value={certResult.sourceProfileCount}
                />
              </ResultPanel>
            )
          }
        >
          <div className="grid grid-cols-2 gap-3">
            <NumInput
              label="Số yêu cầu"
              value={certRequestCount}
              onChange={setCertRequestCount}
              min={1}
              placeholder="Mặc định: 20"
            />
            <NumInput
              label="Chứng chỉ / yêu cầu"
              value={certsPerRequest}
              onChange={setCertsPerRequest}
              min={1}
              max={5}
              placeholder="Mặc định: 2"
            />
          </div>
        </SeederCard>

        {/* 6. Species / Perenual — full width */}
        <div className="lg:col-span-2">
          <SeederCard
            icon={<FlaskConical className="w-4 h-4" />}
            title="Loài cây từ Perenual API"
            description="Lấy dữ liệu thực từ Perenual API và upsert vào DB. Yêu cầu API key hợp lệ. Có thể chạy độc lập."
            isPending={seedSpeciesPerenual.isPending}
            onRun={() =>
              seedSpeciesPerenual.mutate({
                startPage: parseInt(perenualStartPage, 10) || 1,
                pages: parseInt(perenualPages, 10) || 1,
                perPage: parseInt(perenualPerPage, 10) || 30,
              })
            }
            result={
              perenualResult && (
                <ResultPanel
                  title="Kết quả seeder Perenual"
                  ok={perenualResult.failedPages.length === 0}
                >
                  <StatRow
                    label="Trang bắt đầu"
                    value={perenualResult.startPage}
                  />
                  <StatRow
                    label="Số trang lấy"
                    value={perenualResult.pagesRequested}
                  />
                  <StatRow
                    label="Tổng đã lưu"
                    value={perenualResult.totalSaved}
                  />
                  <StatRow
                    label="Tạo mới"
                    value={perenualResult.createdCount}
                  />
                  <StatRow
                    label="Cập nhật"
                    value={perenualResult.updatedCount}
                  />
                  <StatRow label="Bỏ qua" value={perenualResult.skippedCount} />
                  {perenualResult.failedPages.length > 0 && (
                    <div className="pt-1 text-xs text-red-600">
                      Trang lỗi: {perenualResult.failedPages.join(", ")}
                    </div>
                  )}
                </ResultPanel>
              )
            }
          >
            <div className="grid grid-cols-3 gap-3">
              <NumInput
                label="Trang bắt đầu"
                value={perenualStartPage}
                onChange={setPerenualStartPage}
                min={1}
                placeholder="Mặc định: 1"
              />
              <NumInput
                label="Số trang"
                value={perenualPages}
                onChange={setPerenualPages}
                min={1}
                placeholder="Mặc định: 1"
              />
              <NumInput
                label="Mục / trang"
                value={perenualPerPage}
                onChange={setPerenualPerPage}
                min={1}
                max={100}
                placeholder="Mặc định: 30"
              />
            </div>
          </SeederCard>
        </div>
      </div>
    </div>
  );
}
