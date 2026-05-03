import React, { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { UploadCloud, X, AlertTriangle, CheckCircle, ImageIcon, LoaderCircle, MousePointerClick, Crop } from "lucide-react";
import { diseaseDetectionApi } from "../api/diseaseDetection.api";
import type { PredictionResponse, LeafDetectionResponse, LeafDetection, BoundingBox } from "../api/diseaseDetection.api";
import { DiseaseResultWidget } from "../components/DiseaseResultWidget";
import { DiseaseStepIndicator, type PipelineStep } from "../components/DiseaseStepIndicator";

export function DiseasePredictionPage() {
  const [step, setStep] = useState<PipelineStep>("UPLOAD");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Results State
  const [detectionResult, setDetectionResult] = useState<LeafDetectionResponse | null>(null);
  const [predictionResult, setPredictionResult] = useState<PredictionResponse | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Mutation: YOLO Detect
  const { mutate: detectLeaf, isPending: isDetecting, isError: isDetectError, error: detectError } = useMutation({
    mutationFn: (file: File) => diseaseDetectionApi.detectLeaf(file),
    onSuccess: (data) => {
      setDetectionResult(data);
      setStep("SELECT");
    },
  });

  // Mutation: MobileNet Predict
  const { mutate: predictDisease, isPending: isPredicting, isError: isPredictError, error: predictError } = useMutation({
    mutationFn: (blob: File | Blob) => diseaseDetectionApi.predict(blob),
    onSuccess: (data) => {
      setPredictionResult(data);
      setStep("RESULT");
    },
  });

  const handleFileAction = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn một file hình ảnh hợp lệ.");
      return;
    }
    
    // Reset all states
    setDetectionResult(null);
    setPredictionResult(null);
    if (croppedImageUrl) URL.revokeObjectURL(croppedImageUrl);
    setCroppedImageUrl(null);
    setStep("UPLOAD");

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    
    // Start YOLO detection immediately
    detectLeaf(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileAction(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileAction(file);
  };

  const handleClear = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (croppedImageUrl) URL.revokeObjectURL(croppedImageUrl);
    setPreviewUrl(null);
    setCroppedImageUrl(null);
    setDetectionResult(null);
    setPredictionResult(null);
    setStep("UPLOAD");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const cropImage = async (file: File, box: BoundingBox): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
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
        }, file.type || "image/jpeg", 0.95);
      };
      img.onerror = () => reject(new Error("Failed to load image for cropping"));
    });
  };

  const handleSelectBox = async (detection: LeafDetection) => {
    if (!selectedFile) return;
    setStep("PREDICT");
    try {
      const croppedBlob = await cropImage(selectedFile, detection.boundingBox);
      
      if (croppedImageUrl) URL.revokeObjectURL(croppedImageUrl);
      setCroppedImageUrl(URL.createObjectURL(croppedBlob));
      
      predictDisease(croppedBlob);
    } catch (e) {
      console.error("Cropping failed:", e);
      alert("Cắt ảnh bị lỗi! Vui lòng thử lại.");
      setStep("SELECT");
    }
  };

  const renderBoundingBoxes = () => {
    if (step !== "SELECT" || !detectionResult || !imgRef.current) return null;
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
          onClick={() => handleSelectBox(det)}
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
      setPredictionResult(null);
      if (croppedImageUrl) URL.revokeObjectURL(croppedImageUrl);
      setCroppedImageUrl(null);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-20">
      <DiseaseStepIndicator step={step} onStepClick={handleStepClick} />

      <div className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-10 shadow-xs">
        {!previewUrl ? (
          <div
            className={`flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-3xl transition-colors cursor-pointer min-h-[300px] ${isDragOver ? "border-emerald-500 bg-emerald-50" : "border-slate-300 hover:border-emerald-400 hover:bg-slate-50"}`}
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
              {isDetecting && (<><LoaderCircle className="w-5 h-5 text-emerald-600 animate-spin mr-3" /><span className="font-semibold text-slate-700">Đang quét YOLOv8 tìm lá...</span></>)}
              {step === "SELECT" && detectionResult?.detections.length === 0 && (<><AlertTriangle className="w-5 h-5 text-amber-500 mr-3" /><span className="font-semibold text-slate-700">Không tìm thấy lá nào! Hãy thử ảnh khác.</span></>)}
              {step === "SELECT" && (detectionResult?.detections.length ?? 0) > 0 && (<><MousePointerClick className="w-5 h-5 text-emerald-600 mr-3 animate-bounce" /><span className="font-semibold text-slate-700">Phát hiện <span className="text-emerald-700 font-extrabold">{detectionResult?.detections.length}</span> lá. Click chọn 1 lá để chẩn đoán.</span></>)}
              {isPredicting && (<><LoaderCircle className="w-5 h-5 text-emerald-600 animate-spin mr-3" /><span className="font-semibold text-slate-700">MobileNetV2 đang phân tích bệnh...</span></>)}
              {step === "RESULT" && (<><CheckCircle className="w-5 h-5 text-emerald-600 mr-3" /><span className="font-semibold text-slate-700">Phân tích hoàn tất.</span></>)}
            </div>

            <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center p-2">
              <div className="relative inline-block">
                <img
                  ref={imgRef}
                  src={(step === "PREDICT" || step === "RESULT") && croppedImageUrl ? croppedImageUrl : previewUrl!}
                  alt="Preview"
                  className={`max-h-[60vh] object-contain rounded-md ${isDetecting || isPredicting ? "opacity-50 grayscale transition-all" : "opacity-100 transition-all"}`}
                />
                {renderBoundingBoxes()}
              </div>

              {(step === "SELECT" || step === "UPLOAD") && !isDetecting && (
                <button onClick={handleClear} className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-colors z-20" title="Xóa ảnh">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-3 text-slate-600 font-medium">
              <ImageIcon className="w-5 h-5 text-emerald-500 shrink-0" />
              <span className="truncate max-w-[200px] sm:max-w-[300px]">{selectedFile?.name}</span>
              <span className="text-sm text-slate-400">({Math.round((selectedFile?.size ?? 0) / 1024)} KB)</span>
            </div>
          </div>
        )}

        {(isDetectError || isPredictError) && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Đã xảy ra lỗi</p>
              <p className="text-sm mt-1 opacity-90">{(detectError as Error)?.message || (predictError as Error)?.message || "Đã xảy ra sự cố."}</p>
            </div>
          </div>
        )}

        {step === "RESULT" && predictionResult && <DiseaseResultWidget predictionResult={predictionResult} onClear={handleClear} />}
      </div>
    </div>
  );
}
