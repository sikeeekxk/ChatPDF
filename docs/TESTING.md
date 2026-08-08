# Testing Strategy

- **Unit/Component Tests**: Vitest + React Testing Library
- **End-to-End Tests**: Playwright
- **Static Analysis**: TypeScript (`tsc`), ESLint (via oxlint)
- **CI**: GitHub Actions (lint, type-check, test, build)

## Coverage Requirements
Tests must eventually cover:
- PDF type and signature validation
- File-size and page-count limits
- Empty and scanned PDFs
- Page-aware extraction
- Chunk overlap and metadata
- Embedding batching
- Retry limits
- Partial-progress recovery
- IndexedDB cleanup
- Retrieval behavior
- Citation validation and navigation
- Grounded refusal
- Prompt injection defenses
- API payload limits
- AI and network errors
- Secret absence from frontend bundle
- Absence of Cloudflare files/dependencies
- Responsive behavior & Accessibility
