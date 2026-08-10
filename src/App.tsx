import { useState } from 'react'
import { PdfUploader } from './components/PdfUploader'
import type { ExtractionResult } from './services/pdfService'

function App() {
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null)

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <header className="border-b bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">AskPDF</h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-6 py-12">
        {!extractionResult ? (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Chat with your PDF
              </h2>
              <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
                Upload a document to extract its contents and start asking questions.
              </p>
            </div>

            <PdfUploader onExtractionComplete={setExtractionResult} />
          </div>
        ) : (
          <div className="rounded-xl border bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <h2 className="mb-4 text-2xl font-bold">Extraction Successful!</h2>
            <div className="space-y-4">
              <p>
                <span className="font-semibold">Pages:</span> {extractionResult.pages.length}
              </p>
              <p>
                <span className="font-semibold">Total text length:</span> {extractionResult.totalTextLength.toLocaleString()} characters
              </p>

              <div className="mt-8 rounded-lg bg-gray-100 p-4 dark:bg-gray-900 overflow-auto max-h-96">
                <h3 className="mb-2 font-medium">Preview of Page 1:</h3>
                <p className="whitespace-pre-wrap text-sm font-mono text-gray-600 dark:text-gray-400">
                  {extractionResult.pages[0]?.text || 'No text found on page 1.'}
                </p>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setExtractionResult(null)}
                  className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700"
                >
                  Upload another PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
