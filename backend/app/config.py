"""
ATS Resume Screener - Configuration
Scoring weights, thresholds, and application settings.
"""
import os
from dotenv import load_dotenv

load_dotenv()

# ── Supabase ──────────────────────────────────────────────
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

# ── Server ────────────────────────────────────────────────
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

# ── Optional AI ───────────────────────────────────────────
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
USE_OPENAI = os.getenv("USE_OPENAI", "false").lower() == "true"

# ── Scoring Weights (must sum to 1.0) ────────────────────
# These are easily tunable — change them here to adjust scoring
SCORING_WEIGHTS = {
    "required_skills":  0.30,   # Must-have skills match
    "preferred_skills": 0.15,   # Nice-to-have skills match
    "experience":       0.20,   # Relevant work experience
    "projects":         0.10,   # Relevant projects
    "education":        0.10,   # Education & certifications
    "keyword_match":    0.10,   # General keyword overlap
    "completeness":     0.05,   # Resume quality / completeness
}

# ── Recommendation Thresholds ────────────────────────────
THRESHOLDS = {
    "strong_match":   75,   # 75-100 → Strong Match
    "moderate_match": 50,   # 50-74  → Moderate Match
    "weak_match":     25,   # 25-49  → Weak Match
    # Below 25 → Reject / Not Relevant
}

# ── Reject Rules ─────────────────────────────────────────
# If candidate is missing more than this % of required skills → Reject
REQUIRED_SKILLS_REJECT_THRESHOLD = 0.6  # Missing 60%+ → auto reject

# ── Resume Section Headers (regex patterns) ──────────────
SECTION_PATTERNS = {
    "contact":        r"(?i)(contact\s*info|personal\s*info|phone|email)",
    "summary":        r"(?i)(summary|objective|profile|about\s*me|professional\s*summary)",
    "skills":         r"(?i)(skills|technical\s*skills|core\s*competencies|technologies|tools)",
    "experience":     r"(?i)(experience|work\s*experience|employment|professional\s*experience|work\s*history)",
    "education":      r"(?i)(education|academic|degree|university|college|school)",
    "projects":       r"(?i)(projects|personal\s*projects|academic\s*projects|portfolio)",
    "certifications": r"(?i)(certifications?|licenses?|credentials?|certificates?)",
}
