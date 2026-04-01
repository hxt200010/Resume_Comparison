"""
ATS Resume Screener - History Router
Handles analysis history stored in Supabase.
"""
from fastapi import APIRouter
from app.database import get_history, delete_analysis

router = APIRouter(tags=["History"])


@router.get("/history")
async def list_history(limit: int = 20):
    """Get recent analysis history from Supabase."""
    history = await get_history(limit=limit)
    return {"history": history}


@router.delete("/history/{analysis_id}")
async def remove_analysis(analysis_id: str):
    """Delete a specific analysis from history."""
    success = await delete_analysis(analysis_id)
    return {"success": success}
