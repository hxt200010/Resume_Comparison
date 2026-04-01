from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db, User, UserProfile
from app.services.auth import get_current_user
from app.models import UserProfileSchema, UserProfileUpdate

router = APIRouter(prefix="/profile", tags=["Profile"])

@router.get("", response_model=UserProfileSchema)
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@router.put("", response_model=UserProfileSchema)
def update_profile(updates: UserProfileUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)

    if updates.resume_text is not None:
        profile.resume_text = updates.resume_text
    if updates.experience is not None:
        profile.experience = updates.experience
    if updates.certifications is not None:
        profile.certifications = updates.certifications
    if updates.skills is not None:
        profile.skills = updates.skills
    if updates.coursework is not None:
        profile.coursework = updates.coursework

    db.commit()
    db.refresh(profile)
    return profile
