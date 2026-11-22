import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Download, RotateCcw, AlertCircle, CheckCircle, Info, Shield } from 'lucide-react';
import { FileDropzone } from '../components/FileDropzone';
import { RedactionTool } from '../components/RedactionTool';
import { PreviewViewer } from '../components/PreviewViewer';
import { ProgressIndicator } from '../components/ProgressIndicator';
import { useRedact } from '../hooks/useFileProcessing';

export function RedactionPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [redactions, setRedactions] = useState<{ page: number; x: number; y: number; width: number; height: number }[]>([]);
  const [showRedactions] = useState(true);

  const { isProcessing, progress, result, error, process, reset } = useRedact();

  const handleFileSelect = useCallback((newFile: File) => {
    setFile(newFile);
    setPreviewUrl(URL.createObjectURL(newFile));
    setResultBlob(null);
    setRedactions([]);
    setPageCount(0);
    reset();
  }, [reset]);

  const handleFileClear = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setResultBlob(null);
    setRedactions([]);
    setPageCount(0);
    reset();
  }, [previewUrl, reset]);

  const handleProcess = async () => {
    if (!file || redactions.length === 0) return;

    try {
      const processingResult = await process({
        file,
        redactions,
      });

      setResultBlob(processingResult.blob);
      const resultUrl = URL.createObjectURL(processingResult.blob);
      setPreviewUrl(resultUrl);
    } catch (err) {
      console.error('Redaction failed:', err);
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `redacted_${file?.name || 'document'}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if (previewUrl && file) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setResultBlob(null);
    setRedactions([]);
    setPageCount(0);
    reset();
  };

  const canProcess = file && redactions.length > 0 && !isProcessing && !resultBlob;

  // Update page count when file changes
  useEffect(() => {
    if (file && previewUrl) {
      // We'll get page count from the PDF preview component
      // For now, we'll use a placeholder - the RedactionTool will show actual pages
    }
  }, [file, previewUrl]);

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="navbar" role="navigation" aria-label="Main navigation">
        <div className="container navbar-inner">
          <Link to="/" className="navbar-brand" aria-label="LegalPDFTools Home">
            <svg className="navbar-brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            LegalPDFTools
          </Link>
          <div className="navbar-nav">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/bates" className="nav-link">Bates Stamping</Link>
            <Link to="/redact" className="nav-link active" aria-current="page">Redaction</Link>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <div className="container">
          {/* Page Header */}
          <header className="page-header">
            <Link to="/" className="btn btn-outline btn-sm mb-4" style={{ alignSelf: 'flex-start' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Back to Home
            </Link>
            <h1 className="page-title">Permanent PDF Redaction</h1>
            <p className="page-description">
              Irreversibly remove sensitive content from PDF documents. Content is permanently deleted, not just visually hidden.
            </p>
          </header>

          {/* Warning Banner */}
          <div className="alert alert-warning mb-6" role="alert">
            <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Permanent Redaction</p>
              <p className="text-sm mt-1">
                This tool <strong>permanently removes</strong> content from the PDF. The redacted content cannot be recovered.
                Always keep a backup of your original document.
              </p>
            </div>
          </div>

          {/* Progress Indicator */}
          <ProgressIndicator
            progress={progress}
            status={isProcessing ? 'processing' : resultBlob ? 'complete' : error ? 'error' : 'idle'}
            message={isProcessing ? 'Applying permanent redactions...' : error || undefined}
            details={result ? { pageCount: result.pageCount, processingTimeMs: result.processingTimeMs, fileSize: result.blob.size, redactionCount: result.redactionCount } : undefined}
            onReset={handleReset}
          />

          {/* Error Alert */}
          {error && !isProcessing && (
            <div className="alert alert-error mb-6" role="alert">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Processing failed</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          <div className="tool-layout">
            {/* Left Panel - Configuration */}
            <div className="tool-panel">
              {/* File Upload */}
              <div className="card">
                <div className="card-header">
                  <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <FileText className="w-5 h-5" />
                    PDF Document
                  </h3>
                </div>
                <div className="card-body">
                  <FileDropzone
                    onFileSelect={handleFileSelect}
                    onClear={handleFileClear}
                    currentFile={file}
                    disabled={isProcessing || !!resultBlob}
                  />
                </div>
              </div>

              {/* Redaction Stats */}
              {file && !resultBlob && (
                <div className="card">
                  <div className="card-body">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted">Redactions drawn</p>
                        <p className="text-2xl font-bold text-gray-900">{redactions.length}</p>
                      </div>
                      {redactions.length > 0 && (
                        <button
                          type="button"
                          className="btn btn-outline btn-sm text-red-600 hover:bg-red-50 border-red-200"
                          onClick={() => setRedactions([])}
                          disabled={isProcessing}
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                    {redactions.length > 0 && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          <strong>Pages with redactions:</strong>{' '}
                          {[...new Set(redactions.map(r => r.page))].sort((a, b) => a - b).join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="card">
                <div className="card-body">
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      className="btn btn-danger btn-lg flex-1 min-w-[200px]"
                      onClick={handleProcess}
                      disabled={!canProcess}
                    >
                      {isProcessing ? (
                        <>
                          <span className="spinner" />
                          Redacting...
                        </>
                      ) : resultBlob ? (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Done - Download Below
                        </>
                      ) : (
                        <>
                          <Shield className="w-5 h-5" />
                          Apply Redactions
                        </>
                      )}
                    </button>

                    {resultBlob && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-lg flex-1 min-w-[200px]"
                        onClick={handleDownload}
                      >
                        <Download className="w-5 h-5" />
                        Download PDF
                      </button>
                    )}

                    {(resultBlob || file) && (
                      <button
                        type="button"
                        className="btn btn-outline btn-lg"
                        onClick={handleReset}
                        disabled={isProcessing}
                      >
                        <RotateCcw className="w-5 h-5" />
                        Start Over
                      </button>
                    )}
                  </div>

                  {!file && (
                    <p className="text-center text-sm text-muted mt-4">
                      Upload a PDF to enable redaction
                    </p>
                  )}

                  {file && redactions.length === 0 && !resultBlob && (
                    <p className="text-center text-sm text-muted mt-4">
                      Draw redaction areas on the preview to enable processing
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel - Preview & Redaction Tool */}
            <div className="tool-panel">
              {(!resultBlob || showRedactions) && file && !isProcessing && (
                <RedactionTool
                  pdfUrl={previewUrl!}
                  pageCount={pageCount || 1} // Will be updated by the component
                  onRedactionsChange={setRedactions}
                  initialRedactions={redactions}
                  disabled={isProcessing || !!resultBlob}
                />
              )}

              {resultBlob && (
                <PreviewViewer
                  fileUrl={previewUrl || undefined}
                  fileName={`redacted_${file?.name}`}
                  title="Redacted Document"
                  onDownload={handleDownload}
                  onRemove={handleFileClear}
                  processing={isProcessing}
                  error={error}
                />
              )}

              {!file && !resultBlob && !isProcessing && (
                <PreviewViewer
                  fileUrl={undefined}
                  processing={false}
                />
              )}

              {isProcessing && !resultBlob && (
                <PreviewViewer
                  fileUrl={undefined}
                  processing={true}
                />
              )}

              {/* Info Box */}
              <div className="card mt-4">
                <div className="card-body">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-600 space-y-2">
                      <p>
                        <strong>Permanent Redaction</strong> uses PyMuPDF's <code className="bg-gray-100 px-1 rounded font-mono text-xs">apply_redactions()</code>
                        to irreversibly remove content. This deletes text, images, and vector graphics in the selected areas.
                      </p>
                      <p>
                        <strong>How to use:</strong> Click and drag on the preview to draw red rectangles over content you want to remove.
                        Use the page navigator to redact multiple pages. Undo/Redo supported (Ctrl+Z / Ctrl+Y).
                      </p>
                      <p>
                        <strong>Security:</strong> Files processed in RAM only—never written to disk. Maximum file size: 50MB.
                        <strong>Warning:</strong> Redacted content cannot be recovered. Keep originals backed up.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-inner">
          <p className="footer-text">&copy; 2024 LegalPDFTools. Built for legal professionals.</p>
          <div className="footer-links">
            <Link to="/bates" className="footer-link">Bates Stamping</Link>
            <Link to="/redact" className="footer-link">Redaction</Link>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="footer-link">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}