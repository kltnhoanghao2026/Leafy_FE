import { useState, useEffect } from "react";
import { FileText, Database, Tag, Hash, BookOpen, Star, X, Loader2 } from "lucide-react";
import { ModalShell } from "../../../../components/ui/ModalShell";
import { ragApi, type ChunkDetail } from "../api/plan.api";
import type { SourceDocument } from "../../shared/types";

interface SourceDocumentModalProps {
  sourceDocument: SourceDocument;
  onClose: () => void;
}

export function SourceDocumentModal({
  sourceDocument,
  onClose,
}: SourceDocumentModalProps) {
  const [chunkDetail, setChunkDetail] = useState<ChunkDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sourceDocument.pointId) {
      setChunkDetail(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    ragApi
      .getChunksByPointIds([sourceDocument.pointId])
      .then((results) => {
        if (!cancelled && results.length > 0) {
          setChunkDetail(results[0]);
        } else if (!cancelled) {
          setError("Không tìm thấy nội dung chunk tương ứng.");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Lỗi khi tải nội dung.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sourceDocument.pointId]);

  const metadata = sourceDocument.metadata ?? {};
  const sourceFile =
    (metadata.source_file as string | undefined) ??
    (metadata.source as string | undefined) ??
    sourceDocument.title;
  const section =
    (metadata.section_full_path as string | undefined) ??
    (metadata.section as string | undefined);
  const category = metadata.category as string | undefined;
  const variety = metadata.variety as string | undefined;
  const rerankScore = metadata.rerank_score as number | undefined;

  const scorePct = rerankScore != null ? Math.round(rerankScore * 100) : null;

  return (
    <ModalShell
      onClose={onClose}
      icon={<FileText className="h-5 w-5 text-[#245A34]" strokeWidth={2.5} />}
      title="Chi tiết tài liệu nguồn"
      titleId="source-doc-title"
      subtitle={
        <p className="mt-0.5 text-sm font-medium text-slate-400">
          {sourceDocument.title ?? sourceFile ?? "Tài liệu không có tiêu đề"}
        </p>
      }
      position="centered"
      maxWidth="sm:max-w-2xl"
    >
      <div className="space-y-5 px-6 py-5">

        {/* ── Metadata chips ── */}
        <div className="flex flex-wrap gap-2">
          {sourceFile && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
              <FileText className="h-3.5 w-3.5 text-slate-400" strokeWidth={2.5} />
              {sourceFile}
            </span>
          )}
          {section && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
              <BookOpen className="h-3.5 w-3.5 text-emerald-400" strokeWidth={2.5} />
              {section}
            </span>
          )}
          {category && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
              <Tag className="h-3.5 w-3.5 text-blue-400" strokeWidth={2.5} />
              {category}
            </span>
          )}
          {variety && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
              <Database className="h-3.5 w-3.5 text-amber-400" strokeWidth={2.5} />
              {variety}
            </span>
          )}
        </div>

        {/* ── Score ── */}
        {scorePct !== null && (
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-slate-400">
                <Star className="h-3.5 w-3.5" strokeWidth={2.5} />
                Điểm liên quan
              </p>
              <span className="text-sm font-black text-slate-800">{scorePct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[#245A34] transition-all"
                style={{ width: `${scorePct}%` }}
              />
            </div>
          </div>
        )}

        {/* ── Content ── */}
        {sourceDocument.pointId ? (
          loading ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 py-10">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              <p className="text-sm font-bold text-slate-500">Đang tải nội dung chunk...</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-5 text-sm font-bold text-rose-700">
              {error}
            </div>
          ) : chunkDetail ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Nội dung chunk
                </p>
                <span className="flex items-center gap-1 text-[10px] font-black text-slate-400">
                  <Hash className="h-3 w-3" strokeWidth={2.5} />
                  Chunk #{chunkDetail.chunk_index}
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="whitespace-pre-wrap text-sm font-semibold leading-relaxed text-slate-700">
                  {chunkDetail.text}
                </p>
              </div>

              {/* ── Technical info ── */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Document ID
                  </p>
                  <p className="truncate text-xs font-mono font-semibold text-slate-600">
                    {chunkDetail.document_id}
                  </p>
                </div>
                {chunkDetail.point_id && (
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Point ID (Qdrant)
                    </p>
                    <p className="truncate text-xs font-mono font-semibold text-slate-600">
                      {chunkDetail.point_id}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-5">
              <p className="text-sm font-semibold text-slate-500 italic">
                Không có nội dung chunk chi tiết.
              </p>
            </div>
          )
        ) : (
          /* No pointId — show page_content directly */
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Nội dung
            </p>
            <div className="max-h-80 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="whitespace-pre-wrap text-sm font-semibold leading-relaxed text-slate-700">
                {sourceDocument.pageContent}
              </p>
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
