const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export interface BatesStampParams {
  file: File;
  prefix: string;
  startNumber: number;
  fontSize: number;
  position: string;
  color: string;
  fontName: string;
}

export interface RedactionRect {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RedactParams {
  file: File;
  redactions: RedactionRect[];
}

export interface ProcessingResult {
  blob: Blob;
  pageCount: number;
  processingTimeMs: number;
  redactionCount?: number;
}

export interface HealthResponse {
  status: string;
  version: string;
  service: string;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail: string | undefined;
    try {
      const errorData = await response.json();
      detail = errorData.detail || errorData.error;
    } catch {
      detail = response.statusText;
    }
    throw new ApiError(
      detail || `Request failed with status ${response.status}`,
      response.status,
      detail
    );
  }

  // For file downloads, return blob
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/pdf')) {
    return response.blob() as Promise<T>;
  }

  return response.json();
}

export const api = {
  async healthCheck(): Promise<HealthResponse> {
    const response = await fetch(`${API_BASE}/health`);
    return handleResponse<HealthResponse>(response);
  },

  async batesStamp(params: BatesStampParams): Promise<ProcessingResult> {
    const formData = new FormData();
    formData.append('file', params.file);
    formData.append('prefix', params.prefix);
    formData.append('start_number', params.startNumber.toString());
    formData.append('font_size', params.fontSize.toString());
    formData.append('position', params.position);
    formData.append('color', params.color);
    formData.append('font_name', params.fontName);

    const response = await fetch(`${API_BASE}/bates-stamp`, {
      method: 'POST',
      body: formData,
    });

    const blob = await handleResponse<Blob>(response);
    const pageCount = parseInt(response.headers.get('X-Page-Count') || '0', 10);
    const processingTimeMs = parseFloat(response.headers.get('X-Processing-Time-Ms') || '0');

    return { blob, pageCount, processingTimeMs };
  },

  async redactPdf(params: RedactParams): Promise<ProcessingResult> {
    const formData = new FormData();
    formData.append('file', params.file);
    formData.append('redactions', JSON.stringify(params.redactions));

    const response = await fetch(`${API_BASE}/redact`, {
      method: 'POST',
      body: formData,
    });

    const blob = await handleResponse<Blob>(response);
    const pageCount = parseInt(response.headers.get('X-Page-Count') || '0', 10);
    const processingTimeMs = parseFloat(response.headers.get('X-Processing-Time-Ms') || '0');
    const redactionCount = parseInt(response.headers.get('X-Redaction-Count') || '0', 10);

    return { blob, pageCount, processingTimeMs, redactionCount };
  },
};

export { ApiError };