import { useState } from "react";
import { FileText, Layers, Hash, Copy, Check, AlignLeft } from "lucide-react";
import type { PreviewResponse, ChunkPreview } from "../api/knowledgeBaseApi";

interface ChunkPreviewPanelProps {
  preview: PreviewResponse;
  onIngest: () => void;
  isIngesting: boolean;
}

function isMarkdownFilename(filename: string): boolean {
  return filename.endsWith(".md") || filename.endsWith(".markdown");
}

function ChunkCard({ chunk }: { chunk: ChunkPreview }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const isLong = chunk.text.length > 250;
  const displayText =
    expanded || !isLong ? chunk.text : chunk.text.slice(0, 250) + "…";

  const handleCopy = () => {
    navigator.clipboard.writeText(chunk.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group p-4 rounded-xl border border-slate-200/60 bg-white shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col">
      <div className="absolute top-0 left-0 bottom-0 w-1 bg-emerald-400 opacity-70 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-center justify-between mb-2 pl-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-md bg-emerald-50 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-100">
            {chunk.index + 1}
          </span>
          <span className="text-[11px] text-slate-500 font-medium px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-full">
            {chunk.text.length} ký tự
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          title="Sao chép nội dung"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words pl-2 flex-1">
        {displayText}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 pl-2 text-xs text-emerald-600 hover:text-emerald-700 font-medium self-start"
        >
          {expanded ? "Thu gọn nội dung" : "Xem toàn bộ nội dung"}
        </button>
      )}
    </div>
  );
}

export function ChunkPreviewPanel({
  preview,
  onIngest,
  isIngesting,
}: ChunkPreviewPanelProps) {
  return (
    <div className="flex flex-col h-full gap-4">
      {/* Stats Bar */}
      <div className="shrink-0 flex flex-wrap items-start gap-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50/50 rounded-2xl border border-emerald-100/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm border border-emerald-50">
            <FileText className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="font-semibold text-sm text-slate-800 truncate max-w-[240px]" title={preview.filename}>
            {preview.filename}
          </span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm border border-slate-100 text-xs text-slate-600">
          <Layers className="w-4 h-4 text-emerald-500" />
          <span className="font-bold text-slate-800">{preview.total_chunks}</span> chunks
        </div>

        {isMarkdownFilename(preview.filename) && preview.sections.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-lg shadow-sm border border-indigo-100 text-xs text-indigo-700">
            <AlignLeft className="w-4 h-4 text-indigo-500" />
            <span className="font-semibold">{preview.sections.length}</span> tiêu đề
          </div>
        )}

        <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-500 bg-white/60 px-3 py-1.5 rounded-lg">
          <Hash className="w-4 h-4 text-slate-400" />
          {isMarkdownFilename(preview.filename)
            ? "TB: ~2000 ký tự / chunk — theo tiêu đề Markdown"
            : "TB: ~1000 ký tự / chunk — phân đoạn cố định"}
        </div>
      </div>

      {/* Sections panel — only for markdown files */}
      {isMarkdownFilename(preview.filename) && preview.sections.length > 0 && (
        <div className="shrink-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <AlignLeft className="w-3.5 h-3.5" />
            Cấu trúc tài liệu (theo tiêu đề Markdown)
          </p>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
            {preview.sections.map((section, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2.5 py-1 text-[11px] font-medium bg-indigo-50 text-indigo-700 rounded-full ring-1 ring-indigo-100/60 hover:bg-indigo-100 transition-colors cursor-default"
                title={section}
              >
                {section}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Flat chunk list */}
      <div className="space-y-3 flex-1 overflow-y-auto min-h-0 pr-2">
        {preview.chunks.map((chunk: ChunkPreview) => (
          <ChunkCard key={chunk.index} chunk={chunk} />
        ))}
      </div>

      {/* Ingest Button */}
      <div className="shrink-0 pt-2">
        <button
          onClick={onIngest}
          disabled={isIngesting}
          className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
        >
          {isIngesting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Đang xử lý…
            </>
          ) : (
            <>
              <Layers className="w-4 h-4" />
              Xác nhận &amp; Đưa vào CSDL ({preview.total_chunks} chunks)
            </>
          )}
        </button>
      </div>
    </div>
  );
}
