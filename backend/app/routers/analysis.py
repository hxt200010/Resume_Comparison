"""
ATS Resume Screener - Analysis Router
Handles resume-to-job matching and analysis.
"""
from fastapi import APIRouter, HTTPException
from app.models import AnalysisRequest, AnalysisResult
from app.services.scorer import calculate_overall_score
from app.services.explainer import generate_explanation, generate_suggestions
from app.database import save_analysis

router = APIRouter(tags=["Analysis"])


@router.post("/analyze-match", response_model=AnalysisResult)
async def analyze_match(request: AnalysisRequest):
    """
    Compare a parsed resume against a job description.
    
    Returns:
        AnalysisResult with scores, matched/missing skills, explanations, and suggestions.
    """
    resume = request.resume
    job = request.job

    # Validate input
    if not resume.raw_text and not resume.sections.skills:
        raise HTTPException(
            status_code=400,
            detail="Resume data is empty. Please parse a resume first."
        )

    if not job.description and not job.required_skills:
        raise HTTPException(
            status_code=400,
            detail="Please provide a job description or required skills."
        )

    # Run scoring pipeline
    try:
        result_data = calculate_overall_score(resume, job)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error during analysis: {str(e)}"
        )

    # Generate explanation and suggestions
    explanation = generate_explanation(result_data)
    suggestions = generate_suggestions(result_data)

    # Build result
    result = AnalysisResult(
        overall_score=result_data["overall_score"],
        recommendation=result_data["recommendation"],
        score_breakdown=result_data["score_breakdown"],
        matched_skills=result_data["matched_skills"],
        missing_required=result_data["missing_required"],
        missing_preferred=result_data["missing_preferred"],
        relevant_experience=result_data["relevant_experience"],
        relevant_projects=result_data["relevant_projects"],
        education_match=result_data["education_match"],
        explanation=explanation,
        suggestions=suggestions,
        rejection_reasons=result_data["rejection_reasons"],
        confidence=result_data["confidence"],
    )

    # Save to Supabase (non-blocking — don't fail if DB is down)
    try:
        await save_analysis({
            "resume_name": resume.file_name,
            "job_title": job.title or "Untitled",
            "company": job.company or "Unknown",
            "overall_score": result.overall_score,
            "recommendation": result.recommendation,
            "result": result.model_dump(),
        })
    except Exception as e:
        print(f"[API] Warning: Could not save to database: {e}")

    return result
