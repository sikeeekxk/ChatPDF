import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractPdfText, PdfExtractionError, ExtractionCancelledError } from './pdfService';
import * as pdfjsLib from 'pdfjs-dist';

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn(),
}));

describe('pdfService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockFile = (size: number, type = 'application/pdf'): File => {
    return {
      size,
      type,
      arrayBuffer: async () => new ArrayBuffer(0),
    } as unknown as File;
  };

  it('throws error if file is not a PDF', async () => {
    const file = createMockFile(1024, 'image/png');
    await expect(extractPdfText(file)).rejects.toThrow(PdfExtractionError);
    await expect(extractPdfText(file)).rejects.toThrow('File is not a valid PDF.');
  });

  it('throws error if file exceeds 20MB', async () => {
    const file = createMockFile(21 * 1024 * 1024);
    await expect(extractPdfText(file)).rejects.toThrow(PdfExtractionError);
    await expect(extractPdfText(file)).rejects.toThrow('File size exceeds the 20 MB limit.');
  });

  it('throws error if document exceeds 150 pages', async () => {
    const file = createMockFile(1024);

    vi.mocked(pdfjsLib.getDocument).mockReturnValue({
      promise: Promise.resolve({
        destroy: vi.fn(),
        numPages: 151,
      }),
      destroy: vi.fn(),
    } as any);

    await expect(extractPdfText(file)).rejects.toThrow(PdfExtractionError);
    await expect(extractPdfText(file)).rejects.toThrow(/exceeds the limit of 150 pages/);
  });

  it('throws error if no text is found', async () => {
    const file = createMockFile(1024);

    const mockPage = {
      getTextContent: vi.fn().mockResolvedValue({ items: [] }),
    };

    vi.mocked(pdfjsLib.getDocument).mockReturnValue({
      promise: Promise.resolve({
        destroy: vi.fn(),
        numPages: 1,
        getPage: vi.fn().mockResolvedValue(mockPage),
      }),
      destroy: vi.fn(),
    } as any);

    await expect(extractPdfText(file)).rejects.toThrow(PdfExtractionError);
    await expect(extractPdfText(file)).rejects.toThrow(/No text could be extracted/);
  });

  it('extracts text successfully', async () => {
    const file = createMockFile(1024);

    const mockPage = {
      getTextContent: vi.fn().mockResolvedValue({
        items: [{ str: 'Hello ' }, { str: 'World' }]
      }),
    };

    vi.mocked(pdfjsLib.getDocument).mockReturnValue({
      promise: Promise.resolve({
        destroy: vi.fn(),
        numPages: 1,
        getPage: vi.fn().mockResolvedValue(mockPage),
      }),
      destroy: vi.fn(),
    } as any);

    const result = await extractPdfText(file);

    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].pageNumber).toBe(1);
    expect(result.pages[0].text).toBe('Hello  World');
    expect(result.totalTextLength).toBe('Hello  World'.length);
  });

  it('throws ExtractionCancelledError if signal is already aborted', async () => {
    const file = createMockFile(1024);
    const abortController = new AbortController();
    abortController.abort();
    await expect(extractPdfText(file, undefined, abortController.signal)).rejects.toThrow(ExtractionCancelledError);
  });

  it('throws ExtractionCancelledError if aborted during PDF loading', async () => {
    const file = createMockFile(1024);
    const abortController = new AbortController();

    const loadingTaskDestroySpy = vi.fn();
    vi.mocked(pdfjsLib.getDocument).mockImplementation(() => {
      setTimeout(() => abortController.abort(), 10);
      return {
        promise: new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Worker destroyed')), 20);
        }),
        destroy: loadingTaskDestroySpy,
      } as any;
    });

    await expect(extractPdfText(file, undefined, abortController.signal)).rejects.toThrow(ExtractionCancelledError);
    expect(loadingTaskDestroySpy).toHaveBeenCalled();
  });

  it('throws ExtractionCancelledError if aborted during page extraction', async () => {
    const file = createMockFile(1024);
    const abortController = new AbortController();

    const destroySpy = vi.fn();
    let resolvePageText: any;
    const pagePromise = new Promise(resolve => resolvePageText = resolve);

    const mockPage = {
      getTextContent: vi.fn().mockImplementation(() => {
        abortController.abort();
        return pagePromise;
      }),
    };

    vi.mocked(pdfjsLib.getDocument).mockReturnValue({
      promise: Promise.resolve({
        destroy: destroySpy,
        numPages: 2, // 2 pages so it checks aborted on the next iteration
        getPage: vi.fn().mockResolvedValue(mockPage),
      }),
      destroy: vi.fn(),
    } as any);

    const promise = extractPdfText(file, undefined, abortController.signal);
    resolvePageText({ items: [{ str: 'Hello' }] });

    await expect(promise).rejects.toThrow(ExtractionCancelledError);
    expect(destroySpy).toHaveBeenCalled();
  });

  it('cleans up resources after success', async () => {
    const file = createMockFile(1024);
    const destroySpy = vi.fn();
    vi.mocked(pdfjsLib.getDocument).mockReturnValue({
      promise: Promise.resolve({
        destroy: destroySpy,
        numPages: 1,
        getPage: vi.fn().mockResolvedValue({
          getTextContent: vi.fn().mockResolvedValue({ items: [{ str: 'Test' }] })
        }),
      }),
      destroy: vi.fn(),
    } as any);

    await extractPdfText(file);
    expect(destroySpy).toHaveBeenCalled();
  });

  it('cleans up resources after failure', async () => {
    const file = createMockFile(1024);
    const destroySpy = vi.fn();
    vi.mocked(pdfjsLib.getDocument).mockReturnValue({
      promise: Promise.resolve({
        destroy: destroySpy,
        numPages: 1,
        getPage: vi.fn().mockRejectedValue(new Error('Page failure')),
      }),
      destroy: vi.fn(),
    } as any);

    await expect(extractPdfText(file)).rejects.toThrow(PdfExtractionError);
    expect(destroySpy).toHaveBeenCalled();
  });
});
