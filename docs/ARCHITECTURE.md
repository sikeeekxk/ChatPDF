# Architecture

## Frontend
- **Framework**: React + TypeScript (Strict Mode)
- **Tooling**: Vite
- **Styling**: Tailwind CSS v4
- **PDF Processing**: PDF.js (local extraction, rendering)
- **Storage**: IndexedDB (temporary storage for chunks and chat state)

## Backend / AI
- **Hosting**: Azure Static Web Apps
- **API**: Managed Azure Functions (`/api/health`, `/api/embed`, `/api/chat`)
- **AI**: Gemini Developer API (configured via `GEMINI_API_KEY`)

## Excluded Technologies
- Cloudflare (Pages, Workers, AI, Vectorize, R2, D1, Turnstile)
- Azure Blob Storage, SQL, Cosmos DB, AI Search, App Service, Container Apps, Key Vault
