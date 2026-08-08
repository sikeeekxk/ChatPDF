import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker for PDF.js using Vite's URL handling
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

export interface ExtractionResult {
  pages: ExtractedPage[];
  totalTextLength: number;
}

export class PdfExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PdfExtractionError';
  }
}

export class ExtractionCancelledError extends Error {
  constructor(message = 'Extraction cancelled') {
    super(message);
    this.name = 'ExtractionCancelledError';
  }
}

export async function extractPdfText(
  file: File,
  onProgress?: (progress: number, status: string) => void,
  abortSignal?: AbortSignal
): Promise<ExtractionResult> {
  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
  const MAX_PAGES = 150;

  if (file.size > MAX_FILE_SIZE) {
    throw new PdfExtractionError('File size exceeds the 20 MB limit.');
  }
  if (file.type !== 'application/pdf') {
    throw new PdfExtractionError('File is not a valid PDF.');
  }

  if (abortSignal?.aborted) {
    throw new ExtractionCancelledError();
  }

  onProgress?.(0, 'Loading PDF...');

  const arrayBuffer = await file.arrayBuffer();

  if (abortSignal?.aborted) {
    throw new ExtractionCancelledError();
  }

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });

  const abortHandler = () => {
    loadingTask.destroy();
  };
  abortSignal?.addEventListener('abort', abortHandler);

  let pdf: pdfjsLib.PDFDocumentProxy | undefined;
  try {
    pdf = await loadingTask.promise;

    if (pdf.numPages > MAX_PAGES) {
      throw new PdfExtractionError(`Document has ${pdf.numPages} pages, which exceeds the limit of ${MAX_PAGES} pages.`);
    }

    const pages: ExtractedPage[] = [];
    let totalTextLength = 0;
    let textFound = false;

    for (let i = 1; i <= pdf.numPages; i++) {
      if (abortSignal?.aborted) {
        throw new ExtractionCancelledError();
      }

      onProgress?.(
        Math.round(((i - 1) / pdf.numPages) * 100),
        `Extracting page ${i} of ${pdf.numPages}...`
      );

      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      // textContent.items contains TextItem objects which have a 'str' property
      const pageText = textContent.items
        .filter((item: any) => 'str' in item)
        .map((item: any) => item.str)
        .join(' ');

      if (pageText.trim().length > 0) {
        textFound = true;
      }

      pages.push({
        pageNumber: i,
        text: pageText,
      });
      totalTextLength += pageText.length;
    }

    if (!textFound) {
      throw new PdfExtractionError('No text could be extracted. The PDF might be scanned or image-only.');
    }

    onProgress?.(100, 'Extraction complete.');

    return {
      pages,
      totalTextLength,
    };
  } catch (err) {
    if (abortSignal?.aborted || err instanceof ExtractionCancelledError) {
      throw new ExtractionCancelledError();
    }
    if (err instanceof PdfExtractionError) {
      throw err;
    }
    throw new PdfExtractionError('Failed to load or extract PDF document. ' + err);
  } finally {
    abortSignal?.removeEventListener('abort', abortHandler);
    if (pdf) {
      (pdf as any).destroy();
    }
  }
}
