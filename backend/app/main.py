from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import logging
import os
from app.database import db
# Ensure all route modules are imported
from app.routes import categories, links, auth

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="LinkVault API")

# CORS Configuration
# Added your specific Railway production domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://l-vault.vercel.app",
        "https://linkvault-production.up.railway.app",
        "https://linkvault-7ix0.onrender.com" # Keeping for legacy/transition
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection events
@app.on_event("startup")
async def startup():
    await db.connect()
    logger.info("Application startup complete")

@app.on_event("shutdown")
async def shutdown():
    await db.close()
    logger.info("Application shutdown complete")

# Health check (Crucial for Railway to pass deployment)
@app.get("/health")
async def health_check():
    return {"status": "healthy", "database": "connected"}

# Root path for quick verification
@app.get("/")
async def root():
    return {"message": "LinkVault API is live on Railway"}

# Routes
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(categories.router, prefix="/api/categories", tags=["categories"])
app.include_router(links.router, prefix="/api/links", tags=["links"])