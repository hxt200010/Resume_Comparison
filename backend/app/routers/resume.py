"""
ATS Resume Screener - Resume Router
Handles resume upload and parsing.
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.models import ParsedResume, ExtractProfileRequest, ExtractProfileResult
from app.services.parser import extract_text, detect_sections
from app.services.skill_matcher import extract_skills_from_text
from app.services.extractor import extract_resume_profile

router = APIRouter(tags=["Resume"])


@router.post("/parse-resume", response_model=ParsedResume)
async def parse_resume(file: UploadFile = File(...)):
    """
    Upload a resume file (PDF, DOCX, or TXT) and get structured parsed data.
    
    Returns:
        ParsedResume with raw text, detected sections, and found skills.
    """
    # Validate file type
    allowed_extensions = {"pdf", "docx", "doc", "txt"}
    filename = file.filename or "unknown"
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""

    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: .{ext}. Please upload PDF, DOCX, or TXT."
        )

    # Read file content
    try:
        file_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")

    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # Extract text
    try:
        raw_text = extract_text(file_bytes, filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not raw_text or len(raw_text.strip()) < 20:
        raise HTTPException(
            status_code=400,
            detail="Could not extract meaningful text from the file. "
                   "Please try a different file or paste the text directly."
        )

    # Parse sections
    sections = detect_sections(raw_text)

    # Extract skills
    skills_found = extract_skills_from_text(raw_text)

    return ParsedResume(
        file_name=filename,
        raw_text=raw_text,
        sections=sections,
        skills_found=skills_found,
    )

@router.post("/extract-profile", response_model=ExtractProfileResult)
async def extract_profile_endpoint(request: ExtractProfileRequest):
    """
    Takes raw resume text and parses it into a structured Profile API response.
    Specifically parses out an array of experiences and structured skills.
    """
    try:
        result = await extract_resume_profile(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
