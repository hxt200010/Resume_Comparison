"""
ATS Resume Screener - Scorer
Computes the overall match score using weighted sub-scores.
Implements reject logic for missing must-have requirements.
"""
from app.config import SCORING_WEIGHTS, THRESHOLDS, REQUIRED_SKILLS_REJECT_THRESHOLD
from app.models import ScoreBreakdown, ParsedResume, JobDescriptionInput
from app.services.skill_matcher import (
    match_skills,
    extract_skills_from_text,
    detect_degree,
)


def compute_keyword_overlap(resume_text: str, job_text: str) -> float:
    """
    Compute simple keyword overlap between resume and job description.
    Returns a score from 0 to 100.
    """
    if not resume_text or not job_text:
        return 0.0

    # Extract meaningful words (3+ chars, no stopwords)
    stopwords = {
        "the", "and", "for", "are", "but", "not", "you", "all", "can",
        "had", "her", "was", "one", "our", "out", "has", "have", "been",
        "will", "with", "this", "that", "from", "they", "been", "said",
        "each", "which", "their", "then", "them", "these", "some", "would",
        "make", "like", "into", "could", "time", "very", "when", "come",
        "made", "about", "after", "also", "back", "work", "year", "must",
        "should", "able", "using", "used", "such", "more", "other",
    }

    def get_words(text):
        words = set()
        for word in text.lower().split():
            # Clean punctuation
            clean = "".join(c for c in word if c.isalnum())
            if len(clean) >= 3 and clean not in stopwords:
                words.add(clean)
        return words

    resume_words = get_words(resume_text)
    job_words = get_words(job_text)

    if not job_words:
        return 0.0

    overlap = resume_words & job_words
    score = len(overlap) / len(job_words) * 100
    return min(score, 100.0)


def compute_experience_score(
    resume_text: str,
    job_description: str,
    min_experience: int = 0,
) -> tuple[float, list[str]]:
    """
    Score experience relevance.
    Looks for job-related keywords in experience section.
    Returns (score, relevant_snippets).
    """
    if not resume_text:
        return 0.0, []

    # Extract key phrases from job description
    job_keywords = set()
    for word in job_description.lower().split():
        clean = "".join(c for c in word if c.isalnum())
        if len(clean) >= 4:
            job_keywords.add(clean)

    # Find relevant experience lines
    relevant_snippets = []
    lines = resume_text.split("\n")
    for line in lines:
        line_stripped = line.strip()
        if len(line_stripped) < 10:
            continue
        line_lower = line_stripped.lower()
        matches = sum(1 for kw in job_keywords if kw in line_lower)
        if matches >= 2:  # At least 2 keyword matches
            relevant_snippets.append(line_stripped)

    # Score based on number of relevant snippets
    if not relevant_snippets:
        score = 10.0  # Minimum score even without explicit matches
    else:
        score = min(len(relevant_snippets) * 15, 100.0)

    return round(score, 1), relevant_snippets[:5]  # Return top 5


def compute_projects_score(
    projects_text: str,
    job_description: str,
) -> tuple[float, list[str]]:
    """
    Score project relevance.
    Returns (score, relevant_snippets).
    """
    if not projects_text:
        return 0.0, []

    job_keywords = set()
    for word in job_description.lower().split():
        clean = "".join(c for c in word if c.isalnum())
        if len(clean) >= 4:
            job_keywords.add(clean)

    relevant_snippets = []
    lines = projects_text.split("\n")
    for line in lines:
        line_stripped = line.strip()
        if len(line_stripped) < 10:
            continue
        line_lower = line_stripped.lower()
        matches = sum(1 for kw in job_keywords if kw in line_lower)
        if matches >= 1:
            relevant_snippets.append(line_stripped)

    if not relevant_snippets:
        score = 0.0
    else:
        score = min(len(relevant_snippets) * 20, 100.0)

    return round(score, 1), relevant_snippets[:5]


def compute_education_score(
    education_text: str,
    degree_required: str,
) -> tuple[float, str]:
    """
    Score education match.
    Returns (score, match_description).
    """
    if not education_text:
        return 0.0, "No education section found"

    degree_info = detect_degree(education_text)
    highest = degree_info["highest_degree"]

    if not degree_required:
        # No specific requirement — give credit for having education
        if highest:
            return 100.0, f"Has {highest} degree"
        return 50.0, "Education section present but no degree detected"

    # Check if requirement is met
    requirement = degree_required.lower().strip()
    hierarchy = {"associate": 1, "bachelors": 2, "masters": 3, "phd": 4}

    required_level = 0
    for level_name, level_num in hierarchy.items():
        if level_name in requirement or requirement in level_name:
            required_level = level_num
            break

    actual_level = hierarchy.get(highest, 0) if highest else 0

    if actual_level >= required_level:
        return 100.0, f"Meets requirement: has {highest} (required: {degree_required})"
    elif actual_level > 0:
        return 50.0, f"Has {highest} but {degree_required} required"
    else:
        return 20.0, f"No recognized degree found ({degree_required} required)"


def compute_completeness_score(resume_text: str, sections) -> float:
    """
    Score resume completeness.
    Rewards resumes with more filled sections and adequate length.
    """
    score = 0.0

    # Check length (200+ words is reasonable)
    word_count = len(resume_text.split())
    if word_count > 200:
        score += 30
    elif word_count > 100:
        score += 20
    else:
        score += 10

    # Check sections filled
    section_dict = sections.model_dump() if hasattr(sections, 'model_dump') else sections
    filled = sum(1 for v in section_dict.values() if v and len(str(v)) > 5)
    score += min(filled * 10, 70)

    return min(score, 100.0)


def calculate_overall_score(
    resume: ParsedResume,
    job: JobDescriptionInput,
) -> dict:
    """
    Main scoring pipeline.
    Combines all sub-scores with configured weights.
    Returns complete analysis data.
    """
    # ── Step 1: Extract skills from resume text ──
    all_resume_skills = extract_skills_from_text(resume.raw_text)
    # Also include any skills the user already found
    all_resume_skills = list(set(all_resume_skills + resume.skills_found))

    # Fallback: dynamically check if any required/preferred skills exist verbatim in the text
    # This prevents the scorer from missing skills that aren't defined in the static taxonomy.
    import re
    raw_lower = resume.raw_text.lower()
    for skill in (job.required_skills + job.preferred_skills):
        skill_lower = skill.lower().strip()
        if not skill_lower:
            continue
        escaped = re.escape(skill_lower)
        pattern = r"(?:^|[\s,;/|()\[\]\-])(" + escaped + r")(?:[\s,;/|()\[\]\-.]|$)"
        if re.search(pattern, raw_lower) and skill not in all_resume_skills:
            all_resume_skills.append(skill)
            
    # ── Step 1.5: Atomic Skill Extraction (ATS Emulation) ──
    # If the user pasted sentences instead of atomic tags, shred them into canonical tags.
    expanded_required = []
    for req in job.required_skills:
        extracted = extract_skills_from_text(req)
        if extracted:
            expanded_required.extend(extracted)
        else:
            expanded_required.append(req)
            
    expanded_preferred = []
    for pref in job.preferred_skills:
        extracted = extract_skills_from_text(pref)
        if extracted:
            expanded_preferred.extend(extracted)
        else:
            expanded_preferred.append(pref)

    # Deduplicate
    job.required_skills = list(dict.fromkeys(expanded_required))
    job.preferred_skills = list(dict.fromkeys(expanded_preferred))

    # ── Step 2: Match skills ──
    skill_result = match_skills(
        resume_skills=all_resume_skills,
        required_skills=job.required_skills,
        preferred_skills=job.preferred_skills,
    )

    # ── Step 3: Compute sub-scores ──
    keyword_score = compute_keyword_overlap(resume.raw_text, job.description)

    experience_score, experience_snippets = compute_experience_score(
        resume.sections.experience,
        job.description,
        job.min_experience or 0,
    )

    projects_score, project_snippets = compute_projects_score(
        resume.sections.projects,
        job.description,
    )

    education_score, education_match = compute_education_score(
        resume.sections.education,
        job.degree_required or "",
    )

    completeness_score = compute_completeness_score(
        resume.raw_text, resume.sections
    )

    # ── Step 4: Build score breakdown ──
    breakdown = ScoreBreakdown(
        required_skills_score=skill_result["required_score"],
        preferred_skills_score=skill_result["preferred_score"],
        experience_score=experience_score,
        projects_score=projects_score,
        education_score=education_score,
        keyword_match_score=round(keyword_score, 1),
        completeness_score=round(completeness_score, 1),
    )

    # ── Step 5: Calculate weighted overall score ──
    weights = SCORING_WEIGHTS
    overall = (
        breakdown.required_skills_score * weights["required_skills"]
        + breakdown.preferred_skills_score * weights["preferred_skills"]
        + breakdown.experience_score * weights["experience"]
        + breakdown.projects_score * weights["projects"]
        + breakdown.education_score * weights["education"]
        + breakdown.keyword_match_score * weights["keyword_match"]
        + breakdown.completeness_score * weights["completeness"]
    )
    overall = round(min(overall, 100.0), 1)

    # ── Step 6: Apply reject logic ──
    rejection_reasons = []

    # Check required skills threshold
    if job.required_skills:
        missing_ratio = len(skill_result["missing_required"]) / len(job.required_skills)
        if missing_ratio >= REQUIRED_SKILLS_REJECT_THRESHOLD:
            rejection_reasons.append(
                f"Missing {len(skill_result['missing_required'])} of "
                f"{len(job.required_skills)} required skills "
                f"({skill_result['missing_required']})"
            )
            overall = min(overall, 24)  # Cap at Reject level

    # Check experience requirement
    if job.min_experience and job.min_experience > 0:
        from app.services.parser import extract_years_of_experience
        detected_years = extract_years_of_experience(resume.raw_text)
        if detected_years < job.min_experience:
            rejection_reasons.append(
                f"Minimum {job.min_experience} years experience required, "
                f"detected approximately {detected_years} years"
            )
            overall = max(overall - 15, 0)

    # Check degree requirement
    if job.degree_required and education_score < 50:
        rejection_reasons.append(
            f"Required degree/certification not found: {job.degree_required}"
        )

    # ── Step 7: Determine recommendation ──
    if rejection_reasons and overall < THRESHOLDS["weak_match"]:
        recommendation = "Reject / Not Relevant"
    elif overall >= THRESHOLDS["strong_match"]:
        recommendation = "Strong Match"
    elif overall >= THRESHOLDS["moderate_match"]:
        recommendation = "Moderate Match"
    elif overall >= THRESHOLDS["weak_match"]:
        recommendation = "Weak Match"
    else:
        recommendation = "Reject / Not Relevant"

    # ── Step 8: Confidence score ──
    # Higher confidence when we have more data to work with
    data_points = 0
    if resume.sections.skills: data_points += 1
    if resume.sections.experience: data_points += 1
    if resume.sections.education: data_points += 1
    if resume.sections.projects: data_points += 1
    if job.required_skills: data_points += 1
    if job.description and len(job.description) > 50: data_points += 1
    confidence = round(min(data_points / 6 * 100, 100), 1)

    return {
        "overall_score": overall,
        "recommendation": recommendation,
        "score_breakdown": breakdown,
        "matched_skills": skill_result["all_matched"],
        "missing_required": skill_result["missing_required"],
        "missing_preferred": skill_result["missing_preferred"],
        "relevant_experience": experience_snippets,
        "relevant_projects": project_snippets,
        "education_match": education_match,
        "rejection_reasons": rejection_reasons,
        "confidence": confidence,
        "resume_skills_found": all_resume_skills,
    }
