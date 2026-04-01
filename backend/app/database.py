"""
ATS Resume Screener - SQLAlchemy Database Client
Handles all local SQLite database operations.
"""
import os
import json
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import sessionmaker, declarative_base, relationship

DB_URL = "sqlite:///./ats.db"

engine = create_engine(DB_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ── DB Models ───────────────────────────────────────────

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    history = relationship("AnalysisHistory", back_populates="user")
    documents = relationship("Document", back_populates="user")
    profile = relationship("UserProfile", back_populates="user", uselist=False)


class UserProfile(Base):
    __tablename__ = "user_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    first_name = Column(String, default="")
    last_name = Column(String, default="")
    email = Column(String, default="")
    phone = Column(String, default="")
    linkedin = Column(String, default="")
    portfolio = Column(String, default="")
    resume_text = Column(Text, default="")
    experience = Column(Text, default="")
    certifications = Column(Text, default="")
    skills = Column(Text, default="")
    coursework = Column(Text, default="")

    user = relationship("User", back_populates="profile")


class Document(Base):
    """Stores saved resumes or cover letters (parsed text)."""
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    doc_type = Column(String, nullable=False) # "resume" or "cover_letter"
    name = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="documents")


class AnalysisHistory(Base):
    __tablename__ = "history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Currently optional for anonymous
    resume_name = Column(String)
    job_title = Column(String)
    company = Column(String)
    overall_score = Column(Float)
    recommendation = Column(String)
    result_json = Column(Text) # JSON string of the full AnalysisResult
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="history")


# ── Database Init ────────────────────────────────────────

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_tables():
    """Create all tables in the local SQLite db."""
    Base.metadata.create_all(bind=engine)
    print("[DB] Local SQLite Database Initialized.")
    return True


# ── Legacy Async Wrappers for History ─────────────────────
# (Updating existing functions to use sync SQLite instead of Supabase)

async def save_analysis(data: dict, user_id: int = None) -> dict | None:
    db = SessionLocal()
    try:
        entry = AnalysisHistory(
            user_id=user_id,
            resume_name=data.get("resume_name", ""),
            job_title=data.get("job_title", ""),
            company=data.get("company", ""),
            overall_score=data.get("overall_score", 0),
            recommendation=data.get("recommendation", ""),
            result_json=json.dumps(data.get("result", {}), default=str)
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return {"id": str(entry.id)}
    except Exception as e:
        print(f"[DB] Error saving analysis: {e}")
        return None
    finally:
        db.close()


async def get_history(limit: int = 20, user_id: int = None) -> list:
    db = SessionLocal()
    try:
        query = db.query(AnalysisHistory)
        if user_id:
            query = query.filter(AnalysisHistory.user_id == user_id)
        
        records = query.order_by(AnalysisHistory.created_at.desc()).limit(limit).all()
        
        # Format the output to match what frontend expects
        results = []
        for r in records:
            results.append({
                "id": str(r.id),
                "resume_name": r.resume_name,
                "job_title": r.job_title,
                "company": r.company,
                "overall_score": r.overall_score,
                "recommendation": r.recommendation,
                "created_at": r.created_at.isoformat() + "Z", # mock ISO UTC
                "result": json.loads(r.result_json) if r.result_json else None
            })
        return results
    except Exception as e:
        print(f"[DB] Error fetching history: {e}")
        return []
    finally:
        db.close()


async def delete_analysis(analysis_id: str, user_id: int = None) -> bool:
    db = SessionLocal()
    try:
        query = db.query(AnalysisHistory).filter(AnalysisHistory.id == int(analysis_id))
        if user_id:
            query = query.filter(AnalysisHistory.user_id == user_id)
            
        record = query.first()
        if not record:
            return False
            
        db.delete(record)
        db.commit()
        return True
    except Exception as e:
        print(f"[DB] Error deleting analysis: {e}")
        return False
    finally:
        db.close()
