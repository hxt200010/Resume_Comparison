"""
ATS Resume Screener - Supabase Database Client
Handles all cloud database operations.
"""
from supabase import create_client, Client
from app.config import SUPABASE_URL, SUPABASE_KEY
import json

# Initialize Supabase client
_client: Client | None = None


def get_client() -> Client:
    """Get or create the Supabase client singleton."""
    global _client
    if _client is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise ValueError(
                "Supabase credentials not configured. "
                "Please set SUPABASE_URL and SUPABASE_KEY in backend/.env"
            )
        _client = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _client


async def init_tables():
    """
    Ensure the required tables exist.
    If they don't exist, we'll create them via Supabase's auto-schema.
    NOTE: For production, run the CREATE TABLE SQL in Supabase Dashboard → SQL Editor.
    """
    # Tables are created via Supabase Dashboard SQL Editor
    # This function just verifies connectivity
    try:
        client = get_client()
        # Quick connectivity check
        client.table("analyses").select("id").limit(1).execute()
        return True
    except Exception as e:
        print(f"[DB] Warning: Could not connect to Supabase: {e}")
        print("[DB] The app will work but history won't be saved.")
        return False


async def save_analysis(data: dict) -> dict | None:
    """Save an analysis result to Supabase."""
    try:
        client = get_client()
        # Convert nested objects to JSON-serializable format
        insert_data = {
            "resume_name": data.get("resume_name", ""),
            "job_title": data.get("job_title", ""),
            "company": data.get("company", ""),
            "overall_score": data.get("overall_score", 0),
            "recommendation": data.get("recommendation", ""),
            "result": json.loads(json.dumps(data.get("result", {}), default=str)),
        }
        response = client.table("analyses").insert(insert_data).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        print(f"[DB] Error saving analysis: {e}")
        return None


async def get_history(limit: int = 20) -> list:
    """Fetch recent analysis history from Supabase."""
    try:
        client = get_client()
        response = (
            client.table("analyses")
            .select("*")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return response.data or []
    except Exception as e:
        print(f"[DB] Error fetching history: {e}")
        return []


async def delete_analysis(analysis_id: str) -> bool:
    """Delete an analysis record by ID."""
    try:
        client = get_client()
        client.table("analyses").delete().eq("id", analysis_id).execute()
        return True
    except Exception as e:
        print(f"[DB] Error deleting analysis: {e}")
        return False
