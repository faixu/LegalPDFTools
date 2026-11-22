import { useState, useRef, useEffect, useCallback } from 'react';
import { Trash2, Undo2, Redo2, MousePointer, Square, X, AlertTriangle } from 'lucide-react';

export interface RedactionRect {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface RedactionToolProps {
  pdfUrl: string;
  pageCount: number;
  onRedactionsChange: (redactions: RedactionRect[]) => void;
  initialRedactions?: RedactionRect[];
  disabled?: boolean;
}

export function RedactionTool({
  pdfUrl,
  pageCount,
  onRedactionsChange,
  initialRedactions = [],
  disabled = false,
}: RedactionToolProps) {
  const [redactions, setRedactions] = useState<RedactionRect[]>(initialRedactions);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [currentDrawRect, setCurrentDrawRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [history, setHistory] = useState<RedactionRect[][]>([initialRedactions]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Notify parent of changes
  useEffect(() => {
    onRedactionsChange(redactions);
  }, [redactions, onRedactionsChange]);

  // Update history when redactions change
  const addToHistory = useCallback((newRedactions: RedactionRect[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newRedactions);
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const updateRedactions = useCallback((newRedactions: RedactionRect[]) => {
    setRedactions(newRedactions);
    addToHistory(newRedactions);
  }, [addToHistory]);

  const handleAddRedaction = useCallback((rect: { x: number; y: number; width: number; height: number }) => {
    const newRedaction: RedactionRect = {
      page: currentPage,
      x: Math.round(rect.x / scale),
      y: Math.round(rect.y / scale),
      width: Math.round(rect.width / scale),
      height: Math.round(rect.height / scale),
    };
    updateRedactions([...redactions, newRedaction]);
  }, [currentPage, redactions, scale, updateRedactions]);

  const handleRemoveRedaction = useCallback((index: number) => {
    updateRedactions(redactions.filter((_, i) => i !== index));
  }, [redactions, updateRedactions]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setRedactions(history[newIndex]);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setRedactions(history[newIndex]);
    }
  }, [history, historyIndex]);

  const handleClearAll = useCallback(() => {
    updateRedactions([]);
  }, [updateRedactions]);

  // Mouse handlers for drawing
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setDrawStart({ x, y });
    setCurrentDrawRect({ x, y, width: 0, height: 0 });
  }, [disabled]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDrawing || !drawStart) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const width = x - drawStart.x;
    const height = y - drawStart.y;

    setCurrentDrawRect({
      x: width >= 0 ? drawStart.x : x,
      y: height >= 0 ? drawStart.y : y,
      width: Math.abs(width),
      height: Math.abs(height),
    });
  }, [isDrawing, drawStart]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !currentDrawRect || !drawStart) {
      setIsDrawing(false);
      setDrawStart(null);
      setCurrentDrawRect(null);
      return;
    }

    // Only add if rectangle has meaningful size
    if (currentDrawRect.width > 5 && currentDrawRect.height > 5) {
      handleAddRedaction(currentDrawRect);
    }

    setIsDrawing(false);
    setDrawStart(null);
    setCurrentDrawRect(null);
  }, [isDrawing, currentDrawRect, drawStart, handleAddRedaction]);

  // Attach global mouse events
  useEffect(() => {
    if (isDrawing) {
      window.addEventListener('mousemove', handleMouseMove as (event: MouseEvent) => void);
      window.addEventListener('mouseup', handleMouseUp as (event: MouseEvent) => void);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove as (event: MouseEvent) => void);
        window.removeEventListener('mouseup', handleMouseUp as (event: MouseEvent) => void);
      };
    }
  }, [isDrawing, handleMouseMove, handleMouseUp]);

  const pageRedactions = redactions.filter(r => r.page === currentPage);

  return (
    <div className="card tool-preview">
      <div className="card-header flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Square className="w-5 h-5" />
          Redaction Tool
        </h3>
        <div className="flex items-center gap-2">
          {/* Page Navigation */}
          <div className="flex items-center gap-2 border rounded-lg p-1">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || disabled}
              aria-label="Previous page"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="px-3 text-sm font-mono">
              Page {currentPage} / {pageCount}
            </span>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))}
              disabled={currentPage >= pageCount || disabled}
              aria-label="Next page"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          {/* Undo/Redo */}
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleUndo}
              disabled={historyIndex <= 0 || disabled}
              aria-label="Undo"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1 || disabled}
              aria-label="Redo"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          {/* Clear All */}
          {redactions.length > 0 && (
            <button
              type="button"
              className="btn btn-outline btn-sm text-red-600 hover:bg-red-50 border-red-200"
              onClick={handleClearAll}
              disabled={disabled}
              aria-label="Clear all redactions"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="card-body p-0">
        <div
          ref={containerRef}
          className="redaction-canvas-container"
          onMouseDown={handleMouseDown}
          style={{ cursor: isDrawing ? 'crosshair' : 'default' }}
        >
          {/* PDF Page Image */}
          <img
            src={`${pdfUrl}#page=${currentPage}`}
            alt={`Page ${currentPage}`}
            className="redaction-canvas"
            style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
            onLoad={(e) => {
              const img = e.currentTarget;
              const container = containerRef.current;
              if (container && img.naturalWidth > 0) {
                const containerWidth = container.clientWidth;
                const newScale = containerWidth / img.naturalWidth;
                setScale(newScale);
              }
            }}
          />

          {/* Existing Redactions */}
          {pageRedactions.map((redaction, index) => (
            <div
              key={index}
              className="redaction-rect"
              style={{
                left: `${redaction.x * scale}px`,
                top: `${redaction.y * scale}px`,
                width: `${redaction.width * scale}px`,
                height: `${redaction.height * scale}px`,
              }}
              title={`Redaction ${index + 1} on page ${currentPage}`}
            >
              <button
                type="button"
                className="absolute -top-6 -right-6 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-xs hover:bg-red-700 transition-colors"
                onClick={(e) => { e.stopPropagation(); handleRemoveRedaction(redactions.indexOf(redaction)); }}
                aria-label={`Remove redaction ${index + 1}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {/* Current Drawing Rect */}
          {currentDrawRect && (
            <div
              className="redaction-rect drawing"
              style={{
                left: `${currentDrawRect.x}px`,
                top: `${currentDrawRect.y}px`,
                width: `${currentDrawRect.width}px`,
                height: `${currentDrawRect.height}px`,
              }}
            />
          )}

          {/* Empty state overlay */}
          {pageCount === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center text-muted p-4">
                <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No PDF loaded</p>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
            <span className="flex items-center gap-1">
              <MousePointer className="w-4 h-4" />
              Click and drag to draw redaction area
            </span>
            <span className="flex items-center gap-1">
              <Undo2 className="w-4 h-4" />
              Ctrl+Z to undo
            </span>
            <span className="flex items-center gap-1">
              <Redo2 className="w-4 h-4" />
              Ctrl+Y to redo
            </span>
            <span className="badge badge-warning ml-auto">
              {redactions.length} redaction{redactions.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}