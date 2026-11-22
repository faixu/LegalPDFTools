import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Scale,
  Shield,
  Lock,
  Cpu,
  Sparkles,
  ChevronDown,
  Send,
  FileText,
  Eye,
  Search,
  CreditCard,
  HeartPulse,
  ExternalLink,
  Settings,
  Check,
} from 'lucide-react';
import { FileDropzone } from '../components/FileDropzone';
import { PreviewViewer } from '../components/PreviewViewer';
import { ProgressIndicator } from '../components/ProgressIndicator';
import { useBatesStamp } from '../hooks/useFileProcessing';

const workflows = [
  {
    path: '/tools/court-exhibits',
    icon: FileText,
    title: 'Court Exhibits',
    description: 'EXHIBIT-A- prefix, top-right, Times-Roman 11pt',
  },
  {
    path: '/tools/discovery-productions',
    icon: Send,
    title: 'Discovery Productions',
    description: 'PROD- prefix, 7 digits, high-volume ready',
  },
  {
    path: '/tools/redact-ssn-pii',
    icon: Search,
    title: 'Redact SSN & PII',
    description: 'Auto-detect SSN, Aadhaar, emails',
  },
  {
    path: '/tools/confidential-stamps',
    icon: Eye,
    title: 'Confidential Stamps',
    description: 'CONFIDENTIAL- bottom-center, Courier 14pt',
  },
  {
    path: '/tools/financial-redaction',
    icon: CreditCard,
    title: 'Financial Redaction',
    description: 'Account, routing, SWIFT, IBAN keywords',
  },
  {
    path: '/tools/hipaa-medical-records',
    icon: HeartPulse,
    title: 'HIPAA Medical Records',
    description: 'PHI Safe Harbor 18 identifiers',
  },
];

const dropdownTools = [
  { path: '/bates', label: 'Bates Stamping', desc: 'Sequential page numbering' },
  { path: '/redact', label: 'Permanent Redaction', desc: 'Irreversible content removal' },
  { path: '/tools/court-exhibits', label: 'Court Exhibits', desc: 'EXHIBIT-A- prefix, top-right' },
  { path: '/tools/discovery-productions', label: 'Discovery Productions', desc: 'PROD- prefix, 7 digits' },
  { path: '/tools/redact-ssn-pii', label: 'Redact SSN & PII', desc: 'Auto-detect SSN, emails' },
  { path: '/tools/confidential-stamps', label: 'Confidential Stamps', desc: 'CONFIDENTIAL- bottom-center' },
];

export function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [config, setConfig] = useState({
    prefix: 'CASE-',
    suffix: '',
    startNumber: 1,
    zeroPadding: 4,
    font: 'tiro',
    fontSize: 11,
    color: '#000000',
    position: 'bottom_right',
    enableBates: true,
    scrubMetadata: true,
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const [useSample, setUseSample] = useState(false);

  const { isProcessing, progress, result, error, process, reset } = useBatesStamp();

  const loadSample = () => {
    // Create a simple sample PDF
    const sampleContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R 4 0 R 5 0 R] /Count 3 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 6 0 R /Resources << /Font << /F1 7 0 R >> >> >>
endobj
4 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 8 0 R /Resources << /Font << /F1 7 0 R >> >> >>
endobj
5 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 10 0 R /Resources << /Font << /F1 7 0 R >> >> >>
endobj
6 0 obj
<< /Length 85 >>
stream
BT /F1 12 Tf 72 720 Td (LEGAL EXHIBIT A - PAGE 1) Tj ET
BT /F1 10 Tf 72 680 Td (This is a sample legal document for demonstration.) Tj ET
BT /F1 10 Tf 72 650 Td (CONFIDENTIAL - ATTORNEY WORK PRODUCT) Tj ET
endstream
endobj
7 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
8 0 obj
<< /Length 85 >>
stream
BT /F1 12 Tf 72 720 Td (LEGAL EXHIBIT A - PAGE 2) Tj ET
BT /F1 10 Tf 72 680 Td (CONTINUATION OF EXHIBIT A) Tj ET
BT /F1 10 Tf 72 650 Td (SSN: 123-45-6789 | Email: john.doe@example.com) Tj ET
endstream
endobj
10 0 obj
<< /Length 85 >>
stream
BT /F1 12 Tf 72 720 Td (LEGAL EXHIBIT A - PAGE 3) Tj ET
BT /F1 10 Tf 72 680 Td (END OF EXHIBIT A) Tj ET
BT /F1 10 Tf 72 650 Td (Account: 4567-8901-2345-6789) Tj ET
endstream
endobj
xref
0 11
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000215 00000 n
0000000315 00000 n
0000000413 00000 n
0000000531 00000 n
0000000635 00000 n
0000000739 00000 n
0000000843 00000 n
trailer
<< /Size 11 /Root 1 0 R >>
startxref
947
%%EOF`;

    const blob = new Blob([sampleContent], { type: 'application/pdf' });
    const sampleFile = new File([blob], 'sample-legal-exhibit.pdf', { type: 'application/pdf' });
    handleFileSelect(sampleFile);
    setUseSample(true);
  };

  const handleFileSelect = (newFile: File) => {
    setFile(newFile);
    setPreviewUrl(URL.createObjectURL(newFile));
    setResultBlob(null);
    setUseSample(false);
    reset();
  };

  const handleFileClear = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setResultBlob(null);
    setUseSample(false);
    reset();
  };

  const handleProcess = async () => {
    if (!file) return;

    try {
      const processingResult = await process({
        file,
        prefix: config.enableBates ? config.prefix : '',
        startNumber: config.startNumber,
        fontSize: config.fontSize,
        position: config.position,
        color: config.color,
        fontName: config.font,
      });

      setResultBlob(processingResult.blob);
      const resultUrl = URL.createObjectURL(processingResult.blob);
      setPreviewUrl(resultUrl);
    } catch (err) {
      console.error('Processing failed:', err);
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `processed_${file?.name || 'document'}.pdf`;
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
    setUseSample(false);
    reset();
  };

  const canProcess = file && !isProcessing && !resultBlob;

  const previewTitle = resultBlob ? 'Processed Document' : useSample ? 'Sample Legal Exhibit (3 pages)' : 'Original Document';

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo */}
            <Link to="/" className="flex items-center gap-3 no-underline" aria-label="LegalPDFTools Home">
              <div className="bg-blue-700 text-white p-2 rounded-lg">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <div className="text-slate-900 font-bold text-lg">LegalPDF</div>
                <div className="text-blue-700 font-bold text-lg">Tools</div>
              </div>
            </Link>

            {/* Center: Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {/* Tools Dropdown */}
              <div className="dropdown relative">
                <button
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg transition-colors"
                  onClick={() => setShowDropdown(!showDropdown)}
                  aria-expanded={showDropdown}
                  aria-haspopup="true"
                >
                  <Settings className="w-4 h-4" />
                  Tools
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showDropdown && (
                  <div className="dropdown-menu">
                    {dropdownTools.map((tool) => (
                      <Link
                        key={tool.path}
                        to={tool.path}
                        className="dropdown-item"
                        onClick={() => setShowDropdown(false)}
                      >
                        <span className="font-medium">{tool.label}</span>
                        <span className="text-slate-500 text-xs ml-auto">{tool.desc}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link to="/guides" className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
                Guides
              </Link>
            </nav>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <Link to="/privacy" className="hidden md:block text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
                Privacy
              </Link>
              <Link to="/terms" className="hidden md:block text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
                Terms
              </Link>
              <Link to="/about" className="hidden md:block text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
                About
              </Link>
              <Link
                to="/contact"
                className="btn btn-primary btn-sm hidden md:inline-flex"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Trust Badge Strip */}
      <div className="trust-strip">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium">
            <div className="trust-badge bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full px-3.5 py-1 inline-flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              Zero Server Retention
            </div>
            <div className="text-blue-700 inline-flex items-center gap-1.5">
              <Lock className="w-4 h-4" />
              Files Processed in Browser RAM
            </div>
            <div className="text-blue-700 inline-flex items-center gap-1.5">
              <Cpu className="w-4 h-4" />
              No Account Required
            </div>
            <div className="text-blue-700 inline-flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Free Forever
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1">
        {/* Editorial Hero + Two-Column Workspace */}
        <section className="pt-10 pb-8 text-center max-w-3xl mx-auto px-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Bates Stamp & Permanently Redact PDFs
          </h1>
          <p className="mt-3 text-base sm:text-lg text-slate-600">
            Professional legal document processing in your browser. Zero server retention. No signup. Free forever.
          </p>
        </section>

        {/* Two-Column Processing Workspace */}
        <section className="max-w-6xl mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column - Upload & Canvas */}
            <div className="lg:col-span-7">
              <div className="card">
                <FileDropzone
                  onFileSelect={handleFileSelect}
                  onClear={handleFileClear}
                  currentFile={file}
                  disabled={isProcessing || !!resultBlob}
                />
              </div>

              {/* Sample file link */}
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={loadSample}
                  className="dropzone-link"
                  disabled={isProcessing || !!file || !!resultBlob}
                >
                  <span className="inline-flex items-center gap-1.5">
                    ✨ Try with a sample 3-page legal exhibit
                  </span>
                </button>
              </div>

              {/* Progress Indicator */}
              <ProgressIndicator
                progress={progress}
                status={isProcessing ? 'processing' : resultBlob ? 'complete' : error ? 'error' : 'idle'}
                message={isProcessing ? 'Applying Bates numbers...' : error || undefined}
                details={result ? { pageCount: result.pageCount, processingTimeMs: result.processingTimeMs, fileSize: result.blob.size } : undefined}
                onReset={handleReset}
              />

              {/* PDF Preview */}
              <PreviewViewer
                fileUrl={previewUrl || undefined}
                fileName={resultBlob ? `processed_${file?.name}` : useSample ? 'Sample Legal Exhibit (3 pages)' : file?.name}
                title={previewTitle}
                onDownload={handleDownload}
                onRemove={handleFileClear}
                processing={isProcessing}
                error={error}
              />
            </div>

            {/* Right Column - Processing Options */}
            <div className="lg:col-span-5">
              <div className="card sticky top-24">
                <div className="flex items-center gap-2 mb-6">
                  <div className="icon-badge icon-badge-blue p-2">
                    <Settings className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Processing Options</h3>
                </div>

                <div className="space-y-5">
                  {/* Enable Bates Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="form-label">Enable Bates Numbering</label>
                      <p className="text-xs text-slate-500 mt-0.5">Add sequential page numbers to each page</p>
                    </div>
                    <input
                      type="checkbox"
                      className="checkbox-input"
                      checked={config.enableBates}
                      onChange={(e) => setConfig({ ...config, enableBates: e.target.checked })}
                    />
                  </div>

                  {config.enableBates && (
                    <>
                      {/* Prefix & Suffix */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="form-label">Prefix</label>
                          <input
                            type="text"
                            className="form-input font-mono"
                            placeholder="CASE-"
                            value={config.prefix}
                            onChange={(e) => setConfig({ ...config, prefix: e.target.value })}
                            disabled={!config.enableBates}
                          />
                        </div>
                        <div>
                          <label className="form-label">Suffix (optional)</label>
                          <input
                            type="text"
                            className="form-input font-mono"
                            placeholder=""
                            value={config.suffix}
                            onChange={(e) => setConfig({ ...config, suffix: e.target.value })}
                            disabled={!config.enableBates}
                          />
                        </div>
                      </div>

                      {/* Start Number & Zero Padding */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="form-label">Start Number</label>
                          <input
                            type="number"
                            className="form-input"
                            min="1"
                            max="999999"
                            value={config.startNumber}
                            onChange={(e) => setConfig({ ...config, startNumber: parseInt(e.target.value) || 1 })}
                            disabled={!config.enableBates}
                          />
                        </div>
                        <div>
                          <label className="form-label">Zero Padding</label>
                          <select
                            className="form-select"
                            value={config.zeroPadding}
                            onChange={(e) => setConfig({ ...config, zeroPadding: parseInt(e.target.value) })}
                            disabled={!config.enableBates}
                          >
                            <option value={4}>4 digits (0001)</option>
                            <option value={6}>6 digits (000001)</option>
                            <option value={7}>7 digits (0000001)</option>
                          </select>
                        </div>
                      </div>

                      {/* Font & Font Size */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="form-label">Font</label>
                          <select
                            className="form-select"
                            value={config.font}
                            onChange={(e) => setConfig({ ...config, font: e.target.value })}
                            disabled={!config.enableBates}
                          >
                            <option value="tiro">Times Roman</option>
                            <option value="helv">Helvetica</option>
                            <option value="cour">Courier</option>
                          </select>
                        </div>
                        <div>
                          <label className="form-label">Font Size</label>
                          <select
                            className="form-select"
                            value={config.fontSize}
                            onChange={(e) => setConfig({ ...config, fontSize: parseInt(e.target.value) })}
                            disabled={!config.enableBates}
                          >
                            <option value={9}>9pt</option>
                            <option value={10}>10pt</option>
                            <option value={11}>11pt</option>
                            <option value={12}>12pt</option>
                            <option value={14}>14pt</option>
                          </select>
                        </div>
                      </div>

                      {/* Color & Position */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="form-label">Color</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer"
                              value={config.color}
                              onChange={(e) => setConfig({ ...config, color: e.target.value })}
                              disabled={!config.enableBates}
                            />
                            <input
                              type="text"
                              className="form-input font-mono text-sm flex-1"
                              value={config.color}
                              onChange={(e) => {
                                if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                                  setConfig({ ...config, color: e.target.value });
                                }
                              }}
                              disabled={!config.enableBates}
                              placeholder="#000000"
                              pattern="#[0-9A-Fa-f]{6}"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="form-label">Position</label>
                          <select
                            className="form-select"
                            value={config.position}
                            onChange={(e) => setConfig({ ...config, position: e.target.value })}
                            disabled={!config.enableBates}
                          >
                            <option value="bottom_right">Bottom-Right</option>
                            <option value="bottom_center">Bottom-Center</option>
                            <option value="bottom_left">Bottom-Left</option>
                            <option value="top_right">Top-Right</option>
                            <option value="top_center">Top-Center</option>
                            <option value="top_left">Top-Left</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Live Preview Box */}
                  <div className="live-preview">
                    <div className="live-preview-title">Live Preview</div>
                    <div className="live-preview-value">
                      {config.enableBates
                        ? `${config.prefix}${String(config.startNumber).padStart(config.zeroPadding, '0')}${config.suffix}`
                        : 'Bates numbering disabled'}
                    </div>
                  </div>

                  {/* Scrub Metadata */}
                  <div className="checkbox-wrapper">
                    <input
                      type="checkbox"
                      className="checkbox-input"
                      checked={config.scrubMetadata}
                      onChange={(e) => setConfig({ ...config, scrubMetadata: e.target.checked })}
                    />
                    <label className="checkbox-label">
                      <strong>Scrub Document Metadata & Annotations</strong>
                      <span className="text-slate-500"> — Removes author, creation date, comments, and hidden layers.</span>
                    </label>
                  </div>

                  {/* Primary Action Button */}
                  <button
                    type="button"
                    className="btn btn-primary w-full py-3"
                    onClick={handleProcess}
                    disabled={!canProcess}
                  >
                    {isProcessing ? (
                      <>
                        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : resultBlob ? (
                      <>
                        <Check className="w-5 h-5" />
                        Done — Download Below
                      </>
                    ) : (
                      'Process Document'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Common Legal Workflows */}
        <section className="mt-20 pt-16 border-t border-slate-200 bg-slate-50/50 pb-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-extrabold text-slate-900">Common Legal Workflows</h2>
              <p className="text-slate-600 mt-2">Pre-configured tools for your specific practice area.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workflows.map((workflow) => (
                <Link
                  key={workflow.path}
                  to={workflow.path}
                  className="card flex flex-col justify-between text-left group hover:border-blue-300 hover:shadow-md transition-all rounded-2xl p-6 no-underline"
                >
                  <div>
                    <div className="icon-badge icon-badge-blue w-12 h-12 mb-4">
                      <workflow.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{workflow.title}</h3>
                    <p className="text-sm text-slate-600">{workflow.description}</p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 no-underline">
                      Open Tool
                      <ExternalLink className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-sm text-slate-500 text-center md:text-left">
              © 2024 LegalPDFTools. Built for legal professionals.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6">
              <Link to="/bates" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">Bates Stamping</Link>
              <Link to="/redact" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">Redaction</Link>
              <Link to="/privacy" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">Privacy</Link>
              <Link to="/terms" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">Terms</Link>
              <Link to="/about" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">About</Link>
              <Link to="/contact" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}