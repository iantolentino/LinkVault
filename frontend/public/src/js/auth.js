// frontend/src/js/auth.js
import { 
  auth, 
  provider, 
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged
} from "./firebase-config.js";

// Logger utility
const logger = {
  info: (message, data) => console.log(`📘 [AUTH] ${message}`, data || ''),
  success: (message, data) => console.log(`✅ [AUTH] ${message}`, data || ''),
  error: (message, error) => console.error(`❌ [AUTH] ${message}`, error),
  warn: (message, data) => console.warn(`⚠️ [AUTH] ${message}`, data || '')
};

// --- FIX 1: IMPROVED REDIRECT LOGIC ---
onAuthStateChanged(auth, async (user) => {
  logger.info('Auth state changed', { user: user?.email });
  
  if (user) {
    // Save token for the API client before redirecting
    const token = await user.getIdToken();
    localStorage.setItem('firebase_token', token);
    
    // Only redirect if the user is currently on the login page
    const isLoginPage = window.location.pathname.includes('index.html') || window.location.pathname === '/';
    
    if (isLoginPage) {
      logger.success('User authenticated, redirecting to homepage');
      window.location.href = "homepage.html";
    }
  } else {
    // If no user, ensure the old token is wiped
    localStorage.removeItem('firebase_token');
  }
});

// Show notification
function showNotification(message, type = 'info') {
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();
  
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 5px;
    color: white;
    z-index: 9999;
    animation: slideInRight 0.3s ease-out;
    ${type === 'success' ? 'background-color: #4CAF50;' : ''}
    ${type === 'error' ? 'background-color: #f44336;' : ''}
    ${type === 'info' ? 'background-color: #2196F3;' : ''}
  `;
  document.body.appendChild(notification);
  
  setTimeout(() => notification.remove(), 3000);
}

function checkElements() {
  const elements = {
    googleBtn: document.getElementById('googleLoginBtn'),
    loginForm: document.getElementById('loginForm'),
    emailTab: document.getElementById('emailTab'),
    googleTab: document.getElementById('googleTab'),
    forgotPassword: document.getElementById('forgotPassword'),
    createAccount: document.getElementById('createAccount')
  };
  return elements;
}

document.addEventListener('DOMContentLoaded', () => {
  logger.info('DOM loaded, setting up event listeners');
  const elements = checkElements();
  
  // --- FIX 2: WRAPPING LOGIN PROCESSES ---
  const handleLoginSuccess = async (user) => {
    const token = await user.getIdToken();
    localStorage.setItem('firebase_token', token);
    showNotification('Login successful! Redirecting...', 'success');
    setTimeout(() => {
      window.location.href = "homepage.html";
    }, 1000);
  };

  // Google Login
  if (elements.googleBtn) {
    elements.googleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      signInWithPopup(auth, provider)
        .then((result) => handleLoginSuccess(result.user))
        .catch((error) => {
          logger.error('Google login failed', error);
          showNotification(error.message, 'error');
        });
    });
  }
  
  // Email/Password Login
  if (elements.loginForm) {
    elements.loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email')?.value;
      const password = document.getElementById('password')?.value;
      
      if (!email || !password) return showNotification('Enter email and password', 'error');
      
      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => handleLoginSuccess(userCredential.user))
        .catch((error) => {
          logger.error('Email login failed', error);
          showNotification(error.message, 'error');
        });
    });
  }
  
  // Tab switching logic (Keeping your existing logic)
  if (elements.emailTab && elements.googleTab) {
    elements.emailTab.addEventListener('click', () => {
      elements.emailTab.classList.add('active');
      elements.googleTab.classList.remove('active');
      document.getElementById('loginForm').classList.add('active');
      document.getElementById('googleAuth').classList.remove('active');
    });
    
    elements.googleTab.addEventListener('click', () => {
      elements.googleTab.classList.add('active');
      elements.emailTab.classList.remove('active');
      document.getElementById('googleAuth').classList.add('active');
      document.getElementById('loginForm').classList.remove('active');
    });
  }
});