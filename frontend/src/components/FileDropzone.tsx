import { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Upload, FileText, AlertCircle, XCircle } from 'lucide-react';

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  acceptedFiles?: Record<string, string[]>;
  maxSize?: number;
  disabled?: boolean;
  currentFile?: File | null;
  onClear?: () => void;
}

const DEFAULT_ACCEPTED = {
  'application/pdf': ['.pdf'],
};

const DEFAULT_MAX_SIZE = 50 * 1024 * 1024; // 50MB

export function FileDropzone({
  onFileSelect,
  acceptedFiles = DEFAULT_ACCEPTED,
  maxSize = DEFAULT_MAX_SIZE,
  disabled = false,
  currentFile,
  onClear,
}: FileDropzoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return `File too large. Maximum size: ${formatSize(maxSize)}`;
    }
    if (file.type !== 'application/pdf') {
      return 'Only PDF files are allowed';
    }
    return null;
  };

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    setDragActive(false);
    setError(null);

    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const firstError = rejectedFiles[0];
      setError(firstError.errors[0]?.message || 'File rejected');
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      onFileSelect(file);
    }
  }, [onFileSelect, maxSize]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: acceptedFiles,
    maxSize,
    disabled,
    noClick: disabled,
    noKeyboard: disabled,
  });

  // If there's already a file selected, show it
  if (currentFile) {
    const validationError = validateFile(currentFile);
    return (
      <div className="dropzone" {...getRootProps()}>
        <input {...getInputProps()} />
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <FileText className="w-10 h-10 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate">{currentFile.name}</p>
              <p className="text-sm text-muted">{formatSize(currentFile.size)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {validationError ? (
              <>
                <span className="badge badge-error">{validationError}</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onClear?.(); }}
                  className="btn btn-outline btn-sm"
                  aria-label="Remove file"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <span className="badge badge-success">Ready</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onClear?.(); }}
                  className="btn btn-outline btn-sm"
                  aria-label="Remove file"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`dropzone ${dragActive ? 'active' : ''} ${isDragReject ? 'border-red-500 bg-red-50' : ''}`}
    >
      <input {...getInputProps()} />
      <Upload className="dropzone-icon" aria-hidden="true" />
      <p className="dropzone-text">
        <strong>Drag & drop</strong> a PDF file here, or click to browse
      </p>
      <p className="dropzone-hint">
        Maximum file size: {formatSize(maxSize)} • PDF files only
      </p>
      {error && (
        <div className="mt-3 flex items-center gap-2 text-red-600" role="alert">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      {isDragActive && !dragActive && (
        <div className="mt-3 text-blue-600 text-sm" role="status">
          Drop file to upload
        </div>
      )}
    </div>
  );
}