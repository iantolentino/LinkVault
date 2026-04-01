from fastapi import APIRouter, HTTPException, Depends, Header, Body
from typing import List, Optional
import logging
from firebase_admin import auth as firebase_auth
from app.models import Category, Link
from app.database import db

router = APIRouter()
logger = logging.getLogger(__name__)

async def get_current_user(authorization: Optional[str] = Header(None)):
    """Extract and validate real Firebase user token"""
    if not authorization or not authorization.startswith("Bearer "):
        logger.warning("Auth failed: Missing or malformed header")
        raise HTTPException(status_code=401, detail="Invalid or missing authorization header")
    
    try:
        token = authorization.split("Bearer ")[1]
        # Verify the ID token using Firebase Admin SDK
        decoded_token = firebase_auth.verify_id_token(token)
        # Return the unique Firebase UID (string)
        return decoded_token["uid"]
    except Exception as e:
        logger.error(f"Firebase Auth Error: {e}")
        raise HTTPException(status_code=401, detail="Invalid authentication token")

@router.get("/")
async def get_categories(user_id: str = Depends(get_current_user)):
    """Fetch categories ONLY for the specific Firebase user_id"""
    try:
        user_categories = await db.get_categories(user_id)
        return user_categories
    except Exception as e:
        logger.error(f"Error fetching categories for {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Could not fetch data")

@router.post("/")
async def create_category(
    category: Category,
    user_id: str = Depends(get_current_user)
):
    try:
        # Pass the verified user_id to the database helper
        await db.get_or_create_user(user_id)
        new_category = await db.create_category(user_id, category.name)
        return {"message": "Category created", "category": new_category}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating category: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/{category_name}")
async def update_category(
    category_name: str,
    category: Category, # The frontend sends {"name": "New Name"}
    user_id: str = Depends(get_current_user)
):
    """Rename a category securely"""
    try:
        # Renames category WHERE user_id = user_id AND name = category_name
        await db.update_category(user_id, category_name, category.name)
        return {"message": "Category updated successfully"}
    except Exception as e:
        logger.error(f"Error updating category: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/{category_name}")
async def delete_category(
    category_name: str,
    user_id: str = Depends(get_current_user)
):
    try:
        await db.delete_category(user_id, category_name)
        return {"message": "Category deleted"}
    except Exception as e:
        logger.error(f"Error deleting category: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/{category_name}/links")
async def add_link(
    category_name: str,
    link: Link,
    user_id: str = Depends(get_current_user)
):
    try:
        await db.add_link(user_id, category_name, link.title, link.url)
        return {"message": "Link added"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error adding link: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")