"""
Tests for the scorer service.
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.scorer import (
    compute_keyword_overlap,
    compute_completeness_score,
    compute_education_score,
)
from app.models import ParsedSections


def test_keyword_overlap_high():
    """Test keyword overlap with similar texts."""
    resume = "Python developer with React JavaScript experience building web applications"
    job = "Looking for Python developer with React JavaScript web application experience"
    score = compute_keyword_overlap(resume, job)
    assert score > 50.0


def test_keyword_overlap_low():
    """Test keyword overlap with very different texts."""
    resume = "Experienced chef specializing in French cuisine and pastry arts"
    job = "Looking for Python developer with React experience"
    score = compute_keyword_overlap(resume, job)
    assert score < 30.0


def test_keyword_overlap_empty():
    """Test keyword overlap with empty strings."""
    assert compute_keyword_overlap("", "some job") == 0.0
    assert compute_keyword_overlap("some resume", "") == 0.0


def test_education_score_matches():
    """Test education scoring when degree matches requirement."""
    score, desc = compute_education_score(
        "Bachelor of Science in Computer Science, 2020",
        "bachelors"
    )
    assert score == 100.0


def test_education_score_exceeds():
    """Test education scoring when degree exceeds requirement."""
    score, desc = compute_education_score(
        "Master of Science in Computer Science, 2022",
        "bachelors"
    )
    assert score == 100.0


def test_education_score_below():
    """Test education scoring when degree is below requirement."""
    score, desc = compute_education_score(
        "Bachelor of Science in CS, 2020",
        "masters"
    )
    assert score == 50.0


def test_completeness_long_resume():
    """Test completeness with a well-filled resume."""
    sections = ParsedSections(
        contact="email@test.com",
        summary="Experienced developer with 5 years of experience",
        skills="Python, JavaScript, React, Docker",
        experience="Built web apps at Tech Corp for 3 years",
        education="BS in Computer Science from State University",
        projects="E-commerce platform using Next.js and Supabase",
        certifications="AWS Certified Cloud Practitioner",
    )
    text = " ".join(["word"] * 300)  # 300 words
    score = compute_completeness_score(text, sections)
    assert score >= 70.0


def test_completeness_short_resume():
    """Test completeness with a sparse resume."""
    sections = ParsedSections(
        contact="email@test.com",
        summary="",
        skills="",
        experience="",
        education="",
        projects="",
        certifications="",
    )
    text = "Short resume with few words"  # Very short
    score = compute_completeness_score(text, sections)
    assert score < 50.0
