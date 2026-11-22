import { Loader2, CheckCircle, AlertCircle, Clock, FileText, Timer } from 'lucide-react';

interface ProgressIndicatorProps {
  progress: number; // 0-100
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  message?: string;
  details?: {
    pageCount?: number;
    processingTimeMs?: number;
    fileSize?: number;
    redactionCount?: number;
  };
  onReset?: () => void;
}

export function ProgressIndicator({ progress, status, message, details, onReset }: ProgressIndicatorProps) {
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'uploading':
        return { icon: Loader2, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Uploading...' };
      case 'processing':
        return { icon: Loader2, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Processing...' };
      case 'complete':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Complete' };
      case 'error':
        return { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Error' };
      default:
        return { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', label: 'Ready' };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  const isAnimating = status === 'uploading' || status === 'processing';

  if (status === 'idle' && !message) {
    return null;
  }

  return (
    <div className={`card ${config.bg} border-${config.border.replace('border-', '')}`}>
      <div className="card-body">
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 ${config.color} ${isAnimating ? 'animate-spin' : ''}`}>
            <Icon className="w-6 h-6" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={`font-medium ${config.color}`}>{config.label}</span>
              {status === 'complete' && details && (
                <>
                  {details.pageCount && (
                    <span className="badge badge-success flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {details.pageCount} page{details.pageCount !== 1 ? 's' : ''}
                    </span>
                  )}
                  {details.processingTimeMs && (
                    <span className="badge badge-info flex items-center gap-1">
                      <Timer className="w-3 h-3" />
                      {formatTime(details.processingTimeMs)}
                    </span>
                  )}
                </>
              )}
            </div>

            {message && (
              <p className="text-sm text-gray-600 mb-3">{message}</p>
            )}

            {/* Progress Bar */}
            {(status === 'uploading' || status === 'processing') && (
              <div className="progress-bar mb-3" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Processing progress">
                <div
                  className="progress-fill"
                  style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
                />
              </div>
            )}

            {/* Details */}
            {status === 'complete' && details && (
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {details.fileSize && (
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {formatSize(details.fileSize)}
                  </span>
                )}
                {details.pageCount && (
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {details.pageCount} page{details.pageCount !== 1 ? 's' : ''}
                  </span>
                )}
                {details.processingTimeMs && (
                  <span className="flex items-center gap-1">
                    <Timer className="w-4 h-4" />
                    {formatTime(details.processingTimeMs)}
                  </span>
                )}
              </div>
            )}

            {status === 'error' && onReset && (
              <button
                type="button"
                className="btn btn-outline btn-sm mt-3"
                onClick={onReset}
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}