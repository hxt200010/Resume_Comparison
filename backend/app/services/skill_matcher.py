"""
ATS Resume Screener - Skill Matcher
Matches resume skills against job requirements using the skills taxonomy.
Supports synonym normalization and basic fuzzy matching.
"""
import json
import os
import re
from pathlib import Path


# Load skills taxonomy on module import
_taxonomy = None


def _load_taxonomy() -> dict:
    """Load the skills taxonomy JSON file."""
    global _taxonomy
    if _taxonomy is None:
        taxonomy_path = Path(__file__).parent.parent / "data" / "skills_taxonomy.json"
        with open(taxonomy_path, "r", encoding="utf-8") as f:
            _taxonomy = json.load(f)
    return _taxonomy


def normalize_skill(skill: str) -> str:
    """
    Normalize a skill name using the synonym dictionary.
    Example: "JS" → "javascript", "ML" → "machine learning"
    """
    taxonomy = _load_taxonomy()
    synonyms = taxonomy.get("synonyms", {})
    skill_lower = skill.lower().strip()

    # Check if this skill IS a canonical name
    if skill_lower in synonyms:
        return skill_lower

    # Check if this skill is a synonym of something
    for canonical, aliases in synonyms.items():
        if skill_lower in [a.lower() for a in aliases]:
            return canonical

    return skill_lower


def extract_skills_from_text(text: str) -> list[str]:
    """
    Extract recognized skills from free text.
    Searches for all known skills and their synonyms in the text.
    """
    taxonomy = _load_taxonomy()
    text_lower = text.lower()
    found_skills = set()

    # Search for all canonical skill names
    all_skills = set()
    for category_skills in taxonomy.get("categories", {}).values():
        all_skills.update(category_skills)

    for skill in all_skills:
        # Check canonical name
        if _skill_in_text(skill, text_lower):
            found_skills.add(skill)
            continue

        # Check synonyms
        synonyms = taxonomy.get("synonyms", {}).get(skill, [])
        for synonym in synonyms:
            if _skill_in_text(synonym, text_lower):
                found_skills.add(skill)  # Store as canonical name
                break

    return sorted(list(found_skills))


def _skill_in_text(skill: str, text: str) -> bool:
    """Check if a skill appears in text, using word boundary matching."""
    # Escape special regex characters in the skill name
    escaped = re.escape(skill.lower())
    # Use word boundaries to avoid partial matches (e.g., "r" in "react")
    pattern = r"(?:^|[\s,;|/\(\)\[\]\-])(" + escaped + r")(?:[\s,;|/\(\)\[\]\-\.]|$)"
    return bool(re.search(pattern, text))


def match_skills(
    resume_skills: list[str],
    required_skills: list[str],
    preferred_skills: list[str],
) -> dict:
    """
    Compare resume skills against required and preferred skills.
    Returns matched/missing for each category.
    """
    # Normalize everything
    resume_normalized = set(normalize_skill(s) for s in resume_skills)
    required_normalized = [normalize_skill(s) for s in required_skills]
    preferred_normalized = [normalize_skill(s) for s in preferred_skills]

    # Find matches and misses
    matched_required = [s for s in required_normalized if s in resume_normalized]
    missing_required = [s for s in required_normalized if s not in resume_normalized]
    matched_preferred = [s for s in preferred_normalized if s in resume_normalized]
    missing_preferred = [s for s in preferred_normalized if s not in resume_normalized]

    # Calculate scores (0-100)
    required_score = (
        (len(matched_required) / len(required_normalized) * 100)
        if required_normalized else 100  # No requirements = full score
    )
    preferred_score = (
        (len(matched_preferred) / len(preferred_normalized) * 100)
        if preferred_normalized else 100
    )

    return {
        "matched_required": matched_required,
        "missing_required": missing_required,
        "matched_preferred": matched_preferred,
        "missing_preferred": missing_preferred,
        "required_score": round(required_score, 1),
        "preferred_score": round(preferred_score, 1),
        "all_matched": sorted(list(
            set(matched_required + matched_preferred)
        )),
    }


def get_skill_category(skill: str) -> str:
    """Get the category a skill belongs to."""
    taxonomy = _load_taxonomy()
    normalized = normalize_skill(skill)
    for category, skills in taxonomy.get("categories", {}).items():
        if normalized in skills:
            return category
    return "other"


def detect_degree(text: str) -> dict:
    """
    Detect degree levels mentioned in text.
    Returns the highest degree found and whether specific degrees are present.
    """
    taxonomy = _load_taxonomy()
    text_lower = text.lower()
    degree_levels = taxonomy.get("degree_levels", {})

    found_degrees = {}
    degree_hierarchy = ["phd", "masters", "bachelors", "associate"]

    for level in degree_hierarchy:
        patterns = degree_levels.get(level, [])
        # Check the level name itself and all its patterns
        all_patterns = [level] + patterns
        for pattern in all_patterns:
            if pattern.lower() in text_lower:
                found_degrees[level] = True
                break

    highest = None
    for level in degree_hierarchy:
        if found_degrees.get(level):
            highest = level
            break

    return {
        "highest_degree": highest,
        "has_phd": found_degrees.get("phd", False),
        "has_masters": found_degrees.get("masters", False),
        "has_bachelors": found_degrees.get("bachelors", False),
        "has_associate": found_degrees.get("associate", False),
    }
