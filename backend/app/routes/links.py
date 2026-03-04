from fastapi import APIRouter, HTTPException, Depends
from typing import List
import logging
from app.models import Link
from app.database import db
from .categories import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)

@router.delete("/{category_name}/links/{link_title}")
async def delete_link(
    category_name: str,
    link_title: str,
    user_id: str = Depends(get_current_user)
):
    """Delete a link from a category"""
    try:
        # Get all categories for user
        categories = await db.get_categories(user_id)
        
        # Find the category
        category = next((c for c in categories if c["name"] == category_name), None)
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        
        # Find the link to delete
        link_to_delete = next(
            (l for l in category.get("links", []) if l.get("title") == link_title), 
            None
        )
        
        if not link_to_delete:
            raise HTTPException(status_code=404, detail="Link not found")
        
        # Delete the link using database method
        await db.delete_link(user_id, category_name, link_title, link_to_delete.get("url"))
        
        return {"message": "Link deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting link: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Add delete link by URL as well
@router.delete("/{category_name}/links/")
async def delete_link_by_url(
    category_name: str,
    link: Link,
    user_id: str = Depends(get_current_user)
):
    """Delete a link from a category by providing the full link object"""
    try:
        await db.delete_link(user_id, category_name, link.title, link.url)
        return {"message": "Link deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting link: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")