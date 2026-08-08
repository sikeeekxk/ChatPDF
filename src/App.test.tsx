import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import * as pdfService from './services/pdfService';

vi.mock('./services/pdfService', () => ({
  extractPdfText: vi.fn(),
  PdfExtractionError: class extends Error {
    constructor(m: string) { super(m); this.name = 'PdfExtractionError'; }
  },
  ExtractionCancelledError: class extends Error {
    constructor(m: string = 'Extraction cancelled') { super(m); this.name = 'ExtractionCancelledError'; }
  }
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText(/Chat with your PDF/i)).toBeInTheDocument();
  });

  it('cancel action returns to idle without error state', async () => {
    render(<App />);

    let abortSignal: AbortSignal | undefined;
    let rejectExtract: ((reason?: any) => void) | undefined;

    vi.mocked(pdfService.extractPdfText).mockImplementation((_file, _progress, signal) => {
      abortSignal = signal;
      return new Promise((_resolve, reject) => {
        rejectExtract = reject;
      });
    });

    const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByText(/Cancel Extraction/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Cancel Extraction/i));

    expect(abortSignal?.aborted).toBe(true);
    if (rejectExtract) {
      rejectExtract(new pdfService.ExtractionCancelledError());
    }

    expect(await screen.findByText(/Select File/i)).toBeInTheDocument();
    expect(screen.queryByText(/Upload Failed/i)).not.toBeInTheDocument();
  });

  it('prevents overlapping uploads', async () => {
    render(<App />);

    vi.mocked(pdfService.extractPdfText).mockImplementation(() => {
      return new Promise(() => {}); // never resolves to keep in extracting state
    });

    const file1 = new File(['test1'], 'test1.pdf', { type: 'application/pdf' });
    const file2 = new File(['test2'], 'test2.pdf', { type: 'application/pdf' });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file1] } });

    expect(await screen.findByText(/Cancel Extraction/i)).toBeInTheDocument();

    fireEvent.change(input, { target: { files: [file2] } });
    expect(pdfService.extractPdfText).toHaveBeenCalledTimes(1);

    const dropZone = document.querySelector('.border-dashed');
    if (dropZone) {
      fireEvent.drop(dropZone, { dataTransfer: { files: [file2] } });
    }
    expect(pdfService.extractPdfText).toHaveBeenCalledTimes(1);
  });
});
