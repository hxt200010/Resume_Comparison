"""
ATS Resume Screener - AI Job Extractor Service
Uses OpenAI to parse raw job descriptions into structured data.
"""
from typing import Optional
from openai import AsyncOpenAI
from app.config import OPENAI_API_KEY
from app.models import (
    JobDescriptionInput, ExtractJobRequest, ReviseRequest, ReviseResult,
    ExtractProfileRequest, ExtractProfileResult
)

client = AsyncOpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None


async def extract_job_details(request: ExtractJobRequest) -> JobDescriptionInput:
    """
    Calls OpenAI to process raw job listing text and structured it into JobDescriptionInput.
    """
    if not client:
        raise ValueError("OPENAI_API_KEY is missing. Cannot extract job details.")

    if not request.raw_text or len(request.raw_text.strip()) < 20:
        raise ValueError("Provided text is too short to be a valid job posting.")

    system_prompt = """
You are an expert HR Parser. 
The user will provide the raw text of a job posting copied from a website (like LinkedIn or Indeed).
Your task is to extract the core requirements and fill out a JSON object accurately.

RULES:
1. `title`: The job title (e.g., 'Software Engineer'). If not found, use "".
2. `company`: The company name (e.g., 'Google'). If not found, use "".
3. `required_skills`: An array of MUST-HAVE technical skills or tools mentioned in the text.
4. `preferred_skills`: An array of NICE-TO-HAVE / PLUS / BONUS skills. If the text does not distinguish, put all core skills in `required_skills` and leave this empty.
5. `min_experience`: The minimum years of experience required as an integer. If not stated, return 0. (e.g., '3+ years' -> 3).
6. `degree_required`: The highest required degree (e.g., "Bachelor's", "Master's"). If not stated, use "".
7. `description`: Return the original raw text provided by the user so we don't lose the context. BUT strip out random website artifact words like "Apply on LinkedIn" or "27 days ago".

Return ONLY a valid JSON object matching the requested schema.
"""

    try:
        completion = await client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"RAW TEXT:\n{request.raw_text}"}
            ],
            response_format=JobDescriptionInput,
            temperature=0.1,
        )
        
        result = completion.choices[0].message.parsed
        return result

    except Exception as e:
        print(f"Error calling OpenAI AI extraction API: {e}")
        raise ValueError(f"Failed to parse job description: {str(e)}")


async def revise_document(request: ReviseRequest) -> ReviseResult:
    """
    Calls OpenAI to revise and improve a resume or cover letter.
    """
    if not client:
        raise ValueError("OPENAI_API_KEY is missing. Cannot revise document.")

    if not request.document_text or len(request.document_text.strip()) < 20:
        raise ValueError("Provided document text is too short to revise.")

    system_prompt = f"""
    You are an expert Executive Resume Writer and Career Coach.
    The user is providing the raw text of their {request.doc_type.replace('_', ' ')}.
    Your task is to comprehensively revise, polish, and improve this document.
    
    GUIDELINES:
    1. Fix all typos, grammar, and awkward phrasing.
    2. Enhance action verbs and impact statements.
    3. Ensure professional, confident, and concise tone.
    4. For resumes: Use strong bullet points and metrics where implied.
    5. For cover letters: Ensure a strong hook, alignment with standard conventions, and a persuasive closing.
    6. Return ONLY the finalized, revised text. Do not include markdown formatting like ```text, just the raw plain text.
    """

    try:
        completion = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"DOCUMENT TEXT:\n{request.document_text}"}
            ],
            temperature=0.3,
        )
        
        revised_text = completion.choices[0].message.content.strip()
        # Clean any accidental markdown wrappers 
        if revised_text.startswith("```"):
            lines = revised_text.splitlines()
            if len(lines) > 2:
                revised_text = "\n".join(lines[1:-1])

        return ReviseResult(revised_text=revised_text)

    except Exception as e:
        print(f"Error calling OpenAI AI revision API: {e}")
        raise ValueError(f"Failed to revise document: {str(e)}")

async def extract_resume_profile(request: ExtractProfileRequest) -> ExtractProfileResult:
    """
    Calls OpenAI to extract structured profile information from a raw resume text.
    Uses structured outputs to accurately pull name, skills, and multiple work experiences.
    """
    if not client:
        raise ValueError("OPENAI_API_KEY is missing.")

    if not request.raw_text or len(request.raw_text.strip()) < 50:
        raise ValueError("Resume text is too short to parse into a profile.")

    system_prompt = """
    You are an expert ATS (Applicant Tracking System) parser.
    Your task is to take the user's raw resume text and extract their professional profile accurately into the provided JSON schema.
    
    GUIDELINES:
    1. Extract the user's First Name and Last Name.
    2. Extract their Email address into `email` (leave blank if missing).
    3. Extract their Phone number into `phone` (leave blank if missing).
    4. Extract any LinkedIn link/username into `linkedin`.
    5. Extract any personal website or github into `portfolio`.
    6. Extract a comma-separated list of technical/hard skills into `skills`.
    7. Extract a comma-separated list of certifications into `certifications`.
    8. Extract degrees and colleges into `coursework`.
    9. Carefully structure EVERY work experience into the `experiences` array, breaking them down into:
       - company: The name of the employer
       - title: The specific job title held
       - location: The location and/or duration (e.g. "Boston, MA | 2018 - Present" or "Aug 2021 - Feb 2023")
       - description: The bullet points or paragraph describing the role's responsibilities and achievements. Include bullet points properly.
    10. Ensure everything matches the required response schema exactly.
    """

    try:
        completion = await client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"RAW RESUME TEXT:\n{request.raw_text}"}
            ],
            response_format=ExtractProfileResult,
            temperature=0.1,
        )
        return completion.choices[0].message.parsed
    except Exception as e:
        print(f"Error calling OpenAI AI profile extractor API: {e}")
        raise ValueError(f"Failed to extract structured profile: {str(e)}")
