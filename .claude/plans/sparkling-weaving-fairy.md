# LegalPDFTools Implementation Plan

## Context
Build a production-ready full-stack web application for Bates Stamping and Permanent PDF Redaction. The app will be deployed to Vercel (frontend) and Render (backend) with RAM-only PDF processing for security.

## Project Structure
```
LegalPDFTools/
├── frontend/                 # React + Vite
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page components (Bates, Redaction)
│   │   ├── services/         # API client
│   │   ├── hooks/            # Custom React hooks
│   │   ├── utils/            # Helpers
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── backend/                  # FastAPI + PyMuPDF
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/       # API endpoints
│   │   ├── core/             # Config, security
│   │   ├── models/           # Pydantic models
│   │   ├── services/         # PDF processing logic
│   │   └── main.py
│   ├── requirements.txt
│   └── render.yaml
├── vercel.json
└── render.yaml
```

## Backend API Design

### Endpoints
- `POST /api/bates-stamp` - Apply Bates numbering to PDF
- `POST /api/redact` - Permanently redact PDF content
- `GET /api/health` - Health check

### Request/Response Models
- BatesStampRequest: file, prefix, start_number, font_size, position, color
- RedactRequest: file, redactions (list of {page, x, y, width, height})
- ProcessingResponse: download_url, page_count, processing_time

### PDF Processing Logic
- **Bates Stamping**: Use PyMuPDF to add text annotations on each page with sequential numbering
- **Permanent Redaction**: Use PyMuPDF's `apply_redactions()` with `fill` parameter for irreversible removal
- **RAM-only**: Process using `fitz.open(stream=bytes, filetype="pdf")` - no temp files
- **Security**: Validate MIME type with python-magic, limit file size (50MB), rate limit

## Frontend Architecture

### Components
- `FileDropzone` - Drag-drop upload with validation
- `BatesConfigPanel` - Prefix, start number, position, font, color controls
- `RedactionTool` - Canvas overlay for drawing redaction rectangles
- `ProgressIndicator` - Upload/processing progress
- `PreviewViewer` - Side-by-side before/after PDF preview
- `DownloadButton` - Trigger download of processed file

### Pages
- `BatesStampingPage` - Full Bates workflow
- `RedactionPage` - Full redaction workflow
- `HomePage` - Landing with feature cards

### State Management
- React hooks for file state, processing status, preview data
- Service layer for API calls with error handling

## Deployment Configurations

### vercel.json (Frontend)
- Build command: `npm run build`
- Output directory: `dist`
- Framework: Vite
- SPA routing fallback

### render.yaml (Backend)
- Service type: Web Service
- Build: `pip install -r requirements.txt`
- Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Environment variables for CORS origins

## Security Considerations
- File type validation via magic bytes (not extension)
- File size limits (50MB)
- Rate limiting (10 req/min per IP)
- CORS restricted to frontend domain
- No file persistence - all in-memory
- Input sanitization on all parameters
- Security headers via Starlette middleware

## Verification Plan
1. Backend: Run `uvicorn app.main:app --reload`, test endpoints with curl/Postman
2. Frontend: Run `npm run dev`, test upload/preview/download flows
3. Integration: Deploy to Vercel/Render, test end-to-end
4. Security: Verify large files rejected, invalid types rejected, rate limits work