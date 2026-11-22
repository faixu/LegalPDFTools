import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, Download, RotateCcw, RotateCw, Minus, Plus, FileText, XCircle } from 'lucide-react';

interface PreviewViewerProps {
  fileUrl?: string;
  fileName?: string;
  title?: string;
  onDownload?: () => void;
  onRemove?: () => void;
  processing?: boolean;
  error?: string | null;
}

export function PreviewViewer({
  fileUrl,
  fileName,
  title = 'Preview',
  onDownload,
  onRemove,
  processing = false,
  error = null,
}: PreviewViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotate, setRotate] = useState(0);
  const [renderError, setRenderError] = useState<string | null>(null);

  // Configure pdfjs worker
  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
  }, []);

  const handleDocumentLoad = ({ numPages: pages }: { numPages: number }) => {
    setNumPages(pages);
    setPageNumber(1);
    setRenderError(null);
  };

  const handlePageError = (err: Error) => {
    setRenderError(err.message);
    console.error('PDF render error:', err);
  };

  const goToPage = (page: number) => {
    if (numPages && page >= 1 && page <= numPages) {
      setPageNumber(page);
    }
  };

  const zoomIn = () => setScale(s => Math.min(s + 0.25, 3));
  const zoomOut = () => setScale(s => Math.max(s - 0.25, 0.5));
  const resetZoom = () => setScale(1);
  const rotateLeft = () => setRotate(r => (r - 90 + 360) % 360);
  const rotateRight = () => setRotate(r => (r + 90) % 360);

  // Empty state
  if (!fileUrl && !processing && !error) {
    return (
      <div className="pdf-preview-container">
        <div className="pdf-preview-content flex-1 flex items-center justify-center">
          <div className="text-center text-muted p-8">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No PDF loaded</p>
            <p className="text-sm mt-1">Upload a file to see preview</p>
          </div>
        </div>
      </div>
    );
  }

  // Processing state
  if (processing) {
    return (
      <div className="pdf-preview-container">
        <div className="pdf-preview-content flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="spinner-lg mx-auto mb-4" />
            <p className="text-lg font-medium">Processing PDF...</p>
            <p className="text-sm text-muted mt-1">Please wait while we process your document</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="pdf-preview-container">
        <div className="pdf-preview-content flex-1 flex items-center justify-center">
          <div className="text-center text-red-600 p-8">
            <XCircle className="w-16 h-16 mx-auto mb-4" />
            <p className="text-lg font-medium">Failed to load preview</p>
            <p className="text-sm text-muted mt-1">{error}</p>
            {onRemove && (
              <button type="button" className="btn btn-outline mt-4" onClick={onRemove}>
                Try Another File
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pdf-preview-container">
      <div className="pdf-preview-header flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h4 className="font-semibold text-gray-900 truncate max-w-[300px]">
            {fileName || title}
          </h4>
          {numPages && (
            <span className="badge badge-info">
              {numPages} page{numPages !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Page Navigation */}
          {numPages && numPages > 1 && (
            <div className="flex items-center gap-1 border rounded-lg p-1 bg-white">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => goToPage(pageNumber - 1)}
                disabled={pageNumber <= 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 text-sm font-mono text-gray-700">
                {pageNumber} / {numPages}
              </span>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => goToPage(pageNumber + 1)}
                disabled={pageNumber >= numPages}
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 border rounded-lg p-1 bg-white">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={zoomOut}
              disabled={scale <= 0.5}
              aria-label="Zoom out"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="px-2 text-sm font-mono text-gray-700 w-16 text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={zoomIn}
              disabled={scale >= 3}
              aria-label="Zoom in"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={resetZoom}
              aria-label="Reset zoom"
            >
              <span className="text-xs font-medium">100%</span>
            </button>
          </div>

          {/* Rotation Controls */}
          <div className="flex items-center gap-1 border rounded-lg p-1 bg-white">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={rotateLeft}
              aria-label="Rotate left"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <span className="px-2 text-sm font-mono text-gray-700 w-16 text-center">
              {rotate === 0 ? '0°' : rotate === 90 ? '90°' : rotate === 180 ? '180°' : '270°'}
            </span>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={rotateRight}
              aria-label="Rotate right"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {onDownload && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={onDownload}
                disabled={processing}
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            )}
            {onRemove && (
              <button
                type="button"
                className="btn btn-outline btn-sm text-red-600 hover:bg-red-50 border-red-200"
                onClick={onRemove}
                disabled={processing}
                aria-label="Remove file"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="pdf-preview-content flex-1 overflow-auto">
        {renderError && (
          <div className="flex items-center justify-center h-full text-red-600 p-8">
            <div className="text-center">
              <XCircle className="w-12 h-12 mx-auto mb-2" />
              <p>Failed to render page</p>
              <p className="text-sm text-muted mt-1">{renderError}</p>
            </div>
          </div>
        )}

        {!renderError && fileUrl && (
          <Document
            file={fileUrl}
            onLoadSuccess={handleDocumentLoad}
            onLoadError={handlePageError}
            loading={() => (
              <div className="flex items-center justify-center h-64">
                <div className="spinner" />
              </div>
            )}
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              rotate={rotate}
              onRenderError={handlePageError}
            />
          </Document>
        )}
      </div>
    </div>
  );
}