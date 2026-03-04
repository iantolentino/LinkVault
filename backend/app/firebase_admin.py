import logging
import os
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# Development mode - skip actual Firebase verification
SKIP_FIREBASE = os.getenv("SKIP_FIREBASE", "true").lower() == "true"

if not SKIP_FIREBASE:
    try:
        import firebase_admin
        from firebase_admin import credentials, auth
        
        # You'll need to download this from Firebase Console
        # Project Settings > Service Accounts > Generate New Private Key
        cred = credentials.Certificate("firebase-service-account.json")
        firebase_admin.initialize_app(cred)
        logger.info("Firebase Admin initialized")
    except Exception as e:
        logger.error(f"Firebase Admin initialization failed: {e}")
        SKIP_FIREBASE = True

def verify_token(token: str):
    """Verify Firebase token and return user ID"""
    if SKIP_FIREBASE:
        # Development: accept test tokens
        if token == "test_token_123":
            return "test_user_123"
        return None
    
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token['uid']
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        return None