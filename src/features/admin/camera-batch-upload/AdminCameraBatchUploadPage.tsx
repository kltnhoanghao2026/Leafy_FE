import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, FolderOpen, Loader2, ScanSearch, UploadCloud } from "lucide-react";
import { MediaImage } from "../../community/components/MediaImage";
import type { AdminCameraUploadItemResponse } from "../../../types/iot";
import {
  useCameraUploadFolderMutation,
  useDiseaseDetectMutation,
} from "./cameraBatchUpload.queries";

const statusClass = (status?: string | null) => {
  if (status === "DISEASE_DETECTED") return "border-red-100 bg-red-50 text-red-700";
  if (status === "PROCESSED" || status === "UPLOADED") return "border-emerald-100 bg-emerald-50 text-emerald-700";
  if (status === "FAILED") return "border-red-100 bg-red-50 text-red-700";
  return "border-blue-100 bg-blue-50 text-blue-700";
};

export function AdminCameraBatchUploadPage() {
  const [deviceUid, setDeviceUid] = useState("");
  const [autoDetect, setAutoDetect] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [items, setItems] = useState<AdminCameraUploadItemResponse[]>([]);
  const uploadMutation = useCameraUploadFolderMutation();
  const detectMutation = useDiseaseDetectMutation();

  const imageFiles = useMemo(
    () => files.filter((file) => file.type.startsWith("image/")),
    [files],
  );

  const handleUpload = async () => {
    const response = await uploadMutation.mutateAsync({
      files: imageFiles,
      deviceUid: deviceUid.trim(),
      autoDetect,
    });
    setItems(response.data.items ?? []);
  };

  const handleDetect = async (item: AdminCameraUploadItemResponse) => {
    if (!item.mediaEvent?.id || !item.fileId || !deviceUid.trim()) return;
    const response = await detectMutation.mutateAsync({
      deviceUid: deviceUid.trim(),
      payload: {
        mediaEventId: item.mediaEvent.id,
        fileId: item.fileId,
        fileUrl: item.fileUrl ?? undefined,
      },
    });
    setItems((current) =>
      current.map((candidate) =>
        candidate.mediaEvent?.id === item.mediaEvent?.id
          ? { ...candidate, analysis: response.data, status: response.data.status }
          : candidate,
      ),
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-emerald-700">
          Camera disease workflow
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
          Batch camera image upload
        </h1>
        <p className="mt-2 max-w-3xl text-sm font-semibold text-slate-500">
          Upload coffee leaf images through file-service, run disease detection, and create alerts when disease is detected.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-end">
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
            Device UID
            <input
              value={deviceUid}
              onChange={(event) => setDeviceUid(event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="leafy-prototype-001"
            />
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700">
            <input
              type="checkbox"
              checked={autoDetect}
              onChange={(event) => setAutoDetect(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600"
            />
            Auto detect
          </label>
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
            <FolderOpen className="h-4 w-4" />
            Select folder/files
            <input
              type="file"
              multiple
              accept="image/*"
              // @ts-expect-error Browser-specific directory picker.
              webkitdirectory=""
              className="hidden"
              onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
            />
          </label>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-500">
            {imageFiles.length} image(s) selected
          </p>
          <button
            type="button"
            onClick={() => void handleUpload()}
            disabled={!deviceUid.trim() || imageFiles.length === 0 || uploadMutation.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            Upload batch
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {items.length === 0 ? (
          <div className="p-6 text-sm font-bold text-slate-500">No uploaded images yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Image</th>
                  <th className="px-4 py-3">File</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Detection</th>
                  <th className="px-4 py-3">Alert</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, index) => (
                  <tr key={`${item.fileId ?? item.originalFileName}-${index}`} className="align-top">
                    <td className="px-4 py-4">
                      <div className="h-16 w-24 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                        {item.fileId ? (
                          <MediaImage source={item.fileId} alt={item.originalFileName} className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-bold text-slate-900">{item.originalFileName}</p>
                      <p className="text-xs font-semibold text-slate-500">{item.fileId ?? item.error}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-bold ${statusClass(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-600">
                      {item.analysis ? (
                        <div>
                          <p>{item.analysis.diseaseName ?? "No disease"}</p>
                          <p className="text-xs text-slate-500">
                            {item.analysis.confidence == null ? "-" : `${Math.round(item.analysis.confidence * 100)}% confidence`}
                          </p>
                        </div>
                      ) : (
                        "Not analyzed"
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {item.analysis?.diseaseDetected ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-2 py-1 text-xs font-bold text-red-700">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Created
                        </span>
                      ) : item.analysis ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          None
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => void handleDetect(item)}
                        disabled={!item.fileId || !item.mediaEvent?.id || detectMutation.isPending}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <ScanSearch className="h-3.5 w-3.5" />
                        Detect disease
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
