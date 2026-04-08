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

class TailoredBullet(BaseModel):
    """A rewritten resume bullet point from any section."""
    context: str = Field(default="", description="The specific heading, job title, project name, or institution this bullet belongs to, to provide structural context to the user.")
    original: str = ""
    tailored: str = ""
    injected_skills: list[str] = []


class TailorRequest(BaseModel):
    """Request body for the /tailor endpoint."""
    resume: ParsedResume
    job: JobDescriptionInput
    missing_skills: list[str] = []
    custom_instructions: Optional[str] = ""


class TailorResult(BaseModel):
    """Response containing tailored resume sections."""
    professional_summary: str = ""
    tailored_skills: list[str] = []
    tailored_bullets: list[TailoredBullet] = []


# ── Profile Models ────────────────────────────────────────

class UserProfileSchema(BaseModel):
    """Schema for representing a user profile."""
    id: int
    user_id: int
    first_name: str = ""
    last_name: str = ""
    resume_text: str = ""
    experience: str = ""
    certifications: str = ""
    skills: str = ""
    coursework: str = ""

    class Config:
        from_attributes = True

class UserProfileUpdate(BaseModel):
    """Schema for updating a user profile."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    portfolio: Optional[str] = None
    resume_text: Optional[str] = None
    experience: Optional[str] = None
    certifications: Optional[str] = None
    skills: Optional[str] = None
    coursework: Optional[str] = None


# ── AI Tailoring Models ───────────────────────────────────

class TailorCoverLetterRequest(BaseModel):
    cover_letter_text: str
    job: JobDescriptionInput
    resume: Optional[ParsedResume] = None
    custom_instructions: Optional[str] = ""

class TailorCoverLetterResult(BaseModel):
    revised_cover_letter: str
    explanation: str

# ── AI Revision Models ────────────────────────────────────

class ReviseRequest(BaseModel):
    """Request body for AI document revision."""
    document_text: str
    doc_type: str = "cover_letter"

class ReviseResult(BaseModel):
    """Result of AI document revision."""
    revised_text: str

# ── AI Profile Extraction Models ───────────────────────────

class ExtractProfileRequest(BaseModel):
    raw_text: str

class ProfileExperience(BaseModel):
    company: str
    title: str
    location: str
    description: str

class ExtractProfileResult(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: str
    linkedin: str
    portfolio: str
    skills: str
    certifications: str
    coursework: str
    experiences: list[ProfileExperience]


# ── AI Semantic Matching Models ────────────────────────────

class SemanticMatch(BaseModel):
    skill: str
    reasoning: str = Field(description="Think step-by-step about whether the candidate has the skill based on the resume. Take your time to carefully connect the dots.")
    evidence: str = Field(description="If it's a match, provide a short, direct quote from the resume proving they have the skill or related experience. If false, output an empty string.")
    is_match: bool

class SemanticMatchResult(BaseModel):
    matches: list[SemanticMatch]
