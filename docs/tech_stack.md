# ATS Resume Screener — Technology Documentation

## Overview
This document describes the technologies, tech stack, programming languages, and storage solutions used in the ATS Resume Screener project.

---

## Tech Stack Summary

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend Framework | Next.js | 14.x | React-based SSR/SSG framework |
| UI Library | React | 18.x | Component-based UI rendering |
| Language (Frontend) | TypeScript | 5.x | Type-safe JavaScript |
| Styling | Tailwind CSS | 3.x | Utility-first CSS framework |
| Backend Framework | FastAPI | 0.115.x | High-performance Python API |
| Language (Backend) | Python | 3.11+ | Backend logic & NLP |
| ASGI Server | Uvicorn | 0.30.x | Serves the FastAPI application |
| Cloud Database | Supabase | PostgreSQL 15 | Cloud-hosted relational database |
| NLP | spaCy | 3.7.x | Text processing & entity extraction |
| ML Similarity | scikit-learn | 1.5.x | Cosine similarity computation |
| PDF Parsing | pdfplumber | 0.11.x | PDF text extraction |
| DOCX Parsing | python-docx | 1.1.x | Word document text extraction |

---

## Programming Languages

### TypeScript (Frontend)
- Used for all frontend code (React components, API client, type definitions)
- Provides compile-time type checking for safer code
- Configured with strict mode for maximum type safety

### Python (Backend)
- Used for the FastAPI server, NLP processing, resume parsing, and scoring logic
- Python 3.11+ for modern features (type hints, match statements)
- Virtual environment (`.venv`) for isolated package management

### SQL (Database)
- Supabase uses PostgreSQL under the hood
- Table schemas defined in SQL for analyses, resumes, and job descriptions
- Queries executed via the Supabase Python SDK (no raw SQL in app code)

### CSS (Styling)
- Custom design system built with Tailwind CSS utility classes
- CSS custom properties (variables) for theming (dark mode, glassmorphism)
- CSS animations for micro-interactions (progress bars, fade-ins, score reveals)

---

## Storage Solution: Supabase (Cloud PostgreSQL)

### Why Supabase?
- **Most popular** cloud database for modern web apps
- **Free tier**: 500MB storage, unlimited API requests
- **PostgreSQL**: Industry-standard relational database
- **Real-time**: Built-in real-time subscriptions (for future features)
- **Auth**: Built-in authentication (for future user accounts)
- **SDKs**: Official Python and JavaScript clients
- **No server management**: Fully managed, no DevOps needed

### What's Stored

| Table | Columns | Purpose |
|-------|---------|---------|
| `analyses` | id, resume_name, job_title, company, overall_score, recommendation, result (JSONB), created_at | Stores each resume-vs-job analysis result |

### Data Flow
1. User uploads resume → parsed on backend → sent to frontend
2. User enters job description → sent to backend with parsed resume
3. Backend runs scoring pipeline → returns analysis result
4. Result is saved to Supabase `analyses` table
5. Frontend can load past analyses from Supabase via `/history` endpoint

### Security
- API keys stored in `.env` files (never committed to git)
- `.gitignore` protects sensitive files
- Supabase Row Level Security (RLS) can be enabled for production
- `anon` key is safe for client-side use (designed for public access with RLS)

---

## Backend Architecture

```
FastAPI App
├── Routers (API endpoints)
│   ├── POST /parse-resume     → Accepts file upload, returns parsed data
│   ├── POST /analyze-match    → Compares resume vs job, returns scores
│   ├── GET  /history          → Fetches past analyses from Supabase
│   └── GET  /health           → Health check
│
├── Services (Business logic)
│   ├── parser.py              → PDF/DOCX text extraction + section detection
│   ├── skill_matcher.py       → Skill taxonomy lookup + synonym normalization
│   ├── scorer.py              → Weighted scoring pipeline + reject logic
│   └── explainer.py           → Human-readable explanations + suggestions
│
├── Data
│   └── skills_taxonomy.json   → 80+ skills with synonyms, categories, degrees
│
└── Config
    └── config.py              → Scoring weights, thresholds, section patterns
```

### Scoring Pipeline
1. **Extract skills** from resume text using taxonomy
2. **Match skills** against required/preferred lists
3. **Compute sub-scores**: keyword overlap, experience, projects, education, completeness
4. **Apply weights** (configurable in `config.py`)
5. **Apply reject rules** (missing too many required skills, insufficient experience)
6. **Generate recommendation**: Strong/Moderate/Weak Match or Reject
7. **Generate explanation** and improvement suggestions

---

## Frontend Architecture

```
Next.js App (App Router)
├── app/
│   ├── layout.tsx       → Root layout with metadata
│   └── page.tsx         → Main page with state management
│
├── components/
│   ├── FileUpload.tsx       → Drag-and-drop file upload
│   ├── ResumePanel.tsx      → Left panel: resume input + parsed sections
│   ├── JobPanel.tsx         → Right panel: job description input
│   ├── ResultsDashboard.tsx → Full results display
│   ├── ScoreChart.tsx       → Score circle + progress bars
│   └── HistoryPanel.tsx     → Collapsible analysis history
│
└── lib/
    ├── types.ts         → TypeScript type definitions
    ├── api.ts           → API client functions
    └── sampleData.ts    → Pre-filled sample data for testing
```

### Design System
- **Theme**: Dark mode with indigo/violet accent colors
- **Effects**: Glassmorphism cards, gradient borders, glow shadows
- **Animations**: Fade-in-up, progress bar fills, score circle reveal, shimmer loading
- **Typography**: Inter font (Google Fonts)
- **Responsive**: Two-column on desktop (lg+), single column on mobile

---

## Package Management

### Backend (Python)
- **Virtual environment**: `.venv/` created with `python -m venv .venv`
- **Package manager**: pip
- **Dependencies**: Listed in `requirements.txt`
- **Activation**: `.venv\Scripts\activate` (Windows) or `source .venv/bin/activate` (Mac/Linux)

### Frontend (Node.js)
- **Package manager**: npm
- **Dependencies**: Listed in `package.json`
- **Node modules**: `node_modules/` (auto-installed with `npm install`)

---

## Development Tools

| Tool | Purpose |
|------|---------|
| Git | Version control |
| `.env` files | Environment-specific configuration |
| `.gitignore` | Prevents sensitive files from being committed |
| ESLint | JavaScript/TypeScript linting |
| pytest | Python unit testing |
| Uvicorn `--reload` | Auto-reload backend during development |
| Next.js dev server | Hot module replacement for frontend |
