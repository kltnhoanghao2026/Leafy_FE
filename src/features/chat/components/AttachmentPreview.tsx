import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, FileText, Film, Music, Archive, File } from 'lucide-react';
import type { AttachmentInfoResponse } from '../api/chatApi';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileTypeIcon({ contentType }: { contentType: string }) {
  const cls = 'w-6 h-6';
  if (contentType.startsWith('video/'))  return <Film className={`${cls} text-purple-500`} />;
  if (contentType.startsWith('audio/'))  return <Music className={`${cls} text-pink-500`} />;
  if (contentType.includes('pdf'))       return <FileText className={`${cls} text-red-500`} />;
  if (contentType.includes('zip') || contentType.includes('rar') || contentType.includes('tar'))
    return <Archive className={`${cls} text-yellow-600`} />;
  if (contentType.startsWith('text/'))   return <FileText className={`${cls} text-blue-400`} />;
  return <File className={`${cls} text-blue-500`} />;
}

// ── Lightbox ──────────────────────────────────────────────────────────────────

interface LightboxProps {
  urls: string[];
  names: string[];
  initialIndex: number;
  onClose: () => void;
}

function ImageLightbox({ urls, names, initialIndex, onClose }: LightboxProps) {
  const [idx, setIdx] = useState(initialIndex);
  const prev = () => setIdx(i => Math.max(0, i - 1));
  const next = () => setIdx(i => Math.min(urls.length - 1, i + 1));

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'Escape') onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/92 z-[200] flex items-center justify-center"
      onClick={onClose}
      onKeyDown={handleKey}
      tabIndex={-1}
    >
      <div className="relative max-w-[90vw] max-h-[92vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
        <img
          src={urls[idx]}
          alt={names[idx]}
          className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg shadow-2xl"
        />
        {/* Name */}
        <p className="text-white/60 text-xs mt-2 truncate max-w-xs">{names[idx]}</p>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Navigation */}
        {urls.length > 1 && (
          <>
            <button
              onClick={prev} disabled={idx === 0}
              className="absolute left-[-48px] top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 disabled:opacity-20 text-white rounded-full flex items-center justify-center transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button
              onClick={next} disabled={idx === urls.length - 1}
              className="absolute right-[-48px] top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 disabled:opacity-20 text-white rounded-full flex items-center justify-center transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
            <div className="absolute bottom-7 left-1/2 -translate-x-1/2 text-white/50 text-[11px] bg-black/40 px-2 py-0.5 rounded-full">
              {idx + 1} / {urls.length}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
interface AttachmentPreviewProps {
  attachments: AttachmentInfoResponse[];
  type: string;
  isMe: boolean;
}

export function AttachmentPreview({ attachments, type, isMe }: AttachmentPreviewProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!attachments || attachments.length === 0) return null;

  // ── IMAGE grid ───────────────────────────────────────────────────────────────
  if (type === 'IMAGE') {
    const imageAtts = attachments.filter(a => a.contentType?.startsWith('image/'));
    const fileAtts  = attachments.filter(a => !a.contentType?.startsWith('image/'));
    const urls  = imageAtts.map(a => a.url);
    const names = imageAtts.map(a => a.originalFileName);
    const n = imageAtts.length;

    const gridCls =
      n === 1 ? 'grid-cols-1' :
      n === 2 ? 'grid-cols-2' :
      n === 3 ? 'grid-cols-3' : 'grid-cols-2';

    return (
      <>
        {lightboxIndex !== null && (
          <ImageLightbox urls={urls} names={names} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
        )}
        {n > 0 && (
          <div className={`grid gap-1 rounded-2xl overflow-hidden ${gridCls}`} style={{ maxWidth: 320 }}>
            {imageAtts.map((att, i) => (
              <div
                key={i}
                className="relative cursor-pointer group overflow-hidden"
                onClick={() => setLightboxIndex(i)}
                style={{ aspectRatio: n === 1 ? undefined : '1/1' }}
              >
                <img
                  src={att.url}
                  alt={att.originalFileName}
                  className={`object-cover w-full h-full ${n === 1 ? 'max-h-72 rounded-xl' : ''}`}
                  style={n === 1 ? { objectFit: 'contain', maxHeight: 288 } : {}}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
              </div>
            ))}
          </div>
        )}
        {/* Non-image files mixed into the same message */}
        {fileAtts.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-1" style={{ minWidth: 220, maxWidth: 320 }}>
            {fileAtts.map((att, i) => (
              <a
                key={i}
                href={att.url}
                download={att.originalFileName}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-2xl shadow-sm hover:bg-gray-50 transition-colors group overflow-hidden"
              >
                <div className={`w-1 self-stretch rounded-full shrink-0 ${isMe ? 'bg-green-500' : 'bg-gray-300'}`} />
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <FileTypeIcon contentType={att.contentType} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-gray-800 truncate">{att.originalFileName}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{formatSize(att.size ?? 0)}</p>
                </div>
                <Download className="w-4 h-4 shrink-0 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ))}
          </div>
        )}

      </>
    );
  }

  // ── VIDEO ────────────────────────────────────────────────────────────────────
  if (type === 'VIDEO') {
    const att = attachments[0];
    return (
      <div className="flex flex-col gap-1.5">
        <video
          controls
          src={att.url}
          className="rounded-xl max-w-xs bg-black"
          style={{ maxHeight: 220 }}
        />
      </div>
    );
  }

  // ── FILE card(s) ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-1.5" style={{ minWidth: 220, maxWidth: 320 }}>
      {attachments.map((att, i) => (
        <a
          key={i}
          href={att.url}
          download={att.originalFileName}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-2xl shadow-sm hover:bg-gray-50 transition-colors group overflow-hidden"
        >
          {/* Accent strip */}
          <div className={`w-1 self-stretch rounded-full shrink-0 ${isMe ? 'bg-green-500' : 'bg-gray-300'}`} />
          {/* Icon */}
          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
            <FileTypeIcon contentType={att.contentType} />
          </div>
          {/* Name + size */}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-gray-800 truncate">{att.originalFileName}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{formatSize(att.size ?? 0)}</p>
          </div>
          <Download className="w-4 h-4 shrink-0 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
      ))}
    </div>
  );
}

