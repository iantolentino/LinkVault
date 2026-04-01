from pydantic import BaseModel, HttpUrl, Field
from typing import List, Optional
from datetime import datetime

class Link(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    url: str = Field(..., min_length=1)
    created_at: Optional[datetime] = None

class Category(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    links: List[Link] = []
    user_id: str
    updated_at: Optional[datetime] = None

class UserData(BaseModel):
    user_id: str
    email: Optional[str] = None
    categories: List[Category] = []

class TokenData(BaseModel):
    uid: str
    email: Optional[str] = None