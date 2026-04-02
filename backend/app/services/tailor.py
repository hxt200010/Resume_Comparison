"""
ATS Resume Screener - AI Tailoring Service
Uses OpenAI to rewrite resume sections to better match the job description.
"""
import os
from openai import AsyncOpenAI
from app.config import OPENAI_API_KEY
from app.models import TailorRequest, TailorResult, TailoredBullet, TailorCoverLetterRequest, TailorCoverLetterResult

# Initialize async client if key exists
client = AsyncOpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None


async def tailor_resume(request: TailorRequest) -> TailorResult:
    """
    Calls OpenAI to rewrite the professional summary and experience bullet points
    to naturally incorporate missing skills from the job description.
    """
    if not client:
        raise ValueError("OPENAI_API_KEY is missing. Cannot tailor resume.")

    # Proceed to tailor even if there are no missing skills, to optimize for ATS algorithms.

    # Prepare the prompt
    missing_skills_str = ", ".join(request.missing_skills)
    job_title = request.job.title or "the requested job role"
    # Gather all bullet points from all resume sections
    all_sections_text = ""
    if request.resume.sections.experience:
        all_sections_text += f"\n--- EXPERIENCE ---\n{request.resume.sections.experience}\n"
    if request.resume.sections.projects:
        all_sections_text += f"\n--- PROJECTS ---\n{request.resume.sections.projects}\n"
    if request.resume.sections.education:
        all_sections_text += f"\n--- EDUCATION ---\n{request.resume.sections.education}\n"
    if request.resume.sections.certifications:
        all_sections_text += f"\n--- CERTIFICATIONS ---\n{request.resume.sections.certifications}\n"
        
    original_bullets = [
        line.strip("-•* \t") 
        for line in all_sections_text.split("\n") 
        if line.strip("-•* \t") and len(line.strip()) > 10
    ]

    system_prompt = f"""
You are an expert Resume Writer and ATS Optimizer.
Your task is to tailor a candidate's resume for a '{job_title}' position.
The candidate is missing these crucial keywords: {missing_skills_str}

CRITICAL RULES:
1. Do NOT lie or invent experience they do not have.
2. AGGRESSIVELY RESTRUCTURE and REWRITE their bullet points to heavily feature the missing keywords and align closely with the target job description. Your ultimate goal is to maximize their ATS match score!
3. Ensure every single missing keyword is flawlessly woven into either the Professional Summary or the Experience bullet points. Use standard industry phrasing to hit the scanner's exact phrase checks.
4. Replace weak verbs with strong action verbs. Make sure the resume sounds exceptionally premium and highly tailored for this exact target role.
5. Create a 'tailored_skills' list that combines their ORIGINAL SKILLS with the missing keywords that are relevant to their profile.
6. LENGTH LIMIT: Keep the entire output as concise as possible, restricting the total length to exactly ONE page if possible. If the candidate has extensive career history naturally warranting 2 pages, limit the output strictly to TWO pages maximum. Be ruthless with word economy.
7. For each bullet point you rewrite, explicitly populate the `context` field with the Job Title and Company (or closest associated heading) that it belonged to in the original resume text. e.g., 'Python Developer at BAOVIET LLC'.
8. Return ONLY a valid JSON object matching the requested schema. No markdown wrapping.
"""

    existing_skills = ", ".join(request.resume.skills_found) if request.resume.skills_found else request.resume.sections.skills
    
    user_message = f"""
ORIGINAL SKILLS:
{existing_skills or 'No skills provided.'}

ORIGINAL PROFESSIONAL SUMMARY:
{request.resume.sections.summary or 'No summary provided.'}

ORIGINAL RESUME BULLETS:
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
3. Compare the job posting with the candidate's existing cover letter layout and the candidate's provided resume data.
4. Smoothly rewrite and weave in the required keywords and experiences from the user's resume so that it directly matches the job posting. Use the resume to pull facts about the candidate that were not present in the original cover letter.
5. Preserve the candidate's original voice, tone, and contact structure from the existing cover letter.
6. Return ONLY a valid JSON object matching the requested schema. No markdown wrapping. Write down as human like language as possible.
"""

    user_message = f"""
ORIGINAL COVER LETTER:
{request.cover_letter_text}

RESUME DATA:
{request.resume.raw_text if request.resume else 'No resume provided.'}

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
