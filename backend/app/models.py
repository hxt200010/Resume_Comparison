"""
ATS Resume Screener - Pydantic Models
Request/response schemas for the API.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ── Resume Models ─────────────────────────────────────────

class ParsedSections(BaseModel):
    """Structured sections extracted from a resume."""
    contact: Optional[str] = ""
    summary: Optional[str] = ""
    skills: Optional[str] = ""
    experience: Optional[str] = ""
    education: Optional[str] = ""
    projects: Optional[str] = ""
    certifications: Optional[str] = ""


class ParsedResume(BaseModel):
    """Full parsed resume data returned to the frontend."""
    file_name: str = ""
    raw_text: str = ""
    sections: ParsedSections = ParsedSections()
    skills_found: list[str] = []


# ── Job Description Models ────────────────────────────────

class JobDescriptionInput(BaseModel):
    """Job description input from the user."""
    title: Optional[str] = ""
    company: Optional[str] = ""
    description: str = ""
    required_skills: list[str] = []
    preferred_skills: list[str] = []
    min_experience: Optional[int] = 0
    degree_required: Optional[str] = ""


class ExtractJobRequest(BaseModel):
    """Request body for extracting job details from raw text."""
    raw_text: str


# ── Analysis Models ───────────────────────────────────────

class ScoreBreakdown(BaseModel):
    """Individual scoring category results."""
    required_skills_score: float = 0.0
    preferred_skills_score: float = 0.0
    experience_score: float = 0.0
    projects_score: float = 0.0
    education_score: float = 0.0
    keyword_match_score: float = 0.0
    completeness_score: float = 0.0


class AnalysisRequest(BaseModel):
    """Request body for the /analyze-match endpoint."""
    resume: ParsedResume
    job: JobDescriptionInput


class AnalysisResult(BaseModel):
    """Full analysis result returned to the frontend."""
    overall_score: float = 0.0
    recommendation: str = "Not Analyzed"
    score_breakdown: ScoreBreakdown = ScoreBreakdown()
    matched_skills: list[str] = []
    missing_required: list[str] = []
    missing_preferred: list[str] = []
    relevant_experience: list[str] = []
    relevant_projects: list[str] = []
    education_match: str = ""
    explanation: str = ""
    suggestions: list[str] = []
    rejection_reasons: list[str] = []
    confidence: float = 0.0


# ── History Models ────────────────────────────────────────

class HistoryEntry(BaseModel):
    """A single analysis history record."""
    id: Optional[str] = None
    resume_name: str = ""
    job_title: str = ""
    company: str = ""
    overall_score: float = 0.0
    recommendation: str = ""
    created_at: Optional[str] = None
    result: Optional[AnalysisResult] = None


# ── Tailor Models ─────────────────────────────────────────

class TailoredExperience(BaseModel):
    """A rewritten experience bullet point."""
    original: str = ""
    tailored: str = ""
    injected_skills: list[str] = []


class TailorRequest(BaseModel):
    """Request body for the /tailor endpoint."""
    resume: ParsedResume
    job: JobDescriptionInput
    missing_skills: list[str] = []


class TailorResult(BaseModel):
    """Response containing tailored resume sections."""
    professional_summary: str = ""
    experience_bullets: list[TailoredExperience] = []


# ── Profile Models ────────────────────────────────────────

class UserProfileSchema(BaseModel):
    """Schema for representing a user profile."""
    id: int
    user_id: int
    resume_text: str = ""
    experience: str = ""
    certifications: str = ""
    skills: str = ""
    coursework: str = ""

    class Config:
        from_attributes = True

class UserProfileUpdate(BaseModel):
    """Schema for updating a user profile."""
    resume_text: Optional[str] = None
    experience: Optional[str] = None
    certifications: Optional[str] = None
    skills: Optional[str] = None
    coursework: Optional[str] = None

