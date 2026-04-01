"""
Tests for the skill matcher service.
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.skill_matcher import (
    normalize_skill,
    extract_skills_from_text,
    match_skills,
    detect_degree,
)


def test_normalize_skill_canonical():
    """Test that canonical names are returned as-is."""
    assert normalize_skill("Python") == "python"
    assert normalize_skill("JavaScript") == "javascript"


def test_normalize_skill_synonym():
    """Test that synonyms are normalized to canonical names."""
    assert normalize_skill("JS") == "javascript"
    assert normalize_skill("ML") == "machine learning"
    assert normalize_skill("k8s") == "kubernetes"
    assert normalize_skill("ts") == "typescript"


def test_extract_skills_basic():
    """Test basic skill extraction from text."""
    text = "Experienced in Python, JavaScript, React, and Docker."
    skills = extract_skills_from_text(text)
    assert "python" in skills
    assert "javascript" in skills
    assert "react" in skills
    assert "docker" in skills


def test_match_skills_full_match():
    """Test when all required skills are present."""
    result = match_skills(
        resume_skills=["python", "javascript", "react"],
        required_skills=["Python", "React"],
        preferred_skills=["JavaScript"],
    )
    assert result["required_score"] == 100.0
    assert result["preferred_score"] == 100.0
    assert len(result["missing_required"]) == 0


def test_match_skills_partial_match():
    """Test when some skills are missing."""
    result = match_skills(
        resume_skills=["python", "react"],
        required_skills=["Python", "React", "Docker", "Java"],
        preferred_skills=["AWS"],
    )
    assert result["required_score"] == 50.0
    assert len(result["missing_required"]) == 2
    assert "docker" in result["missing_required"]


def test_detect_degree_bachelors():
    """Test degree detection for bachelor's."""
    text = "Bachelor of Science in Computer Science, State University, 2020"
    result = detect_degree(text)
    assert result["highest_degree"] == "bachelors"
    assert result["has_bachelors"] is True


def test_detect_degree_masters():
    """Test degree detection for master's."""
    text = "M.S. in Data Science, MIT, 2022"
    result = detect_degree(text)
    assert result["highest_degree"] == "masters"
    assert result["has_masters"] is True


def test_match_with_synonyms():
    """Test that synonyms are properly matched."""
    result = match_skills(
        resume_skills=["javascript"],  # canonical form
        required_skills=["JS"],        # synonym
        preferred_skills=[],
    )
    assert result["required_score"] == 100.0
    assert len(result["missing_required"]) == 0
