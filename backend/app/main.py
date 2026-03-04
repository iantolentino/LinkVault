from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import logging
import os
from app.database import db
from app.routes import categories

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="LinkVault API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://l-vault.vercel.app",
        "https://linkvault-7ix0.onrender.com"
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

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "database": "connected"}

# Routes
app.include_router(categories.router, prefix="/api/categories", tags=["categories"])
