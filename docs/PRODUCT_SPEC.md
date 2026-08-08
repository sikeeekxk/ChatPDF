# Product Specification

## Goal
Build a responsive website where a user uploads a PDF and asks conversational questions about its contents.

## Constraints
- Maximum file size: 20 MB
- Maximum length: 150 pages
- Text-based PDFs only
- Detect scanned or image-only PDFs
- One PDF per browser session
- No user accounts, database, permanent storage, or Cloudflare services.

## Functional Requirements
- Drag-and-drop and file-picker upload
- Extract text locally by page, preserve page numbers
- Display extraction progress, support cancellation
- Split workspace: PDF viewer and chat
- Citations with page navigation
- Grounded answers: refuse to invent answers if evidence is lacking
