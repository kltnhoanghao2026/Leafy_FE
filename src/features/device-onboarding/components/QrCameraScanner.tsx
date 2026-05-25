import { useEffect, useId, useRef, useState } from "react";
import { AlertCircle, Camera, CameraOff, ClipboardPaste, RefreshCw } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { useTranslation } from "../../../i18n";
import type { TFunction } from "../../../i18n/context";

type ScannerStatus = "idle" | "starting" | "running" | "stopping";

interface QrCameraScannerProps {
  onDecoded: (rawValue: string) => void;
  onRequestPaste: () => void;
}

const getFriendlyCameraError = (error: unknown, t: TFunction) => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : t("iot.devices.onboarding.cameraStartFailed");
  const normalized = message.trim().toLowerCase();
  const errorName = error instanceof Error ? error.name.toLowerCase() : "";

  if (
    normalized.includes("permission") ||
    normalized.includes("denied") ||
    errorName.includes("notallowed")
  ) {
    return t("iot.devices.onboarding.cameraPermission");
  }

  if (
    normalized.includes("not found") ||
    normalized.includes("no camera") ||
    errorName.includes("notfound")
  ) {
    return t("iot.devices.onboarding.noCamera");
  }

  if (
    normalized.includes("not supported") ||
    normalized.includes("unsupported") ||
    errorName.includes("notsupported")
  ) {
    return t("iot.devices.onboarding.cameraNotSupported");
  }

  return t("iot.devices.onboarding.cameraStartFailed");
};

export function QrCameraScanner({
  onDecoded,
  onRequestPaste,
}: QrCameraScannerProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<ScannerStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const shouldIgnoreRepeat = useRef(false);
  const reactId = useId();
  const elementId = `qr-reader-${reactId.replace(/:/g, "")}`;

  const stopScanner = async () => {
    const scanner = scannerRef.current;
    if (!scanner) {
      setStatus("idle");
      return;
    }

    setStatus("stopping");
    shouldIgnoreRepeat.current = true;

    try {
      await scanner.stop();
    } catch {
      // Ignore stop errors when the scanner was not fully started.
    }

    try {
      await scanner.clear();
    } catch {
      // Ignore clear errors during cleanup.
    }

    scannerRef.current = null;
    setStatus("idle");
  };

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;
      if (!scanner) {
        return;
      }

      scannerRef.current = null;
      shouldIgnoreRepeat.current = true;

      void (async () => {
        try {
          await scanner.stop();
        } catch {
          // Ignore stop errors during unmount.
        }

        try {
          await scanner.clear();
        } catch {
          // Ignore clear errors during unmount.
        }
      })();
    };
  }, []);

  const handleStart = async () => {
    setError(null);

    if (status === "starting" || status === "running") {
      return;
    }

    if (typeof window === "undefined" || !navigator?.mediaDevices?.getUserMedia) {
      setError(t("iot.devices.onboarding.cameraUnsupported"));
      return;
    }

    setStatus("starting");
    shouldIgnoreRepeat.current = false;

    try {
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras.length) {
        setError(t("iot.devices.onboarding.noCamera"));
        setStatus("idle");
        return;
      }

      const preferredCamera =
        cameras.find((camera) =>
          /back|rear|environment|trailing/i.test(camera.label),
        ) ?? cameras[0];

      const scanner = new Html5Qrcode(elementId);
      scannerRef.current = scanner;

      await scanner.start(
        { deviceId: { exact: preferredCamera.id } },
        {
          fps: 10,
          qrbox: { width: 240, height: 240 },
        },
        async (decodedText) => {
          if (shouldIgnoreRepeat.current) {
            return;
          }

          shouldIgnoreRepeat.current = true;
          await stopScanner();
          onDecoded(decodedText);
        },
        () => {
          // Ignore frame-level decode failures to avoid noisy UI.
        },
      );

      if (scannerRef.current === scanner && !shouldIgnoreRepeat.current) {
        setStatus("running");
      }
    } catch (scannerError) {
      scannerRef.current = null;
      setStatus("idle");
      setError(getFriendlyCameraError(scannerError, t));
    }
  };

  const handleStop = async () => {
    setError(null);
    await stopScanner();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-4 shadow-inner">
        <div
          id={elementId}
          className="min-h-[280px] overflow-hidden rounded-[1.25rem] border border-white/10 bg-slate-900"
        />
        <div className="mt-3 flex items-center justify-between gap-3 text-xs font-semibold text-slate-300">
          <span>
            {status === "running"
              ? t("iot.devices.onboarding.cameraRunning")
              : status === "starting"
                ? t("iot.devices.onboarding.cameraStarting")
                : t("iot.devices.onboarding.cameraIdle")}
          </span>
          <span className="text-slate-400">
            {t("iot.devices.onboarding.cameraHint")}
          </span>
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-[1.5rem] border border-red-100 bg-red-50 p-4"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
          <p className="text-sm font-semibold text-red-700">{error}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void handleStart()}
          disabled={status === "starting" || status === "running"}
          className="inline-flex items-center justify-center rounded-2xl bg-[#245A34] px-4 py-3 text-sm font-bold text-white hover:bg-[#1b432a] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "starting" ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" strokeWidth={2.5} />
          ) : (
            <Camera className="mr-2 h-4 w-4" strokeWidth={2.5} />
          )}
          {t("iot.devices.onboarding.startCamera")}
        </button>
        <button
          type="button"
          onClick={() => void handleStop()}
          disabled={status === "idle"}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CameraOff className="mr-2 h-4 w-4" strokeWidth={2.5} />
          {t("iot.devices.onboarding.stopCamera")}
        </button>
        <button
          type="button"
          onClick={onRequestPaste}
          className="inline-flex items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:border-[#245A34] hover:text-[#245A34]"
        >
          <ClipboardPaste className="mr-2 h-4 w-4" strokeWidth={2.5} />
          {t("iot.devices.onboarding.pasteJson")}
        </button>
      </div>
    </div>
  );
}
