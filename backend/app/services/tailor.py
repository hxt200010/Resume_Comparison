"""
ATS Resume Screener - AI Tailoring Service
Uses OpenAI to rewrite resume sections to better match the job description.
"""
import os
from openai import AsyncOpenAI
from app.config import OPENAI_API_KEY
from app.models import TailorRequest, TailorResult, TailoredExperience, TailorCoverLetterRequest, TailorCoverLetterResult

# Initialize async client if key exists
client = AsyncOpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None


async def tailor_resume(request: TailorRequest) -> TailorResult:
    """
    Calls OpenAI to rewrite the professional summary and experience bullet points
    to naturally incorporate missing skills from the job description.
    """
    if not client:
        raise ValueError("OPENAI_API_KEY is missing. Cannot tailor resume.")

    if not request.missing_skills:
        return TailorResult(
            professional_summary="No missing skills to inject! Your resume is already highly optimized.",
            experience_bullets=[]
        )

    # Prepare the prompt
    missing_skills_str = ", ".join(request.missing_skills)
    job_title = request.job.title or "the requested job role"
    
    # We split experience by lines to treat them as independent bullets
    original_bullets = [
        line.strip("-•* \t") 
        for line in request.resume.sections.experience.split("\n") 
        if line.strip("-•* \t") and len(line.strip()) > 10
    ]

    system_prompt = f"""
You are an expert Resume Writer and ATS Optimizer.
Your task is to tailor a candidate's resume for a '{job_title}' position.
The candidate is missing these crucial keywords: {missing_skills_str}

CRITICAL RULES:
1. Do NOT lie or invent experience they do not have.
2. Only weave in a missing keyword if it logically fits into their existing experience or summary.
3. Write a compelling, concise Professional Summary that positions them well.
4. Rewrite their existing experience bullet points to be stronger (using action verbs and metrics) and naturally include the missing keywords where appropriate.
5. LENGTH LIMIT: Keep the entire output as concise as possible, restricting the total length to exactly ONE page if possible. If the candidate has extensive career history naturally warranting 2 pages, limit the output strictly to TWO pages maximum. Be ruthless with word economy.
6. Return ONLY a valid JSON object matching the requested schema. No markdown wrapping.
"""

    user_message = f"""
ORIGINAL PROFESSIONAL SUMMARY:
{request.resume.sections.summary or 'No summary provided.'}

ORIGINAL EXPERIENCE BULLETS:
{chr(10).join('- ' + b for b in original_bullets)}
"""

    try:
        # We use the new structured outputs feature (beta.chat.completions.parse)
        completion = await client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            response_format=TailorResult,
            temperature=0.4,
        )
        
        result = completion.choices[0].message.parsed
        return result

    except Exception as e:
        print(f"Error calling OpenAI for tailoring: {e}")
        raise

async def tailor_cover_letter(request: TailorCoverLetterRequest) -> TailorCoverLetterResult:
    """
    Calls OpenAI to rewrite the user's cover letter based on the provided job description.
    """
    if not client:
        raise ValueError("OPENAI_API_KEY is missing. Cannot tailor cover letter.")

    job_title = request.job.title or "the requested job role"
    job_company = request.job.company or "the target company"
    
    system_prompt = f"""
You are an expert Career Coach and Professional Writer. 
Your task is to tailor a candidate's existing cover letter for a '{job_title}' position at '{job_company}'.

CRITICAL RULES:
1. Write like a human, not too AI-alike. Be engaging, authentic, and passionate. Avoid clichés.
2. Carefully analyze the job description to find the most important required skills.
3. Compare the job posting with the candidate's existing cover letter layout.
4. Smoothly rewrite and weave in the required keywords and experiences so that it directly matches the job posting.
5. Preserve the candidate's original voice, tone, and contact structure.
6. Return ONLY a valid JSON object matching the requested schema. No markdown wrapping.
"""

    user_message = f"""
ORIGINAL COVER LETTER:
{request.cover_letter_text}

JOB DESCRIPTION:
{request.job.description}
"""

    try:
        response = await client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            response_format=TailorCoverLetterResult,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0.7,
            max_tokens=1500
        )
        return response.choices[0].message.parsed
    except Exception as e:
        print(f"Error calling OpenAI for cover letter tailoring: {e}")
        raise
