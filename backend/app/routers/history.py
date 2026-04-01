"""
ATS Resume Screener - History Router
Handles analysis history stored in Supabase.
"""
from fastapi import APIRouter, Depends
from app.database import get_history, delete_analysis, User
from app.services.auth import get_current_user_optional

router = APIRouter(tags=["History"])


@router.get("/history")
async def list_history(limit: int = 20, current_user: User = Depends(get_current_user_optional)):
    """Get recent analysis history from SQLite."""
    user_id = current_user.id if current_user else None
    history = await get_history(limit=limit, user_id=user_id)
    return {"history": history}


@router.delete("/history/{analysis_id}")
async def remove_analysis(analysis_id: str, current_user: User = Depends(get_current_user_optional)):
    """Delete a specific analysis from history."""
    user_id = current_user.id if current_user else None
    success = await delete_analysis(analysis_id, user_id=user_id)
    return {"success": success}
