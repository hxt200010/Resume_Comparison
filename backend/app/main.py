"""
ATS Resume Screener - FastAPI Application
Main entry point for the backend server.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import CORS_ORIGINS, API_HOST, API_PORT
from app.routers import resume, analysis, history, auth
from app.database import init_tables


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup: Initialize database tables
    print("🚀 Starting ATS Resume Screener API...")
    db_ok = init_tables()
    if db_ok:
        print("✅ Local SQLite database initialized")
    else:
        print("⚠️  Failed to initialize local database")
    print(f"📡 API running at http://localhost:{API_PORT}")
    print(f"📄 Docs at http://localhost:{API_PORT}/docs")
    yield
    # Shutdown
    print("👋 Shutting down ATS Resume Screener API")


# Create FastAPI app
app = FastAPI(
    title="ATS Resume Screener API",
    description="Applicant Tracking System that evaluates resumes against job descriptions",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS so the frontend can call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(resume.router)
app.include_router(analysis.router)
app.include_router(history.router)
app.include_router(auth.router)


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint to verify the API is running."""
    return {
        "status": "healthy",
        "service": "ATS Resume Screener",
        "version": "1.0.0",
    }


@app.get("/", tags=["Info"])
async def root():
    """Friendly root endpoint."""
    return {
        "message": "ATS Resume Screener API is running! 🚀",
        "docs": f"http://localhost:{API_PORT}/docs",
        "frontend": "Open http://localhost:3000 in your browser to use the app."
    }


# Run with: uvicorn app.main:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=API_HOST, port=API_PORT, reload=True)
