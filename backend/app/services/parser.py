"""
ATS Resume Screener - Resume Parser
Extracts text from PDF/DOCX files and detects resume sections.
"""
import re
import io
from app.config import SECTION_PATTERNS
from app.models import ParsedSections


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract plain text from a PDF file."""
    try:
        import pdfplumber
        text_parts = []
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
        return "\n".join(text_parts)
    except Exception as e:
        raise ValueError(f"Failed to parse PDF: {str(e)}")


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract plain text from a DOCX file."""
    try:
        from docx import Document
        doc = Document(io.BytesIO(file_bytes))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n".join(paragraphs)
    except Exception as e:
        raise ValueError(f"Failed to parse DOCX: {str(e)}")


def extract_text(file_bytes: bytes, filename: str) -> str:
    """Extract text from a file based on its extension."""
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    if ext == "pdf":
        return extract_text_from_pdf(file_bytes)
    elif ext in ("docx", "doc"):
        return extract_text_from_docx(file_bytes)
    elif ext == "txt":
        return file_bytes.decode("utf-8", errors="ignore")
    else:
        raise ValueError(f"Unsupported file type: .{ext}. Please upload PDF, DOCX, or TXT.")


def detect_sections(text: str) -> ParsedSections:
    """
    Detect resume sections using regex pattern matching.
    Splits text into labeled sections (skills, experience, etc.).
    """
    lines = text.split("\n")
    sections = {}
    current_section = "summary"  # Default to summary if no header found
    current_lines = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            current_lines.append("")
            continue

        # Check if this line is a section header
        found_section = None
        for section_name, pattern in SECTION_PATTERNS.items():
            # Section headers are usually short standalone lines
            if len(stripped) < 60 and re.search(pattern, stripped):
                found_section = section_name
                break

        if found_section:
            # Save previous section
            if current_lines:
                content = "\n".join(current_lines).strip()
                if content:
                    sections[current_section] = content
            current_section = found_section
            current_lines = []
        else:
            current_lines.append(stripped)

    # Save the last section
    if current_lines:
        content = "\n".join(current_lines).strip()
        if content:
            sections[current_section] = content

    return ParsedSections(
        contact=sections.get("contact", ""),
        summary=sections.get("summary", ""),
        skills=sections.get("skills", ""),
        experience=sections.get("experience", ""),
        education=sections.get("education", ""),
        projects=sections.get("projects", ""),
        certifications=sections.get("certifications", ""),
    )


def extract_email(text: str) -> str:
    """Find email addresses in text."""
    match = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text)
    return match.group(0) if match else ""


def extract_phone(text: str) -> str:
    """Find phone numbers in text."""
    match = re.search(r"[\+]?[(]?\d{3}[)]?[-\s.]?\d{3}[-\s.]?\d{4}", text)
    return match.group(0) if match else ""


def extract_years_of_experience(text: str) -> int:
    """
    Attempt to detect years of experience from resume text.
    Looks for patterns like "5+ years", "5 years of experience", etc.
    """
    patterns = [
        r"(\d+)\+?\s*years?\s*(?:of\s+)?(?:experience|expertise|professional)",
        r"(?:over|more\s+than|approximately|about)\s*(\d+)\s*years?",
        r"(\d+)\+?\s*yrs?",
    ]
    max_years = 0
    for pattern in patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            years = int(match)
            if 0 < years < 50:  # Sanity check
                max_years = max(max_years, years)
    return max_years
