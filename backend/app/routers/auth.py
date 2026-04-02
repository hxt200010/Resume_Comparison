"""
ATS Resume Screener - Auth API
Endpoints for register, login, and user profile data.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db, User, Document
from app.services.auth import verify_password, get_password_hash, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

class AuthData(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    email: str

class SavedDocument(BaseModel):
    id: int
    doc_type: str
    name: str
    content: str
    created_at: str

class UserProfile(BaseModel):
    id: int
    email: str
    documents: list[SavedDocument]


@router.post("/register", response_model=TokenResponse)
def register(data: AuthData, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    user = User(
        email=data.email,
        hashed_password=get_password_hash(data.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer", "email": user.email}


@router.post("/login", response_model=TokenResponse)
def login(data: AuthData, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
        
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer", "email": user.email}


class GoogleAuthData(BaseModel):
    token: str

@router.post("/google", response_model=TokenResponse)
def google_auth(data: GoogleAuthData, db: Session = Depends(get_db)):
    from google.oauth2 import id_token
    from google.auth.transport import requests
    from app.config import GOOGLE_CLIENT_ID
    import string
    import random

    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google Login is not configured on the server.")

    try:
        # Verify the Google token
        idinfo = id_token.verify_oauth2_token(data.token, requests.Request(), GOOGLE_CLIENT_ID)
        
        email = idinfo.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="Google token did not provide an email.")
            
        # Optional: You can also use idinfo.get("name"), idinfo.get("picture"), etc.

        # Find or create user
        user = db.query(User).filter(User.email == email).first()
        if not user:
            # Create a user with a random unsable password since they use Google
            random_pw = ''.join(random.choices(string.ascii_letters + string.digits, k=32))
            user = User(
                email=email,
                hashed_password=get_password_hash(random_pw)
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # Generate our own application JWT token
        access_token = create_access_token(data={"sub": str(user.id)})
        return {"access_token": access_token, "token_type": "bearer", "email": user.email}

    except ValueError:
        # Invalid token
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token",
        )


@router.get("/me", response_model=UserProfile)
def read_users_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Load documents
    docs = db.query(Document).filter(Document.user_id == current_user.id).all()
    formatted_docs = [
        SavedDocument(
            id=d.id, doc_type=d.doc_type, name=d.name, content=d.content, created_at=str(d.created_at)
        ) for d in docs
    ]
    
    return UserProfile(
        id=current_user.id,
        email=current_user.email,
        documents=formatted_docs
    )


class SaveDocumentRequest(BaseModel):
    doc_type: str # "resume" or "cover_letter"
    name: str
    content: str

@router.post("/save-document", tags=["Profile"])
def save_document(req: SaveDocumentRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Save parsed resume or cover letter text to profile."""
    if req.doc_type not in ["resume", "cover_letter"]:
        raise HTTPException(status_code=400, detail="doc_type must be resume or cover_letter")
        
    doc = Document(
        user_id=current_user.id,
        doc_type=req.doc_type,
        name=req.name,
        content=req.content
    )
    db.add(doc)
    db.commit()
    return {"message": f"{req.doc_type} saved successfully!"}

@router.delete("/document/{doc_id}", tags=["Profile"])
def delete_document(doc_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete a saved document from the user's profile."""
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    db.delete(doc)
    db.commit()
    return {"message": "Document deleted successfully"}
