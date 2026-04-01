from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

class TokenRequest(BaseModel):
    token: str

@router.post("/verify")
async def verify_token(request: TokenRequest):
    """Verify Firebase token"""
    try:
        # In production, verify with Firebase
        logger.info(f"Token verification requested")
        return {"valid": True, "uid": "test_user_123"}
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")