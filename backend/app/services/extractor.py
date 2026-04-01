"""
ATS Resume Screener - AI Job Extractor Service
Uses OpenAI to parse raw job descriptions into structured data.
"""
from typing import Optional
from openai import AsyncOpenAI
from app.config import OPENAI_API_KEY
from app.models import JobDescriptionInput, ExtractJobRequest

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
