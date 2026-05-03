import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Keyboard,
  Loader2,
  QrCode,
  Router,
  WifiOff,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { collectorApi } from "../../../lib/api/collectorApi";
import { ROUTES } from "../../../lib/routes";
import { useAuthStore } from "../../../store/authStore";
import { compactId } from "../../metrics-view/utils/format";
import { onboardingDeviceKeys } from "../queries";
import type {
  DeviceOnboardingDraft,
  DeviceOnboardingMode,
  DeviceOnboardingResult,
  DeviceOnboardingStep,
} from "../types";
import type {
  FarmPlotResponse,
  FarmZoneResponse,
} from "../../farm-management/types";
import { FarmLocationSelector } from "../components/FarmLocationSelector";
import { QrCameraScanner } from "../components/QrCameraScanner";
import { mapDeviceOnboardingError } from "../utils/onboardingErrors";
import { parseDeviceQrPayload } from "../utils/qrPayload";

const CONNECTION_STEPS = [
  { key: "provision", label: "Đang đăng ký thiết bị..." },
  { key: "claim-code", label: "Đang xác thực thiết bị..." },
  { key: "claim", label: "Đang gán thiết bị vào khu vực..." },
  { key: "refresh", label: "Đang cập nhật danh sách..." },
] as const;

const stepTitles: Record<
  DeviceOnboardingStep,
  { title: string; description: string }
> = {
  choose: {
    title: "Thêm thiết bị IoT",
    description: "Chọn cách thêm thiết bị phù hợp nhất để giảm số trường phải nhập.",
  },
  scan: {
    title: "Quét mã QR",
    description:
      "Bật camera để đọc QR trực tiếp hoặc dán JSON để kiểm thử nhanh.",
  },
  manual: {
    title: "Nhập thủ công",
    description:
      "Nhập tối thiểu thông tin kỹ thuật, sau đó chỉ chọn vị trí và tên hiển thị.",
  },
  location: {
    title: "Chọn vị trí",
    description:
      "Xác nhận thông tin thiết bị rồi chọn vườn và khu vực để gán vào.",
  },
  connecting: {
    title: "Đang kết nối",
    description: "FE đang chạy tuần tự provision, claim code, claim và refresh.",
  },
  success: {
    title: "Kết nối thiết bị thành công",
    description: "Thiết bị đã sẵn sàng để theo dõi trong trang chi tiết.",
  },
};

const emptyDraft: DeviceOnboardingDraft = {
  deviceUid: "",
  deviceCode: "",
  deviceType: "",
  model: "",
  deviceName: "",
  farmPlotId: "",
  zoneId: "",
  farmPlotName: "",
  zoneName: "",
};

const trimDraft = (draft: DeviceOnboardingDraft): DeviceOnboardingDraft => ({
  deviceUid: draft.deviceUid.trim(),
  deviceCode: draft.deviceCode.trim(),
  deviceType: draft.deviceType.trim(),
  model: draft.model.trim(),
  deviceName: draft.deviceName.trim(),
  farmPlotId: draft.farmPlotId.trim(),
  zoneId: draft.zoneId.trim(),
  farmPlotName: draft.farmPlotName?.trim() || "",
  zoneName: draft.zoneName?.trim() || "",
});

const buildSuggestedDeviceName = (zoneLabel?: string) => {
  const trimmed = zoneLabel?.trim();
  return trimmed ? `Cảm biến - ${trimmed}` : "Cảm biến - thiết bị mới";
};

interface WizardProgressProps {
  step: DeviceOnboardingStep;
}

function WizardProgress({ step }: WizardProgressProps) {
  const activeIndex = {
    choose: 0,
    scan: 1,
    manual: 1,
    location: 2,
    connecting: 3,
    success: 4,
  }[step];

  const items = [
    "Chọn cách thêm",
    "Nhận dạng thiết bị",
    "Chọn vị trí",
    "Kết nối",
    "Hoàn tất",
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {items.map((label, index) => {
        const isActive = index === activeIndex;
        const isDone = index < activeIndex;
        return (
          <div
            key={label}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black ${
              isActive
                ? "border-[#245A34] bg-[#F2FCF4] text-[#245A34]"
                : isDone
                  ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-500"
            }`}
          >
            <span
              className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                isActive
                  ? "bg-[#245A34] text-white"
                  : isDone
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-500"
              }`}
            >
              {index + 1}
            </span>
            {label}
          </div>
        );
      })}
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  type?: "text" | "textarea";
  readOnly?: boolean;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  helperText,
  required,
  type = "text",
  readOnly = false,
}: FieldProps) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/gi, "-");
  const sharedClassName =
    "mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34] focus:ring-2 focus:ring-[#245A34]/10 disabled:bg-slate-50";

  return (
    <label className="block" htmlFor={id}>
      <span className="text-xs font-black uppercase tracking-widest text-slate-400">
        {label}
        {required ? " *" : ""}
      </span>
      {type === "textarea" ? (
        <textarea
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          rows={5}
          className={sharedClassName}
        />
      ) : (
        <input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          className={sharedClassName}
        />
      )}
      {helperText ? (
        <p className="mt-2 text-xs font-semibold text-slate-500">{helperText}</p>
      ) : null}
    </label>
  );
}

interface StatCardProps {
  label: string;
  value: string;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-bold text-slate-700">{value}</p>
    </div>
  );
}

interface ConnectionProgressProps {
  stage: (typeof CONNECTION_STEPS)[number]["key"] | null;
}

function ConnectionProgress({ stage }: ConnectionProgressProps) {
  const activeIndex = CONNECTION_STEPS.findIndex((item) => item.key === stage);

  return (
    <div className="space-y-3">
      {CONNECTION_STEPS.map((item, index) => {
        const isActive = activeIndex === index;
        const isDone = activeIndex > index;
        return (
          <div
            key={item.key}
            className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
              isActive
                ? "border-[#245A34] bg-[#F2FCF4]"
                : isDone
                  ? "border-emerald-100 bg-emerald-50"
                  : "border-slate-100 bg-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${
                  isActive
                    ? "bg-[#245A34] text-white"
                    : isDone
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-500"
                }`}
              >
                {index + 1}
              </span>
              <p className="text-sm font-bold text-slate-700">{item.label}</p>
            </div>
            {isActive ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#245A34]" />
            ) : isDone ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

interface OfflineGuideProps {
  visible: boolean;
}

function OfflineGuide({ visible }: OfflineGuideProps) {
  if (!visible) return null;

  return (
    <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-5">
      <div className="flex items-start gap-3">
        <WifiOff className="mt-0.5 h-5 w-5 text-amber-700" />
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-black text-amber-800">
              Thiết bị đã liên kết nhưng vẫn offline
            </h4>
            <p className="mt-1 text-sm font-semibold text-amber-700">
              Hãy hoàn tất cấu hình Wi-Fi trực tiếp trên thiết bị. Không cần
              nhập Wi-Fi trong form claim này.
            </p>
          </div>
          <ol className="space-y-2 text-sm font-semibold text-amber-800">
            <li>1. Bật nguồn thiết bị.</li>
            <li>2. Kết nối Wi-Fi "Leafy-Setup-xxxx".</li>
            <li>3. Mở http://192.168.4.1.</li>
            <li>4. Nhập Wi-Fi của vườn hoặc nhà.</li>
            <li>5. Chờ thiết bị online.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

interface SuccessSummaryProps {
  result: DeviceOnboardingResult;
  onReset: () => void;
}

function SuccessSummary({ result, onReset }: SuccessSummaryProps) {
  const offline = result.status === "OFFLINE";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <StatCard label="Tên thiết bị" value={result.deviceName} />
        <StatCard
          label="Trạng thái"
          value={
            result.status
              ? `${result.status}${result.provisioningStatus ? ` / ${result.provisioningStatus}` : ""}`
              : "Chưa có trạng thái"
          }
        />
        <StatCard label="Farm plot" value={result.farmPlotName || compactId(result.farmPlotId)} />
        <StatCard label="Zone" value={result.zoneName || compactId(result.zoneId)} />
      </div>

      <OfflineGuide visible={offline} />

      <div className="flex flex-wrap gap-3">
        {result.deviceId ? (
          <Link
            to={ROUTES.DASHBOARD.DEVICE_DETAIL(result.deviceId)}
            className="inline-flex items-center justify-center rounded-2xl bg-[#245A34] px-4 py-3 text-sm font-bold text-white hover:bg-[#1b432a]"
          >
            Đi tới chi tiết thiết bị
            <ArrowRight className="ml-2 h-4 w-4" strokeWidth={2.5} />
          </Link>
        ) : null}
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          Thêm thiết bị khác
        </button>
      </div>
    </div>
  );
}

export function DeviceOnboardingPage() {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [step, setStep] = useState<DeviceOnboardingStep>("choose");
  const [mode, setMode] = useState<DeviceOnboardingMode | null>(null);
  const [draft, setDraft] = useState<DeviceOnboardingDraft>(emptyDraft);
  const [deviceNameTouched, setDeviceNameTouched] = useState(false);
  const [qrInput, setQrInput] = useState("");
  const [showPasteFallback, setShowPasteFallback] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [connectionStage, setConnectionStage] = useState<
    (typeof CONNECTION_STEPS)[number]["key"] | null
  >(null);
  const [success, setSuccess] = useState<DeviceOnboardingResult | null>(null);

  const currentTitle = stepTitles[step];
  const isBusy = step === "connecting";

  const draftPreview = useMemo(() => trimDraft(draft), [draft]);

  const updateDraft = (
    updater: (current: DeviceOnboardingDraft) => DeviceOnboardingDraft,
  ) => {
    setDraft((current) => updater(current));
  };

  const resetWizard = () => {
    setStep("choose");
    setMode(null);
    setDraft(emptyDraft);
    setDeviceNameTouched(false);
    setQrInput("");
    setShowPasteFallback(false);
    setQrError(null);
    setFormError(null);
    setConnectionStage(null);
    setSuccess(null);
  };

  const applyQrPayload = (payload: string) => {
    const parsed = parseDeviceQrPayload(payload);
    if (!parsed.success) {
      setQrError(parsed.error);
      setQrInput(payload);
      setShowPasteFallback(true);
      return false;
    }

    const qrData = parsed.data.data;
    setQrError(null);
    setQrInput(parsed.data.raw);
    setDraft((current) => ({
      ...current,
      deviceUid: qrData.deviceUid,
      deviceCode: qrData.deviceCode,
      deviceType: qrData.deviceType,
      model: qrData.model || "",
      deviceName:
        current.deviceName.trim() || buildSuggestedDeviceName(current.zoneName || current.zoneId),
    }));
    setMode("qr");
    setStep("location");
    return true;
  };

  const handleQrMode = () => {
    setMode("qr");
    setStep("scan");
    setShowPasteFallback(false);
    setQrError(null);
    setFormError(null);
    setSuccess(null);
  };

  const handleManualMode = () => {
    setMode("manual");
    setStep("manual");
    setQrError(null);
    setFormError(null);
    setSuccess(null);
  };

  const handleManualContinue = () => {
    const payload = trimDraft(draft);
    if (!payload.deviceUid || !payload.deviceCode || !payload.deviceType) {
      setFormError("Thiếu deviceUid, deviceCode hoặc deviceType.");
      return;
    }

    setDraft((current) => ({
      ...current,
      ...payload,
      deviceName: payload.deviceName || buildSuggestedDeviceName(payload.zoneName || payload.zoneId),
    }));
    setFormError(null);
    setStep("location");
  };

  const handleFarmPlotChange = (
    farmPlotId: string,
    plot: FarmPlotResponse | null,
  ) => {
    updateDraft((current) => ({
      ...current,
      farmPlotId,
      farmPlotName: plot?.name || "",
      zoneId: "",
      zoneName: "",
      deviceName: deviceNameTouched
        ? current.deviceName
        : buildSuggestedDeviceName(),
    }));
  };

  const handleZoneChange = (
    zoneId: string,
    zone: FarmZoneResponse | null,
  ) => {
    updateDraft((current) => ({
      ...current,
      zoneId,
      zoneName: zone?.zoneName || "",
      deviceName: deviceNameTouched
        ? current.deviceName
        : buildSuggestedDeviceName(zone?.zoneName || compactId(zoneId)),
    }));
  };

  const handleDeviceNameChange = (deviceName: string) => {
    setDeviceNameTouched(true);
    updateDraft((current) => ({
      ...current,
      deviceName,
    }));
  };

  const handleConnect = async () => {
    const payload = trimDraft(draft);
    if (!currentUserId) {
      setFormError(
        "Bạn chưa đăng nhập hoặc thiếu X-User-Id. Hãy đăng nhập lại rồi thử kết nối thiết bị.",
      );
      return;
    }
    if (!payload.deviceUid || !payload.deviceCode || !payload.deviceType) {
      setFormError("Thiếu deviceUid, deviceCode hoặc deviceType.");
      setStep(mode === "manual" ? "manual" : "scan");
      return;
    }
    if (!payload.farmPlotId || !payload.zoneId) {
      setFormError("Hãy chọn đầy đủ vườn và khu vực trước khi kết nối.");
      setStep("location");
      return;
    }

    setFormError(null);
    setStep("connecting");

    try {
      setConnectionStage("provision");
      const provisionedResponse = await collectorApi.provisionDevice({
        deviceUid: payload.deviceUid,
        deviceCode: payload.deviceCode,
        deviceName: payload.deviceName || buildSuggestedDeviceName(payload.zoneName || payload.zoneId),
        deviceType: payload.deviceType,
      });
      const provisioned = provisionedResponse.data;

      setConnectionStage("claim-code");
      const claimCodeResponse = await collectorApi.generateClaimCode(provisioned.id);

      setConnectionStage("claim");
      const claimedResponse = await collectorApi.claimDevice({
        deviceUid: provisioned.deviceUid,
        claimCode: claimCodeResponse.data.claimCode,
        farmPlotId: payload.farmPlotId,
        zoneId: payload.zoneId,
      });
      const claimed = claimedResponse.data;

      setConnectionStage("refresh");
      await queryClient.invalidateQueries({
        queryKey: onboardingDeviceKeys.all(),
      });
      const ownedDevicesResponse = await collectorApi.getMyDevices({
        page: 0,
        size: 100,
        sortBy: "createdAt",
        sortDir: "desc",
      });
      const ownedDevice = ownedDevicesResponse.data.items.find(
        (item) => item.deviceUid === provisioned.deviceUid,
      );

      setSuccess({
        deviceId: claimed.id || provisioned.id || ownedDevice?.id || "",
        deviceUid: claimed.deviceUid || provisioned.deviceUid,
        deviceCode: claimed.deviceCode || provisioned.deviceCode,
        deviceName:
          claimed.deviceName || provisioned.deviceName || payload.deviceName || buildSuggestedDeviceName(payload.zoneName || payload.zoneId),
        deviceType: claimed.deviceType || provisioned.deviceType,
        farmPlotId: claimed.farmPlotId || payload.farmPlotId,
        zoneId: claimed.zoneId || payload.zoneId,
        farmPlotName: payload.farmPlotName || "",
        zoneName: payload.zoneName || "",
        status: claimed.status ?? provisioned.status ?? ownedDevice?.status ?? null,
        provisioningStatus:
          claimed.provisioningStatus ??
          provisioned.provisioningStatus ??
          ownedDevice?.provisioningStatus ??
          null,
      });
      setStep("success");
    } catch (error) {
      setConnectionStage(null);
      setFormError(mapDeviceOnboardingError(error));
      setStep("location");
    }
  };

  const renderChooseStep = () => (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <button
        type="button"
        onClick={handleQrMode}
        className="group rounded-[1.75rem] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#245A34]"
      >
        <div className="flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F2FCF4] text-[#245A34]">
            <QrCode className="h-6 w-6" />
          </div>
          <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:text-[#245A34]" />
        </div>
        <h3 className="mt-4 text-lg font-black text-slate-900">Quét mã QR</h3>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Tự đọc deviceUid, deviceCode, deviceType và model từ payload JSON.
        </p>
      </button>

      <button
        type="button"
        onClick={handleManualMode}
        className="group rounded-[1.75rem] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#245A34]"
      >
        <div className="flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <Keyboard className="h-6 w-6" />
          </div>
          <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:text-[#245A34]" />
        </div>
        <h3 className="mt-4 text-lg font-black text-slate-900">Nhập thủ công</h3>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Dành cho thiết bị chưa có QR hoặc cần kiểm thử nhanh.
        </p>
      </button>
    </div>
  );

  const renderScanStep = () => (
    <div className="space-y-5">
      <QrCameraScanner
        onDecoded={applyQrPayload}
        onRequestPaste={() => setShowPasteFallback(true)}
      />

      {showPasteFallback ? (
        <div className="space-y-4 rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50 p-5">
          <div className="flex items-start gap-3">
            <QrCode className="mt-0.5 h-5 w-5 text-[#245A34]" />
            <div>
              <p className="text-sm font-bold text-slate-800">
                Dán JSON của QR để kiểm thử luồng onboarding.
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Nếu camera không khả dụng, bạn vẫn có thể dán payload JSON để tiếp tục.
              </p>
            </div>
          </div>

          <Field
            label="Nội dung QR JSON"
            value={qrInput}
            onChange={(value) => {
              setQrInput(value);
              setQrError(null);
            }}
            placeholder='{"deviceUid":"LEAFY-ESP32-001","deviceCode":"ESP32-001","deviceType":"ESP32_CAM_SENSOR","model":"Leafy IoT Module V1"}'
            type="textarea"
          />

          {qrError ? (
            <p role="alert" className="text-sm font-bold text-red-600">
              {qrError}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                void applyQrPayload(qrInput);
              }}
              className="inline-flex items-center justify-center rounded-2xl bg-[#245A34] px-4 py-3 text-sm font-bold text-white hover:bg-[#1b432a]"
            >
              Đọc QR
            </button>
            <button
              type="button"
              onClick={() => {
                setQrInput("");
                setQrError(null);
              }}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Xóa nội dung
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setStep("choose")}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          Quay lại
        </button>
      </div>
    </div>
  );

  const renderManualStep = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field
          label="deviceUid"
          value={draft.deviceUid}
          onChange={(value) =>
            updateDraft((current) => ({ ...current, deviceUid: value }))
          }
          placeholder="LEAFY-ESP32-001"
          required
        />
        <Field
          label="deviceCode"
          value={draft.deviceCode}
          onChange={(value) =>
            updateDraft((current) => ({ ...current, deviceCode: value }))
          }
          placeholder="ESP32-001"
          required
        />
        <Field
          label="deviceType"
          value={draft.deviceType}
          onChange={(value) =>
            updateDraft((current) => ({ ...current, deviceType: value }))
          }
          placeholder="ESP32_CAM_SENSOR"
          required
        />
        <Field
          label="model"
          value={draft.model}
          onChange={(value) =>
            updateDraft((current) => ({ ...current, model: value }))
          }
          placeholder="Leafy IoT Module V1"
        />
      </div>

      <Field
        label="deviceName"
        value={draft.deviceName}
        onChange={handleDeviceNameChange}
        placeholder={buildSuggestedDeviceName()}
        helperText="Bạn có thể để trống, hệ thống sẽ tự gợi ý tên theo khu vực."
      />

      {formError ? (
        <p role="alert" className="text-sm font-bold text-red-600">
          {formError}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setStep("choose")}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          Quay lại
        </button>
        <button
          type="button"
          onClick={handleManualContinue}
          className="inline-flex items-center justify-center rounded-2xl bg-[#245A34] px-4 py-3 text-sm font-bold text-white hover:bg-[#1b432a]"
        >
          Tiếp tục
        </button>
      </div>
    </div>
  );

  const renderLocationStep = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <StatCard label="Tên model" value={draftPreview.model || "Chưa có model"} />
        <StatCard label="deviceCode" value={draftPreview.deviceCode} />
        <StatCard label="deviceUid" value={draftPreview.deviceUid} />
        <StatCard label="deviceType" value={draftPreview.deviceType} />
      </div>

      <FarmLocationSelector
        farmPlotId={draft.farmPlotId}
        zoneId={draft.zoneId}
        onFarmPlotChange={handleFarmPlotChange}
        onZoneChange={handleZoneChange}
      />

      <Field
        label="deviceName"
        value={draft.deviceName}
        onChange={handleDeviceNameChange}
        placeholder={buildSuggestedDeviceName(draft.zoneName || draft.zoneId)}
        helperText="Tên hiển thị có thể sửa trước khi kết nối."
      />

      {formError ? (
        <p role="alert" className="text-sm font-bold text-red-600">
          {formError}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setStep(mode === "manual" ? "manual" : "scan")}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          Quay lại
        </button>
        <button
          type="button"
          onClick={() => void handleConnect()}
          disabled={isBusy}
          className="inline-flex items-center justify-center rounded-2xl bg-[#245A34] px-4 py-3 text-sm font-bold text-white hover:bg-[#1b432a] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Router className="mr-2 h-4 w-4" strokeWidth={2.5} />
          Kết nối thiết bị
        </button>
      </div>
    </div>
  );

  const renderConnectingStep = () => (
    <div className="space-y-5">
      <div className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F2FCF4] text-[#245A34]">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">
              Đang kết nối thiết bị
            </h3>
            <p className="text-sm font-semibold text-slate-500">
              Hệ thống đang chạy provision, claim code, claim và refresh.
            </p>
          </div>
        </div>
      </div>

      <ConnectionProgress stage={connectionStage} />
    </div>
  );

  const renderSuccessStep = () => {
    if (!success) {
      return null;
    }

    return <SuccessSummary result={success} onReset={resetWizard} />;
  };

  return (
    <div className="mx-auto w-full max-w-5xl animate-in fade-in duration-500 space-y-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-[30px] font-black tracking-tight text-slate-900">
            {currentTitle.title}
          </h2>
          <p className="mt-1 max-w-3xl text-[15px] font-semibold text-slate-500">
            {currentTitle.description}
          </p>
        </div>
        <WizardProgress step={step} />
      </div>

      <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
        {step === "choose" ? renderChooseStep() : null}
        {step === "scan" ? renderScanStep() : null}
        {step === "manual" ? renderManualStep() : null}
        {step === "location" ? renderLocationStep() : null}
        {step === "connecting" ? renderConnectingStep() : null}
        {step === "success" ? renderSuccessStep() : null}
      </div>
    </div>
  );
}

export default DeviceOnboardingPage;
