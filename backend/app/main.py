from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import logging
import os
import json
import firebase_admin
from firebase_admin import credentials
from app.database import db
from app.routes import categories, links, auth

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="LinkVault API")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://l-vault.vercel.app",
        "https://linkvault-production.up.railway.app",
        "https://linkvault-7ix0.onrender.com" 
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- FIREBASE INITIALIZATION ---
def init_firebase():
    # Check if we have the JSON string from Railway Variables
    firebase_creds_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
    
    if not firebase_admin._apps:
        if firebase_creds_json:
            try:
                # Parse the JSON string into a dictionary
                creds_dict = json.loads(firebase_creds_json)
                cred = credentials.Certificate(creds_dict)
                firebase_admin.initialize_app(cred)
                logger.info("Firebase initialized using Environment Variable")
            except Exception as e:
                logger.error(f"Failed to initialize Firebase from JSON string: {e}")
        else:
            # Fallback for local development (looking for the file)
            try:
                cred = credentials.Certificate("serviceAccountKey.json")
                firebase_admin.initialize_app(cred)
                logger.info("Firebase initialized using local serviceAccountKey.json")
            except Exception as e:
                logger.warning(f"Firebase credentials not found. Auth may fail: {e}")

# Database & Firebase connection events
@app.on_event("startup")
async def startup():
    # Initialize Firebase first
    init_firebase()
    # Connect to your Database
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

# Root path
@app.get("/")
async def root():
    return {"message": "LinkVault API is live on Railway"}

# Routes
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(categories.router, prefix="/api/categories", tags=["categories"])
app.include_router(links.router, prefix="/api/links", tags=["links"])