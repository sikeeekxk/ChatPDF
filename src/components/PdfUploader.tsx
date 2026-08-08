import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, FileText, AlertCircle, X, CheckCircle2 } from 'lucide-react';
import { extractPdfText, PdfExtractionError, type ExtractionResult } from '../services/pdfService';
import { ProgressBar } from './ui/ProgressBar';

interface PdfUploaderProps {
  onExtractionComplete: (result: ExtractionResult) => void;
}

export function PdfUploader({ onExtractionComplete }: PdfUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<'idle' | 'extracting' | 'error' | 'success'>('idle');
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = async (file: File) => {
    if (status === 'extracting') return;

    if (file.type !== 'application/pdf') {
      setStatus('error');
      setErrorMessage('Please upload a valid PDF file.');
      return;
    }

    setStatus('extracting');
    setProgress(0);
    setProgressLabel('Starting extraction...');
    setErrorMessage('');

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const result = await extractPdfText(
        file,
        (p, label) => {
          if (abortControllerRef.current === abortController) {
            setProgress(p);
            setProgressLabel(label);
          }
        },
        abortController.signal
      );

      if (abortControllerRef.current !== abortController) return;

      setStatus('success');
      setProgress(100);
      setProgressLabel('Extraction complete!');

      setTimeout(() => {
        if (abortControllerRef.current === abortController) {
          onExtractionComplete(result);
        }
      }, 500);
    } catch (error: any) {
      if (abortControllerRef.current !== abortController) return;

      if (error.name === 'ExtractionCancelledError') {
        setStatus('idle');
      } else {
        setStatus('error');
        setErrorMessage(error instanceof PdfExtractionError ? error.message : 'An unexpected error occurred.');
      }
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (status === 'extracting') return;
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (status === 'extracting') return;
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const cancelExtraction = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setStatus('idle');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`relative rounded-xl border-2 border-dashed p-12 text-center transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : status === 'error'
            ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/10'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-blue-500 dark:hover:bg-gray-800/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="application/pdf"
          className="hidden"
        />

        {status === 'idle' && (
          <div className="flex flex-col items-center">
            <div className="mb-4 rounded-full bg-blue-100 p-4 dark:bg-blue-900">
              <UploadCloud className="h-8 w-8 text-blue-600 dark:text-blue-300" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Upload your PDF
            </h3>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              Drag and drop your file here, or click to browse
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
            >
              Select File
            </button>
            <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
              Max 20MB, up to 150 pages. Text-based PDFs only.
            </p>
          </div>
        )}

        {status === 'extracting' && (
          <div className="flex flex-col items-center py-6">
            <div className="mb-6 animate-pulse">
              <FileText className="h-12 w-12 text-blue-500" />
            </div>
            <ProgressBar progress={progress} label={progressLabel} />
            <button
              onClick={cancelExtraction}
              className="mt-6 flex items-center text-sm font-medium text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
            >
              <X className="mr-1 h-4 w-4" /> Cancel Extraction
            </button>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center py-6">
            <CheckCircle2 className="mb-4 h-12 w-12 text-green-500" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {progressLabel}
            </h3>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center py-4">
            <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Upload Failed
            </h3>
            <p className="mb-6 text-sm text-red-600 dark:text-red-400">
              {errorMessage}
            </p>
            <button
              onClick={() => setStatus('idle')}
              className="rounded-lg bg-gray-200 px-6 py-2.5 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
