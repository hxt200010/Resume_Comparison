"""
ATS Resume Screener - Explainer
Generates human-readable explanations, suggestions, and improvement tips.
"""


def generate_explanation(analysis: dict) -> str:
    """
    Generate a comprehensive explanation of why the resume matched or didn't.
    """
    score = analysis["overall_score"]
    recommendation = analysis["recommendation"]
    matched = analysis["matched_skills"]
    missing_req = analysis["missing_required"]
    missing_pref = analysis["missing_preferred"]
    breakdown = analysis["score_breakdown"]

    parts = []

    # Overall summary
    if recommendation == "Strong Match":
        parts.append(
            f"This resume is a strong match with an overall score of {score}/100. "
            "The candidate demonstrates relevant skills and experience that align well "
            "with the job requirements."
        )
    elif recommendation == "Moderate Match":
        parts.append(
            f"This resume is a moderate match with a score of {score}/100. "
            "The candidate has some relevant qualifications but is missing key areas "
            "that could strengthen their application."
        )
    elif recommendation == "Weak Match":
        parts.append(
            f"This resume is a weak match with a score of {score}/100. "
            "There are significant gaps between the candidate's profile and the "
            "job requirements."
        )
    else:
        parts.append(
            f"This resume does not appear to be a strong fit (score: {score}/100). "
            "The candidate may not pass an initial ATS screening for this position."
        )

    # Skills analysis
    if matched:
        parts.append(
            f"\n\nMatched Skills ({len(matched)}): The candidate has demonstrated "
            f"proficiency in {', '.join(matched[:10])}."
        )

    if missing_req:
        parts.append(
            f"\n\nMissing Required Skills ({len(missing_req)}): The following "
            f"must-have skills were not found: {', '.join(missing_req)}. "
            "These gaps could prevent the candidate from passing ATS screening."
        )

    if missing_pref:
        parts.append(
            f"\n\nMissing Preferred Skills ({len(missing_pref)}): The candidate is "
            f"also missing these nice-to-have skills: {', '.join(missing_pref)}."
        )

    # Score highlights
    bd = breakdown if isinstance(breakdown, dict) else breakdown.model_dump()
    high_scores = {k: v for k, v in bd.items() if v >= 70}
    low_scores = {k: v for k, v in bd.items() if v < 40}

    if high_scores:
        names = [k.replace("_score", "").replace("_", " ").title() for k in high_scores]
        parts.append(
            f"\n\nStrengths: {', '.join(names)}."
        )

    if low_scores:
        names = [k.replace("_score", "").replace("_", " ").title() for k in low_scores]
        parts.append(
            f"\n\nWeaknesses: {', '.join(names)}."
        )

    # Rejection reasons
    if analysis.get("rejection_reasons"):
        parts.append("\n\nRejection Flags:")
        for reason in analysis["rejection_reasons"]:
            parts.append(f"\n  • {reason}")

    return "".join(parts)


def generate_suggestions(analysis: dict) -> list[str]:
    """
    Generate actionable improvement suggestions based on the analysis.
    """
    suggestions = []
    missing_req = analysis["missing_required"]
    missing_pref = analysis["missing_preferred"]
    breakdown = analysis["score_breakdown"]
    bd = breakdown if isinstance(breakdown, dict) else breakdown.model_dump()

    # Missing required skills
    if missing_req:
        top_missing = missing_req[:5]
        suggestions.append(
            f"Add these required skills to your resume if you have experience with them: "
            f"{', '.join(top_missing)}"
        )

    # Low experience score
    if bd.get("experience_score", 0) < 50:
        suggestions.append(
            "Expand your experience section with more detail about relevant work. "
            "Use action verbs and quantify your achievements where possible."
        )

    # Low projects score
    if bd.get("projects_score", 0) < 30:
        suggestions.append(
            "Add relevant projects that demonstrate skills mentioned in the job description. "
            "Include technologies used and outcomes achieved."
        )

    # Low education score
    if bd.get("education_score", 0) < 50:
        suggestions.append(
            "Ensure your education section clearly states your degree, institution, "
            "and relevant coursework or certifications."
        )

    # Low keyword match
    if bd.get("keyword_match_score", 0) < 40:
        suggestions.append(
            "Tailor your resume language to mirror keywords from the job description. "
            "ATS systems often scan for exact terminology used in the posting."
        )

    # Low completeness
    if bd.get("completeness_score", 0) < 50:
        suggestions.append(
            "Your resume may be missing important sections. Ensure you include: "
            "Summary, Skills, Experience, Education, and Projects."
        )

    # Missing preferred skills
    if missing_pref and len(missing_pref) <= 5:
        suggestions.append(
            f"Consider adding preferred skills if applicable: {', '.join(missing_pref)}"
        )

    # General tips
    if analysis["overall_score"] < 50:
        suggestions.append(
            "Consider using a more targeted resume format that emphasizes the "
            "qualifications most relevant to this specific role."
        )

    if not suggestions:
        suggestions.append(
            "Your resume is well-aligned with this position. Consider minor "
            "optimizations like adding quantified achievements to strengthen your application."
        )

    return suggestions
