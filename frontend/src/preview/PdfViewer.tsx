import React, { useState, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle2,
  Eye,
  FileText,
  ExternalLink,
  Layers
} from 'lucide-react';
import { api } from '../services/api';

interface PdfViewerProps {
  resumeId: string;
  pdfUrl?: string;
  isOutdated: boolean;
  isCompiling: boolean;
  compileErrors: any[];
  onCompile: () => void;
  onInspect: () => void;
  inspectionReport?: any;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  resumeId,
  pdfUrl,
  isOutdated,
  isCompiling,
  compileErrors,
  onCompile,
  onInspect,
  inspectionReport
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<'sheet' | 'embed'>('sheet');
  const [pages, setPages] = useState<Array<{
    page_number: number;
    base64: string;
    width: number;
    height: number;
  }>>([]);
  const [loadingPages, setLoadingPages] = useState<boolean>(false);

  const fetchPages = async () => {
    if (!resumeId) return;
    setLoadingPages(true);
    try {
      const res = await api.getPdfPages(resumeId);
      if (res && res.pages && res.pages.length > 0) {
        setPages(res.pages);
      }
    } catch {
      // If image extraction is pending, native embed remains available
    } finally {
      setLoadingPages(false);
    }
  };

  useEffect(() => {
    if (resumeId) {
      fetchPages();
    }
  }, [resumeId, pdfUrl]);

  const handleCompile = async () => {
    await onCompile();
    // Refresh page images after compilation
    setTimeout(() => {
      fetchPages();
    }, 800);
  };

  const zoomIn = () => setZoom(prev => Math.min(prev + 15, 200));
  const zoomOut = () => setZoom(prev => Math.max(prev - 15, 50));
  const resetZoom = () => setZoom(100);

  const activePdfUrl = pdfUrl ? `${pdfUrl}#zoom=${zoom}` : null;

  return (
    <div className="flex flex-col h-full bg-[#FFFFFF] border border-[#DEDEDE] overflow-hidden rounded-none">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#FFFFFF] border-b border-[#DEDEDE] text-xs shrink-0">
        {/* Left: Compile Action & Status */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleCompile}
            disabled={isCompiling}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer border rounded-none ${
              isOutdated
                ? 'bg-[#222222] text-white border-[#222222] hover:bg-[#333333]'
                : 'bg-white text-[#222222] border-[#DEDEDE] hover:bg-[#F0F0F0]'
            } disabled:opacity-40`}
            title="Compile LaTeX source into PDF"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCompiling ? 'animate-spin' : ''}`} />
            <span>{isCompiling ? 'Compiling...' : isOutdated ? 'Recompile PDF' : 'Compile'}</span>
          </button>

          {isOutdated ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-[#b26a00] font-mono">
              <span className="w-1.5 h-1.5 bg-[#b26a00]" />
              Preview Outdated
            </span>
          ) : (pdfUrl || pages.length > 0) ? (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-[#2e7d32] font-mono">
              <span className="w-1.5 h-1.5 bg-[#2e7d32]" />
              Up to Date
            </span>
          ) : null}
        </div>

        {/* Right: View Toggle, Zoom & Export Controls */}
        <div className="flex items-center space-x-1.5">
          {/* Mode Switcher */}
          <div className="hidden md:flex items-center bg-white border border-[#DEDEDE] rounded-none text-[11px]">
            <button
              onClick={() => setPreviewMode('sheet')}
              className={`px-2 py-1 transition-colors ${
                previewMode === 'sheet'
                  ? 'bg-[#222222] text-white font-medium'
                  : 'text-[#666666] hover:bg-[#F0F0F0]'
              }`}
              title="Visual Document Sheet View"
            >
              Document
            </button>
            <button
              onClick={() => setPreviewMode('embed')}
              className={`px-2 py-1 transition-colors border-l border-[#DEDEDE] ${
                previewMode === 'embed'
                  ? 'bg-[#222222] text-white font-medium'
                  : 'text-[#666666] hover:bg-[#F0F0F0]'
              }`}
              title="Native PDF Embed View"
            >
              PDF Embed
            </button>
          </div>

          {/* Zoom controls */}
          <div className="hidden sm:flex items-center bg-white border border-[#DEDEDE] rounded-none">
            <button
              onClick={zoomOut}
              className="p-1 text-[#666666] hover:text-[#222222] hover:bg-[#F0F0F0] rounded-none transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-[#444444] px-1.5 min-w-[38px] text-center border-x border-[#DEDEDE]">
              {zoom}%
            </span>
            <button
              onClick={zoomIn}
              className="p-1 text-[#666666] hover:text-[#222222] hover:bg-[#F0F0F0] rounded-none transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetZoom}
              className="p-1 text-[#666666] hover:text-[#222222] hover:bg-[#F0F0F0] rounded-none transition-colors border-l border-[#DEDEDE]"
              title="Reset Zoom"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Inspect Button */}
          <button
            onClick={() => {
              onInspect();
              setShowDiagnostics(true);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-[#222222] bg-white hover:bg-[#F0F0F0] border border-[#DEDEDE] transition-colors rounded-none"
            title="Inspect PDF Geometry & Margins"
          >
            <Eye className="w-3.5 h-3.5 text-[#666666]" />
            <span>Inspect</span>
          </button>

          {/* Open in New Tab */}
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-[#666666] hover:text-[#222222] bg-white hover:bg-[#F0F0F0] border border-[#DEDEDE] transition-colors rounded-none inline-flex items-center"
              title="Open PDF in New Browser Tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {/* Download PDF */}
          <a
            href={api.getExportUrl(resumeId, 'pdf')}
            download
            className="p-1.5 text-[#222222] bg-white hover:bg-[#F0F0F0] border border-[#DEDEDE] transition-colors rounded-none inline-flex items-center"
            title="Download PDF"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Compiler Errors Banner if compilation failed */}
      {compileErrors && compileErrors.length > 0 && (
        <div className="bg-[#FFFFFF] border-b border-[#c62828] p-3 text-xs text-[#c62828] space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Compilation Failed</span>
          </div>
          {compileErrors.map((err, i) => (
            <div key={i} className="pl-5 font-mono text-[11px]">
              {err.line_number && <span className="font-bold">[Line {err.line_number}] </span>}
              <span>{err.message}</span>
              {err.context && <div className="text-[#666666] mt-0.5 pl-2 border-l border-[#DEDEDE]">{err.context}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Geometry Diagnostics Drawer */}
      {showDiagnostics && inspectionReport && (
        <div className="bg-[#FFFFFF] border-b border-[#DEDEDE] p-3 text-xs text-[#222222] relative">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-[#222222] flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-[#666666]" />
              PDF Geometry & Layout Analysis
            </span>
            <button
              onClick={() => setShowDiagnostics(false)}
              className="text-[#888888] hover:text-[#222222] text-xs"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
            <div className="p-2 bg-[#F7F7F7] border border-[#DEDEDE] rounded-none">
              <span className="text-[10px] text-[#666666] uppercase block">Pages</span>
              <p className="text-xs font-semibold text-[#222222]">{inspectionReport.pages_count} / {inspectionReport.target_pages}</p>
            </div>
            <div className="p-2 bg-[#F7F7F7] border border-[#DEDEDE] rounded-none">
              <span className="text-[10px] text-[#666666] uppercase block">Total Words</span>
              <p className="text-xs font-semibold text-[#222222]">{inspectionReport.total_words}</p>
            </div>
            <div className="p-2 bg-[#F7F7F7] border border-[#DEDEDE] rounded-none">
              <span className="text-[10px] text-[#666666] uppercase block">Density</span>
              <p className="text-xs font-semibold text-[#222222]">
                {inspectionReport.pages?.[0]?.vertical_density ? `${Math.round(inspectionReport.pages[0].vertical_density * 100)}%` : 'N/A'}
              </p>
            </div>
            <div className="p-2 bg-[#F7F7F7] border border-[#DEDEDE] rounded-none">
              <span className="text-[10px] text-[#666666] uppercase block">Inspection Type</span>
              <p className="text-xs font-semibold text-[#222222] uppercase tracking-wider">{inspectionReport.inspection_type || 'Geometry'}</p>
            </div>
          </div>

          {inspectionReport.issues && inspectionReport.issues.length > 0 ? (
            <div className="space-y-1">
              {inspectionReport.issues.map((iss: any, i: number) => (
                <div key={i} className="flex items-start gap-1.5 text-[#b26a00] text-[11px]">
                  <AlertTriangle className="w-3 3.5 shrink-0 mt-0.5" />
                  <span>{iss.message}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#2e7d32] text-[11px] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Satisfies 1-page target with balanced margins.
            </p>
          )}
        </div>
      )}

      {/* Main Preview Area: Neutral #F2F2F2 Canvas with Clean White Document Sheet */}
      <div className="flex-1 bg-[#F2F2F2] flex items-center justify-center relative overflow-hidden">
        {isCompiling ? (
          <div className="flex flex-col items-center justify-center text-[#666666] space-y-2 p-8">
            <RefreshCw className="w-6 h-6 text-[#222222] animate-spin" />
            <p className="text-xs font-medium text-[#222222]">Compiling LaTeX into PDF...</p>
            <p className="text-[11px] text-[#888888]">Subprocess sandboxed run in progress</p>
          </div>
        ) : previewMode === 'sheet' && pages.length > 0 ? (
          /* Visual Document Sheet View */
          <div className="w-full h-full overflow-auto p-6 flex flex-col items-center gap-6">
            {pages.map((p) => {
              const baseWidth = 680;
              const computedWidth = Math.round(baseWidth * (zoom / 100));
              return (
                <div
                  key={p.page_number}
                  className="bg-white border border-[#DEDEDE] shadow-sm relative transition-all duration-150 shrink-0"
                  style={{ width: `${computedWidth}px`, maxWidth: '100%' }}
                >
                  <img
                    src={p.base64}
                    alt={`Resume Page ${p.page_number}`}
                    className="w-full h-auto block select-none"
                  />
                  <div className="absolute bottom-2 right-2 bg-white/90 border border-[#DEDEDE] px-2 py-0.5 text-[9px] text-[#666666] font-mono">
                    Page {p.page_number} of {pages.length}
                  </div>
                </div>
              );
            })}
          </div>
        ) : pdfUrl ? (
          /* Native PDF Iframe / Fallback View */
          <div className="w-full h-full">
            <iframe
              src={activePdfUrl || pdfUrl}
              className="w-full h-full border-0 bg-white"
              title="PDF Preview"
            />
          </div>
        ) : (
          <div className="text-center p-8 text-[#666666] max-w-sm">
            <FileText className="w-10 h-10 text-[#888888] mx-auto mb-2" />
            <h4 className="text-xs font-semibold text-[#222222] mb-1">No Compiled PDF Yet</h4>
            <p className="text-[11px] text-[#666666] mb-3">
              Click the "Compile" button above to generate a high-resolution, typographically perfect PDF from your resume.
            </p>
            <button
              onClick={handleCompile}
              className="px-3.5 py-1.5 bg-[#222222] hover:bg-[#333333] text-white text-xs font-medium inline-flex items-center gap-1.5 border border-[#222222] rounded-none cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Compile Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
