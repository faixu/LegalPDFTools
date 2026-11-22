import { useState, useCallback } from 'react';
import { api, type BatesStampParams, type RedactParams, type ProcessingResult } from '../services/api';

interface UseFileProcessingState {
  isProcessing: boolean;
  progress: number;
  result: ProcessingResult | null;
  error: string | null;
}

export function useBatesStamp() {
  const [state, setState] = useState<UseFileProcessingState>({
    isProcessing: false,
    progress: 0,
    result: null,
    error: null,
  });

  const process = useCallback(async (params: BatesStampParams) => {
    setState({ isProcessing: true, progress: 10, result: null, error: null });

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90),
        }));
      }, 200);

      const result = await api.batesStamp(params);

      clearInterval(progressInterval);
      setState({ isProcessing: false, progress: 100, result, error: null });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Processing failed';
      setState({ isProcessing: false, progress: 0, result: null, error: message });
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ isProcessing: false, progress: 0, result: null, error: null });
  }, []);

  return { ...state, process, reset };
}

export function useRedact() {
  const [state, setState] = useState<UseFileProcessingState>({
    isProcessing: false,
    progress: 0,
    result: null,
    error: null,
  });

  const process = useCallback(async (params: RedactParams) => {
    setState({ isProcessing: true, progress: 10, result: null, error: null });

    try {
      const progressInterval = setInterval(() => {
        setState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90),
        }));
      }, 200);

      const result = await api.redactPdf(params);

      clearInterval(progressInterval);
      setState({ isProcessing: false, progress: 100, result, error: null });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Processing failed';
      setState({ isProcessing: false, progress: 0, result: null, error: message });
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ isProcessing: false, progress: 0, result: null, error: null });
  }, []);

  return { ...state, process, reset };
}

export function useHealthCheck() {
  const [health, setHealth] = useState<{ status: string; version: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.healthCheck();
      setHealth({ status: result.status, version: result.version });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Health check failed');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return { health, loading, error, check };
}