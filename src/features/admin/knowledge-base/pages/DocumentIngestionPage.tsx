import { useState, useRef } from "react";
import {
  UploadCloud,
  BookOpen,
  AlertCircle,
  Eye,
  Database,
  ClipboardList,
} from "lucide-react";
import {
  useIngestDocument,
  useKnowledgeBaseTasks,
  usePreviewDocument,
  useDocuments,
} from "../hooks/useKnowledgeBase";
import type { PreviewResponse } from "../api/knowledgeBaseApi";
import { IngestionTasksList } from "../components/IngestionTasksList";
import { ChunkPreviewPanel } from "../components/ChunkPreviewPanel";
import { DocumentsCatalog } from "../components/DocumentsCatalog";

type RightPanelTab = "preview" | "tasks" | "documents";

export function DocumentIngestionPage() {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<string>("agronomy");
  const [variety, setVariety] = useState<string>("");
  const [activeTab, setActiveTab] = useState<RightPanelTab>("tasks");
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: ingest, isPending: isIngesting } = useIngestDocument();
  const { data: tasks, isLoading: isTasksLoading } = useKnowledgeBaseTasks();
  const { mutate: previewDoc, isPending: isPreviewing } = usePreviewDocument();
  const { data: documents, isLoading: isDocsLoading } = useDocuments();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreview(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setPreview(null);
    }
  };

  const handlePreview = () => {
    if (!file) return;
    previewDoc(file, {
      onSuccess: (data) => {
        setPreview(data);
        setActiveTab("preview");
      },
    });
  };

  const handleIngest = () => {
    if (!file) return;
    ingest(
      { file, category, variety },
      {
        onSuccess: () => {
          setFile(null);
          setPreview(null);
          setActiveTab("tasks");
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        },
      }
    );
  };

  const handleDirectIngest = (e: React.FormEvent) => {
    e.preventDefault();
    handleIngest();
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const tabs: { key: RightPanelTab; label: string; icon: React.ReactNode; count?: number }[] = [
    {
      key: "preview",
      label: "Xem trước",
      icon: <Eye className="w-4 h-4" />,
      count: preview?.total_chunks,
    },
    {
      key: "tasks",
      label: "Trạng thái",
      icon: <ClipboardList className="w-4 h-4" />,
      count: tasks?.filter((t) => t.status === "processing" || t.status === "pending").length,
    },
    {
      key: "documents",
      label: "Tài liệu",
      icon: <Database className="w-4 h-4" />,
      count: documents?.length,
    },
  ];

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Cơ sở tri thức</h1>
        <p className="text-sm text-slate-500 mt-1">
          Tải lên tài liệu PDF, DOCX, TXT — xem trước chunks — rồi nhập vào hệ thống AI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ── Left Column: Upload Form ──────────────────────────────────── */}
        <div className="lg:col-span-4 lg:col-start-1">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 sticky top-4">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-emerald-600" />
              Tải tài liệu mới
            </h2>

            <form onSubmit={handleDirectIngest} className="space-y-4">
              {/* Drop Zone */}
              <div
                className={`group relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ease-in-out ${
                  file
                    ? "border-emerald-400 bg-emerald-50/50"
                    : "border-slate-200 hover:bg-slate-50 hover:border-emerald-300 cursor-pointer"
                }`}
                onClick={() => !file && fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.txt"
                />

                {file ? (
                  <div className="space-y-3 relative z-10">
                    <div className="w-12 h-12 bg-white rounded-full shadow-sm border border-emerald-100 flex items-center justify-center mx-auto">
                      <BookOpen className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 truncate px-2">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFile();
                      }}
                      className="inline-flex items-center justify-center px-3 py-1.5 mt-2 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                    >
                      Xóa tệp
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 relative z-10">
                    <div className="w-12 h-12 bg-slate-50 group-hover:bg-white rounded-full flex items-center justify-center mx-auto transition-colors">
                      <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        Nhấn để tải lên hoặc kéo thả tệp
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Hỗ trợ PDF, DOCX, TXT (Tối đa 20MB)
                      </p>
                    </div>
                  </div>
                )}
                {/* Subtle background decoration */}
                {!file && (
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/50 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity pointer-events-none" />
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Danh mục
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                >
                  <option value="agronomy">Nông học & Trồng trọt</option>
                  <option value="regulation">Quy định & Tiêu chuẩn</option>
                  <option value="disease">Bệnh hại & Điều trị</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              {/* Variety */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Giống cây (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                  placeholder="VD: Cà phê Robusta..."
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                />
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 p-3 rounded-lg flex gap-2 items-start">
                <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  Nhấn <strong>"Xem trước"</strong> để kiểm tra chunks trước khi nhập.
                  Hoặc nhấn <strong>"Tải lên"</strong> để nhập trực tiếp.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  disabled={!file || isPreviewing}
                  onClick={handlePreview}
                  className="py-2.5 px-4 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 disabled:border-slate-200 disabled:text-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed font-medium rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-sm"
                >
                  {isPreviewing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
                      Đang tải...
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      Xem trước
                    </>
                  )}
                </button>
                <button
                  type="submit"
                  disabled={!file || isIngesting}
                  className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-sm hover:shadow-md"
                >
                  {isIngesting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang tải…
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      Tải lên
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── Right Column: Tabbed Panel ────────────────────────────────── */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 h-[calc(100vh-8rem)] min-h-[600px] flex flex-col">
            {/* Tab Bar - Modern Pill Design inside a flat container */}
            <div className="p-2 border-b border-slate-100 flex items-center justify-center md:justify-start shrink-0">
              <div className="flex p-1 bg-slate-100 rounded-xl w-fit">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold transition-all rounded-lg relative ${
                      activeTab === tab.key
                        ? "bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200/50"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                      <span
                        className={`min-w-[20px] h-[20px] flex items-center justify-center px-1.5 text-[11px] font-bold rounded-full ml-1 ${
                          activeTab === tab.key
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-5 flex-1 flex flex-col min-h-0">
              {activeTab === "preview" && (
                <div className="flex-1 flex flex-col min-h-0">
                  {preview ? (
                    <ChunkPreviewPanel
                      preview={preview}
                      onIngest={handleIngest}
                      isIngesting={isIngesting}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center flex-1 py-16 text-slate-500 min-h-[400px]">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Eye className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="font-semibold text-slate-700 text-lg">Chưa có bản xem trước</p>
                      <p className="text-sm mt-2 text-slate-500 max-w-sm text-center">
                        Tải lên tệp và nhấn <span className="font-semibold text-emerald-600">"Xem trước"</span> để phân tích cấu trúc tài liệu trước khi đưa vào hệ thống.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "tasks" && (
                <div className="flex-1 overflow-y-auto min-h-0 pr-2">
                  {isTasksLoading ? (
                    <div className="flex justify-center items-center py-20">
                      <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                    </div>
                  ) : (
                    <IngestionTasksList tasks={tasks || []} isLoading={isTasksLoading} />
                  )}
                </div>
              )}

              {activeTab === "documents" && (
                <div className="flex-1 overflow-y-auto min-h-0 pr-2">
                  <DocumentsCatalog
                    documents={documents || []}
                    isLoading={isDocsLoading}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
