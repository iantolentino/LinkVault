from fastapi import APIRouter, HTTPException, Depends, Header
from typing import List, Optional
import logging
from app.models import Category, Link
from app.database import get_db, db

router = APIRouter()
logger = logging.getLogger(__name__)

async def get_current_user(authorization: Optional[str] = Header(None)):
    """Extract and validate user token"""
    if not authorization:
        raise HTTPException(status_code=401, detail="No authorization header")
    
    try:
        token = authorization.replace("Bearer ", "")
        # In production, verify with Firebase
        # For now, return test user
        return "test_user_123"
    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

@router.get("/")
async def get_categories(user_id: str = Depends(get_current_user)):
    """Get all categories for a user"""
    try:
        categories = await db.get_categories(user_id)
        return categories
    except Exception as e:
        logger.error(f"Error getting categories: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/")
async def create_category(
    category: Category,
    user_id: str = Depends(get_current_user)
):
    """Create a new category"""
    try:
        await db.get_or_create_user(user_id)  # Ensure user exists
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
    category: Category,
    user_id: str = Depends(get_current_user)
):
    """Update a category (rename)"""
    try:
        # Update the category name in database
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
    """Delete a category"""
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
    """Add a link to a category"""
    try:
        await db.add_link(user_id, category_name, link.title, link.url)
        return {"message": "Link added"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error adding link: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")