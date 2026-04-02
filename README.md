# ATS Resume Screener

A full-stack web application that simulates how real Applicant Tracking Systems evaluate resumes. You paste in (or upload) a resume and a job description, and the system scores the resume across seven weighted categories, flags missing skills, and gives concrete suggestions for improvement.

I built this to understand the mechanics behind ATS screening -- how companies filter candidates before a human ever reads the resume. The backend handles all the analysis (parsing, skill extraction, scoring), while the frontend gives you a visual breakdown of the results in real time.

**What this is not:** a production enterprise ATS. It is a personal project that demonstrates how these systems work under the hood.

---

## Table of Contents

- [How to Run the ATS Project](#how-to-run-the-ats-project)
- [Quick Start (Returning Users)](#quick-start-returning-users)
- [What It Does](#what-it-does)
- [How the Scoring Works](#how-the-scoring-works)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup -- Step by Step (First Time)](#setup----step-by-step-first-time)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Set Up the Backend (Python)](#2-set-up-the-backend-python)
  - [3. Set Up Supabase (Cloud Database)](#3-set-up-supabase-cloud-database)
  - [4. Configure Environment Variables](#4-configure-environment-variables)
  - [5. Start the Backend Server](#5-start-the-backend-server)
  - [6. Set Up the Frontend (Node.js)](#6-set-up-the-frontend-nodejs)
  - [7. Start the Frontend](#7-start-the-frontend)
- [Using the App](#using-the-app)
- [API Reference](#api-reference)
- [Running Tests](#running-tests)
- [Troubleshooting](#troubleshooting)

---

## How to Run the ATS Project

To start the application, you will need to open two separate terminals from this root folder.

**Terminal 1: Start the Backend (API)**
1. `cd backend`
2. Activate the virtual environment:
   - Windows: `.\.venv\Scripts\activate`
   - Mac/Linux: `source .venv/bin/activate`
3. Start the server:
   `python -m uvicorn app.main:app --reload`

**Terminal 2: Start the Frontend (UI)**
1. `cd frontend`
2. Start the development server:
   `npm run dev`

Once both servers are running, open `http://localhost:3000` in your web browser. You should see "API Connected" in the top right corner.

*Note: If you haven't installed dependencies yet, run `pip install -r requirements.txt` in the backend folder and `npm install` in the frontend folder before starting the servers.*

---

## Quick Start (Returning Users)

If you have already cloned the repo and installed all dependencies before, you just need two terminals.

**Terminal 1 — start the backend (Python):**

**For Windows (PowerShell/Command Prompt):**
```powershell
cd backend
.\.venv\Scripts\activate
python -m uvicorn app.main:app --reload
```
*(Note: Do NOT use the `source` command on Windows. If you get an execution policy error in PowerShell, try running `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` first).*

**For Mac/Linux:**
```bash
cd backend
source .venv/bin/activate
python -m uvicorn app.main:app --reload
```

**Terminal 2 — start the frontend (Node.js):**

```bash
cd frontend
npm run dev
```

Open `http://localhost:3000` in your browser. You should see "Connected" with a green dot in the top-right corner once both servers are running.

If something broke since last time (new dependencies added, etc.), re-run `pip install -r requirements.txt` in the backend and `npm install` in the frontend before starting.

---

## What It Does

- **Resume parsing** -- Upload a PDF, DOCX, or TXT file. The backend extracts the raw text and splits it into sections (summary, skills, experience, education, projects, certifications) using regex pattern matching.

- **Skill extraction** -- The system scans the resume text against a taxonomy of 80+ skills. Each skill has synonyms so that "JS" gets recognized as "JavaScript", "ML" gets recognized as "Machine Learning", and so on. No user configuration needed.

- **Weighted scoring** -- The resume is scored across seven categories with configurable weights. Each category produces a 0-100 score, and the weighted sum becomes the overall match score.

- **Reject logic** -- If the candidate is missing more than 60% of the required skills, the system auto-rejects regardless of the overall score. Same idea applies to experience year minimums.

- **Explanations and suggestions** -- After scoring, the system generates a written explanation of *why* the resume matched or didn't, along with specific suggestions (e.g., "Add these required skills to your resume if you have experience with them: Docker, Kubernetes").

- **Analysis history** -- Every analysis is saved to a Supabase (PostgreSQL) cloud database. You can view, revisit, or delete past analyses from the UI.

- **Dark & Light Themes** — The frontend features a professional design system with 4 built-in theme presets (Clean Light, Soft Dark, Warm Neutral, Ocean Calm), glassmorphism cards, and a responsive two-column layout.

---

## How the Scoring Works

The backend runs a multi-step pipeline for each analysis:

1. Extract skills from the resume text using the taxonomy (with synonym matching)
2. Compare extracted skills against the required and preferred skill lists from the job description
3. Compute sub-scores for keyword overlap, experience relevance, project relevance, education match, and resume completeness
4. Apply configurable weights to produce an overall score
5. Run reject rules (too many missing required skills, insufficient experience)
6. Classify the result as Strong Match, Moderate Match, Weak Match, or Reject
7. Generate a human-readable explanation and improvement suggestions

| Category | Weight | What It Measures |
|----------|--------|-----------------|
| Required Skills | 30% | How many of the must-have skills appear in the resume |
| Experience | 20% | How relevant the work experience section is to the job |
| Preferred Skills | 15% | How many nice-to-have skills appear |
| Keyword Match | 10% | General word overlap between resume and job description |
| Education | 10% | Whether the degree requirement is met |
| Projects | 10% | Whether the projects section relates to the job |
| Completeness | 5% | Whether the resume has all expected sections and sufficient length |

These weights are defined in `backend/app/config.py` and can be changed to suit different priorities.

---

## Tech Stack

| Layer | Technology | What It Does Here |
|-------|-----------|-------------------|
| Frontend | Next.js 16, React 19, TypeScript | Renders the UI, handles file uploads, calls the backend API |
| Styling | Tailwind CSS 4 | Dark theme, glassmorphism effects, animations, responsive layout |
| Backend | Python 3.11+, FastAPI | REST API, resume parsing, scoring engine, all the business logic |
| Server | Uvicorn | ASGI server that runs the FastAPI application |
| Database | Supabase (PostgreSQL) | Stores analysis history in the cloud |
| PDF Parsing | pdfplumber | Extracts text from PDF resume files |
| DOCX Parsing | python-docx | Extracts text from Word document resume files |
| Skill Matching | Custom taxonomy (JSON) + regex | Matches skills with synonym normalization, no external API calls |
| Testing | pytest | Backend unit tests for the scoring engine and skill matcher |

No external AI APIs are used for the core functionality. The scoring, matching, and explanations are all rule-based and run locally.

### Database Architecture & Supabase (Important Note)

**What is Supabase?**
Supabase is an open-source Firebase alternative that provides a scalable PostgreSQL cloud database, built-in authentication, and real-time subscriptions out of the box.

**Purpose & Contribution:**
The original design of this ATS Screener used Supabase to store all user authentication data, document files, and the history of every resume scan in the cloud. This allowed users to log in from anywhere and instantly sync their analysis histories across devices.

**Current State (Local SQLite):**
To make the project easier to clone, test, and run locally without requiring third-party cloud accounts, **the project's database driver has been recently updated to use local SQLite (`ats.db`) instead of Supabase by default.** 
- All profiles, resumes, and history analyses are currently saved directly on your hard drive. 
- You still get the full database experience (login, registering, saving history), but the data remains local, secure, and completely independent of any internet database connection.

---


## Prerequisites

You need three things installed on your machine before you start:

1. **Python 3.11 or 3.12 (Highly Recommended)**
   - Download from [python.org/downloads](https://www.python.org/downloads/)
   - *Note: Do not use newer versions like Python 3.13 or 3.14 unless you have C++ Build Tools installed, as they lack pre-compiled binary wheels for some data science dependencies and will fail to install.*
   - During installation on Windows, make sure to check "Add Python to PATH"
   - To verify it is installed, open a terminal and run: `python --version`

2. **Node.js 18 or newer**
   - Download from [nodejs.org](https://nodejs.org/) (pick the LTS version)
   - This also installs `npm`, which is the package manager for the frontend
   - To verify: `node --version` and `npm --version`

3. **A Supabase account (free)**
   - Sign up at [supabase.com](https://supabase.com) -- no credit card needed
   - The free tier gives you 500MB of storage and unlimited API requests, which is more than enough

---

## Setup -- Step by Step (First Time)

### 1. Clone the Repository

Open a terminal (Command Prompt, PowerShell, or your preferred terminal on Mac/Linux) and run:

```bash
git clone https://github.com/YOUR_USERNAME/ats.git
cd ats
```

Replace `YOUR_USERNAME` with your actual GitHub username, or use whatever URL you have for this repo.

---

### 2. Set Up the Backend (Python)

The backend uses a Python virtual environment to keep its dependencies separate from the rest of your system. This is standard practice -- it avoids version conflicts with other Python projects.

**On Windows (PowerShell):**

```powershell
cd backend

# Create the virtual environment (this makes a .venv folder)
python -m venv .venv

# Activate it (you should see (.venv) in your terminal prompt after this)
.venv\Scripts\activate

# Install all the Python packages the backend needs
pip install -r requirements.txt
```

**On Mac / Linux:**

```bash
cd backend

python3 -m venv .venv

source .venv/bin/activate

pip install -r requirements.txt
```

This installs FastAPI, Uvicorn, pdfplumber, python-docx, the Supabase client, and the other libraries listed in `requirements.txt`.

If `pip install` fails on the `spacy` package, you may need to install it separately:

```bash
pip install spacy
```

---

### 3. Set Up Supabase (Cloud Database)

Supabase handles storing your analysis history in the cloud. Here is how to set it up:

**Step A** -- Go to [supabase.com](https://supabase.com) and sign in (or create an account).

**Step B** -- Click "New Project". Pick any name (for example, "ats-screener"). Choose a database password and a region close to you. Click "Create new project" and wait about a minute for it to spin up.

**Step C** -- Once the project is ready, go to **Project Settings** (the gear icon in the sidebar) and then click **API** under the Configuration section. You will see two values you need:

- **Project URL** -- looks like `https://abcdefg.supabase.co`
- **anon / public key** -- a long string starting with `eyJ...`

Copy both of these. You will need them in the next step.

**Step D** -- Create the database table. In the Supabase dashboard, click **SQL Editor** in the sidebar. Paste in the following SQL and click "Run":

```sql
CREATE TABLE analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_name TEXT,
  job_title TEXT,
  company TEXT,
  overall_score FLOAT,
  recommendation TEXT,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

This creates the single table that the app uses to store analysis results. Each row holds the resume name, job title, overall score, recommendation, and the full analysis result as a JSON blob.

---

### 4. Configure Environment Variables

The app reads sensitive values (API keys, URLs) from `.env` files so they stay out of version control.

**Backend** -- Open `backend/.env` in any text editor and set:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anon-public-key

# These can stay as defaults
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=http://localhost:3000
```

Replace the Supabase values with the ones you copied in Step 3.

**Frontend** -- Open `frontend/.env.local` and set:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

Again, replace the Supabase values with yours.

If the `.env` files do not exist yet, create them. They are plain text files.

---

### 5. Start the Backend Server

Make sure you are in the `backend` directory and the virtual environment is activated (you should see `(.venv)` in your terminal prompt).

```bash
python -m uvicorn app.main:app --reload
```

You should see output like:

```
Starting ATS Resume Screener API...
Connected to Supabase
API running at http://localhost:8000
Docs at http://localhost:8000/docs
```

The `--reload` flag means the server will automatically restart whenever you change a Python file. Handy during development.

Leave this terminal running. Open a second terminal for the frontend.

**Quick check:** Open `http://localhost:8000/docs` in your browser. You should see the interactive API documentation (generated by FastAPI). If you see it, the backend is working.

---

### 6. Set Up the Frontend (Node.js)

In your second terminal:

```bash
cd frontend
npm install
```

This reads `package.json` and installs all the JavaScript dependencies into `node_modules/`. It should take a minute or two the first time.

---

### 7. Start the Frontend

Still in the `frontend` directory:

```bash
npm run dev
```

You should see output like:

```
  - Local:   http://localhost:3000
```

Open `http://localhost:3000` in your browser. The app should load, and in the top-right corner you should see a green "API Connected" indicator. If it says "API Offline" in red, the backend is not running -- go back to Step 5.

---

## Using the App

1. **Load sample data** -- Click the "Load Sample" button on both the Resume panel (left side) and the Job Description panel (right side). This fills in a pre-built sample resume and job description so you can test without typing anything.

2. **Click "Analyze Match"** -- The frontend sends the data to the backend, which runs the full scoring pipeline. After a moment, the results appear below.

3. **Read the results** -- You will see:
   - An overall score (0-100) with a color-coded recommendation
   - A bar chart breaking down the score across all seven categories
   - Lists of matched skills, missing required skills, and missing preferred skills
   - Relevant experience and project snippets the system found
   - A written explanation of the match
   - Suggestions for improving the resume

4. **Try your own resume** -- Upload a PDF, DOCX, or TXT file using the file upload area, or paste resume text directly into the text box.

5. **View history** -- Click the history panel at the bottom to see past analyses. You can click any entry to reload its results, or delete entries you no longer need.

---

## API Reference

The backend exposes these endpoints. You can test them at `http://localhost:8000/docs` using the built-in Swagger UI.

| Method | Endpoint | What It Does |
|--------|----------|-------------|
| POST | `/parse-resume` | Accepts a file upload (PDF, DOCX, or TXT). Returns the extracted text split into sections. |
| POST | `/analyze-match` | Takes a parsed resume and a job description. Runs the scoring pipeline. Returns the full analysis result and saves it to Supabase. |
| GET | `/history` | Returns the most recent 20 analyses from Supabase. |
| DELETE | `/history/{id}` | Deletes a specific analysis record by its UUID. |
| GET | `/health` | Returns `{"status": "healthy"}` if the server is running. Used by the frontend to check connectivity. |

---

## Running Tests

The backend has unit tests for the scoring engine and the skill matcher. To run them:

```bash
cd backend

# Activate the virtual environment if not already active
# Windows:
.venv\Scripts\activate
# Mac/Linux:
source .venv/bin/activate

pytest tests/ -v
```

The `-v` flag gives verbose output so you can see each test name and whether it passed.

---

## Troubleshooting

**"API Offline" shows up in the frontend**
- The backend is not running. Go to the `backend` folder, activate the virtual environment, and run `python -m uvicorn app.main:app --reload`.

**`pip install -r requirements.txt` fails**
- Make sure you are using Python 3.11 or 3.12. Run `python --version` to check. If you are using 3.13 or newer, you might get "subprocess-exited-with-error" or warnings about missing C++ visual studio compilers while building `numpy` or `spacy`. Downgrade to 3.12 to fix this instantly!
- On some systems, you need `python3` instead of `python`.
- If a specific package fails (especially `spacy`), try installing it individually: `pip install spacy`.

**`npm install` fails**
- Make sure Node.js 18+ is installed. Run `node --version` to check.
- If you get permission errors on Mac/Linux, do NOT use `sudo`. Instead, fix npm permissions: [docs.npmjs.com/resolving-eacces-permissions-errors](https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally).

**Supabase connection warning ("history won't be saved")**
- Double-check that your `SUPABASE_URL` and `SUPABASE_KEY` in `backend/.env` are correct.
- Make sure you ran the `CREATE TABLE` SQL in the Supabase SQL Editor.
- The app still works without Supabase -- you just will not have persistent history.

**Port 8000 or 3000 is already in use**
- Another process is using that port. Either stop the other process or change the port:
  - Backend: set `API_PORT=8001` in `backend/.env` and update `NEXT_PUBLIC_API_URL` in `frontend/.env.local` to match.
  - Frontend: run `npm run dev -- -p 3001` to use port 3001 instead.

**Resume parsing returns empty sections**
- The parser relies on section headers like "EXPERIENCE", "SKILLS", "EDUCATION" in the resume text. If the resume uses unusual formatting or no headers, the parser may not detect them. Try the sample resume first to confirm the system works, then compare your resume's format.

---

## License

This project is for educational and portfolio purposes.
