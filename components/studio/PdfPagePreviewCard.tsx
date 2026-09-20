'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  FileText,
  Loader2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface PdfPagePreviewCardProps {
  fileUrl?: string | null;
  startPage: number;
  endPage: number;
  totalPages?: number | null;
  onStartPageChange: (page: number) => void;
  onEndPageChange: (page: number) => void;
}

// Global cache for PDF documents and rendered page data URLs
const pdfDocCache = new Map<string, any>();
const pageThumbnailCache = new Map<string, string>();

export function PdfPagePreviewCard({
  fileUrl,
  startPage,
  endPage,
  totalPages = 100,
  onStartPageChange,
  onEndPageChange,
}: PdfPagePreviewCardProps) {
  const [mounted, setMounted] = useState(false);
  const [isPdfJsReady, setIsPdfJsReady] = useState(false);
  const [zoomPage, setZoomPage] = useState<number | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1.2);
  const zoomCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Load PDF.js from CDN dynamically on client
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ((window as any).pdfjsLib) {
      setIsPdfJsReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      if (pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        setIsPdfJsReady(true);
      }
    };
    document.body.appendChild(script);
  }, []);

  // 2. Fetch & Cache PDF Document Proxy
  const getCachedPdfDoc = useCallback(async (url: string) => {
    if (pdfDocCache.has(url)) {
      return pdfDocCache.get(url);
    }
    const pdfjsLib = (window as any).pdfjsLib;
    if (!pdfjsLib) throw new Error('PDF.js engine is not ready yet.');

    // Fetch array buffer through proxy to eliminate any B2 CORS issues
    const proxyUrl = url.startsWith('http')
      ? `/api/library/proxy?url=${encodeURIComponent(url)}`
      : url;

    const res = await fetch(proxyUrl);
    if (!res.ok) throw new Error(`HTTP error ${res.status} fetching PDF stream.`);
    const arrayBuffer = await res.arrayBuffer();

    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
      cMapPacked: true,
    });
    const pdfDoc = await loadingTask.promise;
    pdfDocCache.set(url, pdfDoc);
    return pdfDoc;
  }, []);

  // Lock Body Overflow when Zoom Modal is open
  useEffect(() => {
    if (zoomPage !== null) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [zoomPage]);

  // Close on Escape Key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomPage(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 3. Render High-Res Zoomed Page into Modal Canvas
  useEffect(() => {
    if (!zoomPage || !fileUrl || !isPdfJsReady || !zoomCanvasRef.current) return;

    let isCancelled = false;
    const renderZoom = async () => {
      try {
        const pdfDoc = await getCachedPdfDoc(fileUrl);
        if (isCancelled) return;
        const page = await pdfDoc.getPage(zoomPage);
        if (isCancelled) return;

        const canvas = zoomCanvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        if (!context) return;

        const viewport = page.getViewport({ scale: zoomScale });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvasContext: context,
          viewport,
        }).promise;
      } catch (err) {
        console.error('Zoom render failed:', err);
      }
    };

    renderZoom();
    return () => {
      isCancelled = true;
    };
  }, [zoomPage, zoomScale, fileUrl, isPdfJsReady, getCachedPdfDoc]);

  if (!fileUrl) return null;

  const totalBookPages = totalPages || 500;

  return (
    <div className="space-y-3 pt-2 font-sans">
      {/* Top Header Strip */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-text-bright-slate">
          <BookOpen className="w-3.5 h-3.5 text-team-b-cyan" />
          <span className="font-bold font-mono uppercase tracking-wider text-optic-white">
            Page Slicing Verification
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="px-2.5 py-0.5 rounded-md bg-surface-interactive border border-white/10 text-team-b-cyan font-mono font-bold">
            {startPage === endPage
              ? `Page ${startPage}`
              : `Pages ${startPage} → ${endPage} (${endPage - startPage + 1} pages)`}
          </span>
        </div>
      </div>

      {/* Side-by-side Page Thumbnails */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Start Page */}
        <SinglePageThumbnail
          label="Start Page (First Slice)"
          pageNumber={startPage}
          maxPages={totalBookPages}
          fileUrl={fileUrl}
          isPdfJsReady={isPdfJsReady}
          getCachedPdfDoc={getCachedPdfDoc}
          onPageChange={(p) => {
            const valid = Math.max(1, Math.min(p, endPage));
            onStartPageChange(valid);
          }}
          onZoomClick={() => setZoomPage(startPage)}
        />

        {/* End Page */}
        <SinglePageThumbnail
          label="End Page (Last Slice)"
          pageNumber={endPage}
          maxPages={totalBookPages}
          fileUrl={fileUrl}
          isPdfJsReady={isPdfJsReady}
          getCachedPdfDoc={getCachedPdfDoc}
          onPageChange={(p) => {
            const valid = Math.min(totalBookPages, Math.max(p, startPage));
            onEndPageChange(valid);
          }}
          onZoomClick={() => setZoomPage(endPage)}
        />
      </div>

      {/* Fullscreen Zoom Inspection Modal */}
      {zoomPage &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-surface-obsidian/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-fade-in"
            onClick={() => setZoomPage(null)}
          >
            <div
              className="relative w-full max-w-4xl h-[90vh] max-h-[90vh] rounded-2xl bg-surface-carbon border border-border-medium flex flex-col shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 z-20 shrink-0 flex items-center justify-between px-5 py-3.5 bg-surface-onyx border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-team-b-cyan/15 border border-team-b-cyan/30 flex items-center justify-center text-team-b-cyan shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold font-mono uppercase tracking-wider text-optic-white">
                        Inspect Page
                      </span>
                      <span className="px-2 py-0.5 rounded bg-team-b-cyan/20 border border-team-b-cyan/40 text-xs font-mono font-bold text-team-b-cyan">
                        #{zoomPage}
                      </span>
                    </div>
                    <p className="text-[10px] text-text-muted-slate font-sans hidden sm:block">
                      Total Pages: {totalBookPages} • Click zoom controls or scroll to inspect
                    </p>
                  </div>

                  {/* Stepper buttons inside modal */}
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      type="button"
                      disabled={zoomPage <= 1}
                      onClick={() => setZoomPage((p) => Math.max(1, (p || 1) - 1))}
                      className="p-1 rounded-md bg-surface-interactive hover:bg-white/10 text-text-bright-slate disabled:opacity-30 transition-colors"
                      title="Previous Page"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={zoomPage >= totalBookPages}
                      onClick={() => setZoomPage((p) => Math.min(totalBookPages, (p || 1) + 1))}
                      className="p-1 rounded-md bg-surface-interactive hover:bg-white/10 text-text-bright-slate disabled:opacity-30 transition-colors"
                      title="Next Page"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-surface-interactive border border-white/10 rounded-xl p-1 gap-1">
                    <button
                      type="button"
                      onClick={() => setZoomScale((s) => Math.max(0.7, Number((s - 0.2).toFixed(1))))}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-text-bright-slate hover:text-optic-white transition-colors"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>

                    <span className="text-xs font-mono font-bold text-optic-white px-1.5 min-w-[44px] text-center">
                      {Math.round(zoomScale * 100)}%
                    </span>

                    <button
                      type="button"
                      onClick={() => setZoomScale((s) => Math.min(2.5, Number((s + 0.2).toFixed(1))))}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-text-bright-slate hover:text-optic-white transition-colors"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setZoomPage(null)}
                    className="p-2 rounded-xl bg-surface-interactive hover:bg-white/15 text-text-bright-slate hover:text-optic-white transition-colors ml-1 border border-white/10"
                    title="Close (Esc)"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable Canvas Body */}
              <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-start justify-center bg-surface-obsidian/80">
                <canvas
                  ref={zoomCanvasRef}
                  className="rounded-xl shadow-2xl border border-white/10 max-w-full h-auto"
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Sub-component: Single Page Thumbnail
// ─────────────────────────────────────────────────────────────────
interface SinglePageThumbnailProps {
  label: string;
  pageNumber: number;
  maxPages: number;
  fileUrl: string;
  isPdfJsReady: boolean;
  getCachedPdfDoc: (url: string) => Promise<any>;
  onPageChange: (page: number) => void;
  onZoomClick: () => void;
}

function SinglePageThumbnail({
  label,
  pageNumber,
  maxPages,
  fileUrl,
  isPdfJsReady,
  getCachedPdfDoc,
  onPageChange,
  onZoomClick,
}: SinglePageThumbnailProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [thumbnailDataUrl, setThumbnailDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isPdfJsReady || !fileUrl || !pageNumber) return;

    const cacheKey = `${fileUrl}_p${pageNumber}`;
    if (pageThumbnailCache.has(cacheKey)) {
      setThumbnailDataUrl(pageThumbnailCache.get(cacheKey)!);
      setIsLoading(false);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);

    const renderThumbnail = async () => {
      try {
        const pdfDoc = await getCachedPdfDoc(fileUrl);
        if (isCancelled) return;

        const total = pdfDoc.numPages || maxPages;
        const targetPage = Math.max(1, Math.min(pageNumber, total));
        const page = await pdfDoc.getPage(targetPage);
        if (isCancelled) return;

        const viewport = page.getViewport({ scale: 0.5 });
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = viewport.width;
        offscreenCanvas.height = viewport.height;
        const ctx = offscreenCanvas.getContext('2d');

        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

          await page.render({
            canvasContext: ctx,
            viewport,
          }).promise;

          if (!isCancelled) {
            const dataUrl = offscreenCanvas.toDataURL('image/jpeg', 0.85);
            pageThumbnailCache.set(cacheKey, dataUrl);
            setThumbnailDataUrl(dataUrl);
          }
        }
      } catch (err) {
        console.warn('Failed to render page thumbnail:', err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    renderThumbnail();
    return () => {
      isCancelled = true;
    };
  }, [fileUrl, pageNumber, isPdfJsReady, maxPages, getCachedPdfDoc]);

  return (
    <div className="p-3 rounded-xl bg-surface-onyx border border-white/10 space-y-2.5 flex flex-col justify-between">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-text-muted-slate">
          {label}
        </span>

        {/* Stepper Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={pageNumber <= 1}
            onClick={() => onPageChange(pageNumber - 1)}
            className="p-1 rounded bg-surface-interactive hover:bg-white/10 text-text-bright-slate disabled:opacity-30 transition-colors"
            title="Previous Page"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>

          <span className="px-2 py-0.5 rounded bg-surface-carbon text-xs font-mono font-bold text-optic-white min-w-[36px] text-center border border-white/10">
            {pageNumber}
          </span>

          <button
            type="button"
            disabled={pageNumber >= maxPages}
            onClick={() => onPageChange(pageNumber + 1)}
            className="p-1 rounded bg-surface-interactive hover:bg-white/10 text-text-bright-slate disabled:opacity-30 transition-colors"
            title="Next Page"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Surface Preview */}
      <div
        onClick={onZoomClick}
        className="relative group h-44 rounded-lg bg-surface-obsidian border border-white/5 flex items-center justify-center overflow-hidden cursor-pointer hover:border-white/20 transition-all"
        title="Click to inspect page in full resolution"
      >
        {isLoading ? (
          <div className="flex flex-col items-center gap-1.5 text-text-muted-slate text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-team-b-cyan" />
            <span className="text-[11px]">Loading page #{pageNumber}...</span>
          </div>
        ) : thumbnailDataUrl ? (
          <>
            <img
              src={thumbnailDataUrl}
              alt={`Page ${pageNumber}`}
              className="h-full object-contain p-1 rounded transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-surface-obsidian/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-xs text-optic-white font-mono uppercase tracking-wider font-bold">
              <Maximize2 className="w-3.5 h-3.5 text-team-b-cyan" />
              <span>Inspect</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-text-muted-slate text-[11px] p-2 text-center">
            <FileText className="w-5 h-5 text-text-muted-slate" />
            <span>Page #{pageNumber}</span>
          </div>
        )}
      </div>
    </div>
  );
}
