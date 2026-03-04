import asyncpg
import os
import logging
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

class Database:
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
        self.database_url = os.getenv("DATABASE_URL", "postgresql://linkvault_user:kPw1shUW1HifA8LjvyyoCRS5J3KPqWOo@dpg-d6hb8jpdrdic73cj9rg0-a/linkvault_wbzk")
    
    async def connect(self):
        """Create connection pool"""
        try:
            self.pool = await asyncpg.create_pool(
                self.database_url,
                min_size=1,
                max_size=10,
                command_timeout=60
            )
            logger.info("Database connection pool created")
            
            # Initialize tables
            await self.init_tables()
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            raise
    
    async def init_tables(self):
        """Create tables if they don't exist"""
        async with self.pool.acquire() as conn:
            # Users table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id VARCHAR(128) PRIMARY KEY,
                    email VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Categories table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS categories (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR(128) REFERENCES users(id) ON DELETE CASCADE,
                    name VARCHAR(100) NOT NULL,
                    position INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, name)
                )
            """)
            
            # Links table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS links (
                    id SERIAL PRIMARY KEY,
                    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
                    title VARCHAR(255) NOT NULL,
                    url TEXT NOT NULL,
                    position INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            logger.info("Database tables initialized")
    
    async def close(self):
        """Close connection pool"""
        if self.pool:
            await self.pool.close()
            logger.info("Database connection pool closed")
    
    # User methods
    async def get_or_create_user(self, user_id: str, email: str = None):
        """Get user or create if not exists"""
        async with self.pool.acquire() as conn:
            user = await conn.fetchrow("SELECT * FROM users WHERE id = $1", user_id)
            if not user:
                user = await conn.fetchrow(
                    "INSERT INTO users (id, email) VALUES ($1, $2) RETURNING *",
                    user_id, email
                )
                logger.info(f"Created new user: {user_id}")
            return dict(user)
    
    # Category methods
    async def get_categories(self, user_id: str):
        """Get all categories for a user with their links"""
        async with self.pool.acquire() as conn:
            # Get categories
            categories = await conn.fetch(
                "SELECT * FROM categories WHERE user_id = $1 ORDER BY position, created_at",
                user_id
            )
            
            result = []
            for cat in categories:
                # Get links for each category
                links = await conn.fetch(
                    "SELECT id, title, url, position, created_at FROM links WHERE category_id = $1 ORDER BY position, created_at",
                    cat['id']
                )
                
                result.append({
                    "id": cat['id'],
                    "name": cat['name'],
                    "links": [dict(link) for link in links]
                })
            
            return result
    
    async def create_category(self, user_id: str, name: str):
        """Create a new category"""
        async with self.pool.acquire() as conn:
            # Check if category exists
            existing = await conn.fetchval(
                "SELECT id FROM categories WHERE user_id = $1 AND name = $2",
                user_id, name
            )
            if existing:
                raise ValueError("Category already exists")
            
            # Get max position
            max_pos = await conn.fetchval(
                "SELECT COALESCE(MAX(position), -1) FROM categories WHERE user_id = $1",
                user_id
            )
            
            # Create category
            category = await conn.fetchrow(
                "INSERT INTO categories (user_id, name, position) VALUES ($1, $2, $3) RETURNING *",
                user_id, name, max_pos + 1
            )
            
            return dict(category)
    
    async def update_category(self, user_id: str, old_name: str, new_name: str):
        """Rename a category"""
        async with self.pool.acquire() as conn:
            await conn.execute(
                "UPDATE categories SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND name = $3",
                new_name, user_id, old_name
            )
    
    async def delete_category(self, user_id: str, name: str):
        """Delete a category and all its links"""
        async with self.pool.acquire() as conn:
            # Get category id
            cat_id = await conn.fetchval(
                "SELECT id FROM categories WHERE user_id = $1 AND name = $2",
                user_id, name
            )
            
            if cat_id:
                # Delete links first (cascade should handle this, but explicit is safe)
                await conn.execute("DELETE FROM links WHERE category_id = $1", cat_id)
                # Delete category
                await conn.execute("DELETE FROM categories WHERE id = $1", cat_id)
    
    # Link methods
    async def add_link(self, user_id: str, category_name: str, title: str, url: str):
        """Add a link to a category"""
        async with self.pool.acquire() as conn:
            # Get category id
            cat_id = await conn.fetchval(
                "SELECT id FROM categories WHERE user_id = $1 AND name = $2",
                user_id, category_name
            )
            
            if not cat_id:
                raise ValueError("Category not found")
            
            # Get max position
            max_pos = await conn.fetchval(
                "SELECT COALESCE(MAX(position), -1) FROM links WHERE category_id = $1",
                cat_id
            )
            
            # Add link
            await conn.execute(
                "INSERT INTO links (category_id, title, url, position) VALUES ($1, $2, $3, $4)",
                cat_id, title, url, max_pos + 1
            )
    
    async def delete_link(self, user_id: str, category_name: str, title: str, url: str):
        """Delete a link"""
        async with self.pool.acquire() as conn:
            # Get category id
            cat_id = await conn.fetchval(
                "SELECT id FROM categories WHERE user_id = $1 AND name = $2",
                user_id, category_name
            )
            
            if cat_id:
                await conn.execute(
                    "DELETE FROM links WHERE category_id = $1 AND title = $2 AND url = $3",
                    cat_id, title, url
                )

# Create global database instance
db = Database()

async def get_db():
    return db
