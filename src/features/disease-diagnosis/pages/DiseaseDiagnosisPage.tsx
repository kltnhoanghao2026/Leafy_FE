import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { History, Info, UploadCloud, X, AlertTriangle, CheckCircle, ImageIcon, LoaderCircle, MousePointerClick, Crop } from "lucide-react";
import { ROUTES } from "../../../lib/routes";
import {
  DiagnosisPlantSelector,
  type DiagnosisPlantContext,
} from "../components/DiagnosisPlantSelector";
import { PredictionResultCard } from "../components/PredictionResultCard";
import { usePredictDiseaseMutation, useDetectLeafMutation } from "../queries";
import apiClient from "../../../lib/apiClient";
import type { DiseasePrediction, PredictResponse, LeafDetectionResponse, LeafDetection, BoundingBox } from "../types";
import { validateDiagnosisImage } from "../utils/fileValidation";
import { getDiseaseLabel } from "../utils/diseaseLabels";
import { DiseaseStepIndicator, type PipelineStep } from "../components/DiseaseStepIndicator";

const toFriendlyError = (error: unknown) => {
  const message =
    error instanceof Error
      ? error.message
      : error &&
          typeof error === "object" &&
          "message" in error &&
          typeof error.message === "string"
        ? error.message
        : String(error ?? "");
  if (/401|unauthenticated|unauthorized|forbidden/i.test(message)) {
    return "Bạn cần đăng nhập hoặc không có quyền thực hiện chẩn đoán.";
  }
  if (/model|loaded|ready|503/i.test(message)) {
    return "Model chẩn đoán chưa sẵn sàng. Vui lòng thử lại sau.";
  }
  if (/timeout|network|failed/i.test(message)) {
    return "Không kết nối được disease-detection-service. Vui lòng thử lại.";
  }
  return "Chẩn đoán thất bại. Vui lòng kiểm tra ảnh và thử lại.";
};

export function DiseaseDiagnosisPage() {
  const location = useLocation();
  const routeState = location.state as
    | { plantContext?: DiagnosisPlantContext }
    | null;
  
  const [step, setStep] = useState<PipelineStep>("UPLOAD");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [detectionResult, setDetectionResult] = useState<LeafDetectionResponse | null>(null);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [plantContext, setPlantContext] = useState<DiagnosisPlantContext>(
    routeState?.plantContext ?? {},
  );
  
  const navigate = useNavigate();
  const detectLeafMutation = useDetectLeafMutation();
  const predictMutation = usePredictDiseaseMutation();

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (croppedImageUrl) URL.revokeObjectURL(croppedImageUrl);
    };
  }, [previewUrl, croppedImageUrl]);

  const handleClear = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (croppedImageUrl) URL.revokeObjectURL(croppedImageUrl);
    setPreviewUrl(null);
    setCroppedImageUrl(null);
    setDetectionResult(null);
    setResult(null);
    setError(null);
    setStep("UPLOAD");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileAction = async (nextFile: File) => {
    const validationError = validateDiagnosisImage(nextFile);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    handleClear(); // reset states
    
    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
    setStep("UPLOAD");
    setError(null);
    
    try {
      const data = await detectLeafMutation.mutateAsync(nextFile);
      setDetectionResult(data);
      setStep("SELECT");
    } catch (err) {
      setError(toFriendlyError(err));
      setStep("UPLOAD");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) void handleFileAction(selectedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const selectedFile = e.dataTransfer.files?.[0];
    if (selectedFile) void handleFileAction(selectedFile);
  };

  const cropImage = async (imageFile: File, box: BoundingBox): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(imageFile);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const width = box.x2 - box.x1;
        const height = box.y2 - box.y1;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas context is not available"));
        
        ctx.drawImage(img, box.x1, box.y1, width, height, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create image blob"));
        }, imageFile.type || "image/jpeg", 0.95);
      };
      img.onerror = () => reject(new Error("Failed to load image for cropping"));
    });
  };

  const handleSelectBox = async (detection: LeafDetection) => {
    if (!file) return;
    setStep("PREDICT");
    setError(null);
    try {
      const croppedBlob = await cropImage(file, detection.boundingBox);
      
      if (croppedImageUrl) URL.revokeObjectURL(croppedImageUrl);
      setCroppedImageUrl(URL.createObjectURL(croppedBlob));
      
      const croppedFile = new File([croppedBlob], file.name || "cropped_leaf.jpg", { type: croppedBlob.type });
      
      const response = await predictMutation.mutateAsync({
        file: croppedFile,
        plantId: plantContext.plantId,
      });
      if (!response?.predictions?.length) {
        setError("Response chẩn đoán không hợp lệ. Không có kết quả dự đoán.");
        setStep("SELECT");
        return;
      }
      setResult(response);
      setStep("RESULT");
    } catch (e) {
      console.error("Cropping or Prediction failed:", e);
      setError(toFriendlyError(e));
      setStep("SELECT");
    }
  };

  const renderBoundingBoxes = () => {
    if (step !== "SELECT" || !detectionResult) return null;
    const { imageWidth, imageHeight, detections } = detectionResult;
    
    return detections.map((det, i) => {
      const { x1, y1, x2, y2 } = det.boundingBox;
      const left = (x1 / imageWidth) * 100;
      const top = (y1 / imageHeight) * 100;
      const width = ((x2 - x1) / imageWidth) * 100;
      const height = ((y2 - y1) / imageHeight) * 100;

      return (
        <button
          key={i}
          onClick={() => void handleSelectBox(det)}
          className="absolute border-2 border-emerald-400 bg-emerald-400/20 hover:bg-emerald-400/40 hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-colors group"
          style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` }}
          title={`Leaf (${Math.round(det.confidenceScore * 100)}%)`}
        >
          <div className="absolute -top-3 -right-3 bg-white text-emerald-600 p-1.5 rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform">
            <Crop className="w-3 h-3" />
          </div>
        </button>
      );
    });
  };

  const handleStepClick = (targetStep: PipelineStep) => {
    if (targetStep === "UPLOAD") {
      handleClear();
    } else if (targetStep === "SELECT" && detectionResult) {
      setStep("SELECT");
      setResult(null);
      if (croppedImageUrl) URL.revokeObjectURL(croppedImageUrl);
      setCroppedImageUrl(null);
      setError(null);
    }
  };

  const handleGeneratePlan = async (prediction: DiseasePrediction) => {
    let imageUrl: string | undefined = undefined;
    if (result?.fileId) {
      try {
        const { data } = await apiClient.get<Record<string, unknown>>(`/api/v1/files/presigned-url/${result.fileId}`);
        imageUrl = (data?.data || data?.result || data) as string;
      } catch (e) {
        console.warn("Failed to get presigned URL for image assessment", e);
      }
    }

    navigate(ROUTES.DASHBOARD.PLANS_GENERATE_PROGRESS, {
      state: {
        payload: {
          disease_name: prediction.className,
          diseaseLabel: getDiseaseLabel(prediction.className),
          severity_level: prediction.severityLevel,
          plantId: plantContext.plantId,
          farmPlotId: plantContext.farmPlotId,
          farmZoneId: plantContext.farmZoneId,
          image_url: imageUrl,
        },
      },
    });
  };

  return (
    <div className="mx-auto flex w-full flex-col space-y-5 pb-10">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.24em] text-[#245A34]">
            Disease detection
          </p>
          <h2 className="mt-2 text-[32px] font-black tracking-tight text-slate-900">
            Chẩn đoán bệnh lá cà phê
          </h2>
          <p className="mt-2 max-w-3xl text-[15px] font-semibold text-slate-500">
            Tải ảnh lá cây để hệ thống nhận diện bệnh. Kết quả chỉ mang tính hỗ
            trợ, cần kiểm tra thực tế trước khi xử lý.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowInfoModal(true)}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            <Info className="mr-2 h-4 w-4" strokeWidth={2.5} />
            Thông tin
          </button>
          <Link
            to={ROUTES.DASHBOARD.DIAGNOSIS_HISTORY}
            className="inline-flex items-center justify-center rounded-2xl border border-[#245A34] bg-white px-5 py-3 text-sm font-bold text-[#245A34] hover:bg-green-50"
          >
            <History className="mr-2 h-4 w-4" strokeWidth={2.5} />
            Xem lịch sử chẩn đoán
          </Link>
        </div>
      </header>

      <DiseaseStepIndicator step={step} onStepClick={handleStepClick} />

      <div className="bg-white border border-slate-200 rounded-3xl p-5 lg:p-8 shadow-xs">
        {!previewUrl ? (
          <div
            className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-3xl transition-colors cursor-pointer min-h-[250px] ${isDragOver ? "border-emerald-500 bg-emerald-50" : "border-slate-300 hover:border-emerald-400 hover:bg-slate-50"}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <UploadCloud className="w-8 h-8" />
            </div>
            <p className="text-lg font-bold text-slate-700 text-center">Kéo thả hình ảnh vào đây</p>
            <p className="text-slate-500 text-sm mt-1 text-center">hoặc click để chọn từ thiết bị (JPEG, PNG)</p>
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center bg-slate-50 rounded-xl p-3 px-4 border border-slate-100">
              {detectLeafMutation.isPending && (<><LoaderCircle className="w-5 h-5 text-emerald-600 animate-spin mr-3" /><span className="font-semibold text-slate-700">Đang quét YOLOv8 tìm lá...</span></>)}
              {step === "SELECT" && detectionResult?.detections.length === 0 && (<><AlertTriangle className="w-5 h-5 text-amber-500 mr-3" /><span className="font-semibold text-slate-700">Không tìm thấy lá nào! Hãy thử ảnh khác.</span></>)}
              {step === "SELECT" && (detectionResult?.detections.length ?? 0) > 0 && (<><MousePointerClick className="w-5 h-5 text-emerald-600 mr-3 animate-bounce" /><span className="font-semibold text-slate-700">Phát hiện <span className="text-emerald-700 font-extrabold">{detectionResult?.detections.length}</span> lá. Click chọn 1 lá để chẩn đoán.</span></>)}
              {predictMutation.isPending && (<><LoaderCircle className="w-5 h-5 text-emerald-600 animate-spin mr-3" /><span className="font-semibold text-slate-700">MobileNetV2 đang phân tích bệnh...</span></>)}
              {step === "RESULT" && (<><CheckCircle className="w-5 h-5 text-emerald-600 mr-3" /><span className="font-semibold text-slate-700">Phân tích hoàn tất.</span></>)}
            </div>

            <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center p-2">
              <div className="relative inline-block">
                <img
                  ref={imgRef}
                  src={(step === "PREDICT" || step === "RESULT") && croppedImageUrl ? croppedImageUrl : previewUrl}
                  alt="Preview"
                  className={`max-h-[45vh] object-contain rounded-md ${detectLeafMutation.isPending || predictMutation.isPending ? "opacity-50 grayscale transition-all" : "opacity-100 transition-all"}`}
                />
                {renderBoundingBoxes()}
              </div>

              {(step === "SELECT" || step === "UPLOAD") && !detectLeafMutation.isPending && (
                <button onClick={handleClear} className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-colors z-20" title="Xóa ảnh">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-3 text-slate-600 font-medium">
              <ImageIcon className="w-5 h-5 text-emerald-500 shrink-0" />
              <span className="truncate max-w-[200px] sm:max-w-[300px]">{file?.name}</span>
              <span className="text-sm text-slate-400">({Math.round((file?.size ?? 0) / 1024)} KB)</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Đã xảy ra lỗi</p>
              <p className="text-sm mt-1 opacity-90">{error}</p>
            </div>
          </div>
        )}

        <div className="my-6">
          <DiagnosisPlantSelector
            value={plantContext}
            onChange={setPlantContext}
            compact={true}
          />
        </div>

        {step === "RESULT" && result && (
          <PredictionResultCard 
            result={result} 
            onGeneratePlan={handleGeneratePlan}
            isGeneratingPlan={false}
          />
        )}
      </div>

      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900">Thông tin về chẩn đoán bệnh</h2>
              <button
                onClick={() => setShowInfoModal(false)}
                className="rounded-full p-2 hover:bg-slate-100"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="mt-6 space-y-6">
              <section>
                <h3 className="text-lg font-bold text-[#245A34]">Pipeline dự đoán bệnh</h3>
                <div className="mt-3 space-y-3">
                  <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">1</div>
                    <div>
                      <p className="font-bold text-slate-800">YOLOv8 - Phát hiện lá</p>
                      <p className="mt-1 text-sm text-slate-600">Mô hình YOLOv8 quét toàn bộ ảnh để tìm vị trí các lá cây cà phê. Kết quả là danh sách các bounding box chứa lá.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">2</div>
                    <div>
                      <p className="font-bold text-slate-800">Cắt ảnh lá (Crop)</p>
                      <p className="mt-1 text-sm text-slate-600">Ảnh lá được cắt ra từ vùng bounding box để tập trung phân tích vào từng lá riêng lẻ.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">3</div>
                    <div>
                      <p className="font-bold text-slate-800">MobileNetV2 - Dự đoán bệnh</p>
                      <p className="mt-1 text-sm text-slate-600">Mô hình MobileNetV2 phân loại bệnh trên ảnh lá đã cắt. Đầu ra là loại bệnh và độ tin cậy của dự đoán.</p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold text-[#245A34]">Các loại bệnh có thể dự đoán</h3>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-sm font-semibold text-emerald-800">Khỏe mạnh (Healthy)</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span className="text-sm font-semibold text-amber-800">Sâu đục lá (Miner)</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span className="text-sm font-semibold text-amber-800">Đốm nâu (Phoma)</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span className="text-sm font-semibold text-amber-800">Nhện đỏ (Red Spider Mite)</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 sm:col-span-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span className="text-sm font-semibold text-amber-800">Gỉ sắt (Rust)</span>
                  </div>
                </div>
              </section>

              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-800">
                  <span className="font-bold">Lưu ý:</span> Kết quả chẩn đoán chỉ mang tính hỗ trợ. Hãy kiểm tra thực tế trước khi đưa ra quyết định xử lý.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DiseaseDiagnosisPage;
