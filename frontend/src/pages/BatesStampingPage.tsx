import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Download, RotateCcw, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { FileDropzone } from '../components/FileDropzone';
import { BatesConfigPanel, type BatesConfig } from '../components/BatesConfigPanel';
import { PreviewViewer } from '../components/PreviewViewer';
import { ProgressIndicator } from '../components/ProgressIndicator';
import { useBatesStamp } from '../hooks/useFileProcessing';

export function BatesStampingPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [config, setConfig] = useState<BatesConfig>({
    prefix: '',
    startNumber: 1,
    fontSize: 12,
    position: 'bottom_center',
    color: '#000000',
    fontName: 'helv',
  });

  const { isProcessing, progress, result, error, process, reset } = useBatesStamp();

  const handleFileSelect = useCallback((newFile: File) => {
    setFile(newFile);
    setPreviewUrl(URL.createObjectURL(newFile));
    setResultBlob(null);
    reset();
  }, [reset]);

  const handleFileClear = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setResultBlob(null);
    reset();
  }, [previewUrl, reset]);

  const handleProcess = async () => {
    if (!file) return;

    try {
      const processingResult = await process({
        file,
        prefix: config.prefix,
        startNumber: config.startNumber,
        fontSize: config.fontSize,
        position: config.position,
        color: config.color,
        fontName: config.fontName,
      });

      setResultBlob(processingResult.blob);
      const resultUrl = URL.createObjectURL(processingResult.blob);
      setPreviewUrl(resultUrl);
    } catch (err) {
      // Error handled by hook
      console.error('Bates stamping failed:', err);
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bates_stamped_${file?.name || 'document'}.pdf`;
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
    setConfig({
      prefix: '',
      startNumber: 1,
      fontSize: 12,
      position: 'bottom_center',
      color: '#000000',
      fontName: 'helv',
    });
    reset();
  };

  const canProcess = file && !isProcessing && !resultBlob;

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
            <Link to="/bates" className="nav-link active" aria-current="page">Bates Stamping</Link>
            <Link to="/redact" className="nav-link">Redaction</Link>
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
            <h1 className="page-title">Bates Stamping</h1>
            <p className="page-description">
              Add sequential page numbers to your legal documents with customizable formatting options.
            </p>
          </header>

          {/* Progress Indicator */}
          <ProgressIndicator
            progress={progress}
            status={isProcessing ? 'processing' : resultBlob ? 'complete' : error ? 'error' : 'idle'}
            message={isProcessing ? 'Applying Bates numbers to all pages...' : error || undefined}
            details={result ? { pageCount: result.pageCount, processingTimeMs: result.processingTimeMs, fileSize: result.blob.size } : undefined}
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

              {/* Configuration Panel */}
              <BatesConfigPanel
                initialConfig={config}
                onChange={setConfig}
                disabled={isProcessing || !!resultBlob || !file}
              />

              {/* Action Buttons */}
              <div className="card">
                <div className="card-body">
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      className="btn btn-primary btn-lg flex-1 min-w-[200px]"
                      onClick={handleProcess}
                      disabled={!canProcess}
                    >
                      {isProcessing ? (
                        <>
                          <span className="spinner" />
                          Processing...
                        </>
                      ) : resultBlob ? (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Done - Download Below
                        </>
                      ) : (
                        <>
                          <FileText className="w-5 h-5" />
                          Apply Bates Stamp
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
                      Upload a PDF to enable Bates stamping
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel - Preview */}
            <div className="tool-panel">
              <PreviewViewer
                fileUrl={previewUrl || undefined}
                fileName={resultBlob ? `bates_stamped_${file?.name}` : file?.name}
                title={resultBlob ? 'Processed Document' : 'Original Document'}
                onDownload={handleDownload}
                onRemove={handleFileClear}
                processing={isProcessing}
                error={error}
              />

              {/* Info Box */}
              <div className="card mt-4">
                <div className="card-body">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-600 space-y-2">
                      <p>
                        <strong>Bates Stamping</strong> adds sequential page numbers to each page of your PDF.
                        The format is: <code className="bg-gray-100 px-1 rounded font-mono text-xs">{config.prefix}{String(config.startNumber).padStart(6, '0')}</code>,
                        <code className="bg-gray-100 px-1 rounded font-mono text-xs">{config.prefix}{String(config.startNumber + 1).padStart(6, '0')}</code>, etc.
                      </p>
                      <p>
                        <strong>Position:</strong> Numbers are placed 1 inch from the selected edge.
                        <strong>Font:</strong> Standard PDF fonts (Helvetica, Times, Courier) are embedded automatically.
                      </p>
                      <p>
                        <strong>Security:</strong> Files are processed in RAM only—never written to disk.
                        Maximum file size: 50MB.
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