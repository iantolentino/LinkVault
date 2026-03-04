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

// Check if Firebase auth is available
if (!auth) {
  logger.error('Firebase auth not initialized!');
  alert('Authentication service unavailable. Please refresh the page.');
}

// Show notification
function showNotification(message, type = 'info') {
  // Remove existing notification
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
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Check if elements exist
function checkElements() {
  const elements = {
    googleBtn: document.getElementById('googleLoginBtn'),
    loginForm: document.getElementById('loginForm'),
    emailTab: document.getElementById('emailTab'),
    googleTab: document.getElementById('googleTab'),
    forgotPassword: document.getElementById('forgotPassword'),
    createAccount: document.getElementById('createAccount')
  };
  
  logger.info('Checking DOM elements', elements);
  
  // Log which elements are missing
  Object.entries(elements).forEach(([name, element]) => {
    if (!element) {
      logger.warn(`Element not found: ${name}`);
    }
  });
  
  return elements;
}

// Redirect if already logged in
onAuthStateChanged(auth, (user) => {
  logger.info('Auth state changed', { user: user?.email });
  if (user) {
    logger.success('User already logged in, redirecting to homepage');
    window.location.href = "homepage.html";
  }
});

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  logger.info('DOM loaded, setting up event listeners');
  
  const elements = checkElements();
  
  // Google Login
  if (elements.googleBtn) {
    elements.googleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logger.info('Google login button clicked');
      
      if (!auth || !provider) {
        logger.error('Firebase auth not initialized');
        showNotification('Authentication service unavailable', 'error');
        return;
      }
      
      signInWithPopup(auth, provider)
        .then((result) => {
          logger.success('Google login successful', { 
            email: result.user.email,
            uid: result.user.uid 
          });
          showNotification('Login successful! Redirecting...', 'success');
          setTimeout(() => {
            window.location.href = "homepage.html";
          }, 1000);
        })
        .catch((error) => {
          logger.error('Google login failed', error);
          
          // Handle specific errors
          let errorMessage = 'Login failed: ';
          switch (error.code) {
            case 'auth/popup-closed-by-user':
              errorMessage += 'Popup was closed before completing login';
              break;
            case 'auth/cancelled-popup-request':
              errorMessage += 'Login was cancelled';
              break;
            case 'auth/popup-blocked':
              errorMessage += 'Popup was blocked by browser';
              break;
            default:
              errorMessage += error.message;
          }
          
          showNotification(errorMessage, 'error');
          handleAuthError(error);
        });
    });
  } else {
    logger.error('Google login button not found');
  }
  
  // Email/Password Login
  if (elements.loginForm) {
    elements.loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email')?.value;
      const password = document.getElementById('password')?.value;
      
      if (!email || !password) {
        showNotification('Please enter email and password', 'error');
        return;
      }
      
      logger.info('Email login initiated', { email });
      
      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          logger.success('Email login successful', { 
            email: userCredential.user.email 
          });
          showNotification('Login successful! Redirecting...', 'success');
          setTimeout(() => {
            window.location.href = "homepage.html";
          }, 1000);
        })
        .catch((error) => {
          logger.error('Email login failed', error);
          let errorMessage = 'Login failed: ';
          if (error.code === 'auth/user-not-found') {
            errorMessage += 'No account found with this email';
          } else if (error.code === 'auth/wrong-password') {
            errorMessage += 'Incorrect password';
          } else {
            errorMessage += error.message;
          }
          showNotification(errorMessage, 'error');
          handleAuthError(error);
        });
    });
  }
  
  // Forgot Password
  if (elements.forgotPassword) {
    elements.forgotPassword.addEventListener('click', (e) => {
      e.preventDefault();
      const email = document.getElementById('email')?.value || prompt('Please enter your email:');
      if (email) {
        logger.info('Password reset requested', { email });
        sendPasswordResetEmail(auth, email)
          .then(() => {
            logger.success('Password reset email sent');
            showNotification('Password reset email sent! Check your inbox.', 'success');
          })
          .catch((error) => {
            logger.error('Password reset failed', error);
            showNotification('Failed to send reset email: ' + error.message, 'error');
            handleAuthError(error);
          });
      }
    });
  }
  
  // Create Account
  if (elements.createAccount) {
    elements.createAccount.addEventListener('click', (e) => {
      e.preventDefault();
      const email = document.getElementById('email')?.value || prompt('Enter your email:');
      const password = prompt('Create a password (min. 6 characters):');
      
      if (email && password) {
        if (password.length < 6) {
          showNotification('Password must be at least 6 characters', 'error');
          return;
        }
        
        logger.info('Account creation initiated', { email });
        createUserWithEmailAndPassword(auth, email, password)
          .then((userCredential) => {
            logger.success('Account created successfully', { 
              email: userCredential.user.email 
            });
            showNotification('Account created successfully! Redirecting...', 'success');
            setTimeout(() => {
              window.location.href = "homepage.html";
            }, 1000);
          })
          .catch((error) => {
            logger.error('Account creation failed', error);
            let errorMessage = 'Account creation failed: ';
            if (error.code === 'auth/email-already-in-use') {
              errorMessage += 'This email is already registered';
            } else if (error.code === 'auth/weak-password') {
              errorMessage += 'Password is too weak';
            } else {
              errorMessage += error.message;
            }
            showNotification(errorMessage, 'error');
            handleAuthError(error);
          });
      }
    });
  }
  
  // Tab switching
  if (elements.emailTab && elements.googleTab) {
    elements.emailTab.addEventListener('click', () => {
      logger.info('Switched to email login tab');
      elements.emailTab.classList.add('active');
      elements.googleTab.classList.remove('active');
      document.getElementById('loginForm').classList.add('active');
      document.getElementById('googleAuth').classList.remove('active');
    });
    
    elements.googleTab.addEventListener('click', () => {
      logger.info('Switched to Google login tab');
      elements.googleTab.classList.add('active');
      elements.emailTab.classList.remove('active');
      document.getElementById('googleAuth').classList.add('active');
      document.getElementById('loginForm').classList.remove('active');
    });
  }
  
  // Switch to email link
  document.querySelector('.switch-to-email')?.addEventListener('click', (e) => {
    e.preventDefault();
    logger.info('Switched to email tab via link');
    elements.emailTab?.click();
  });
});

// Error Handling
function handleAuthError(error) {
  logger.error('Authentication error:', error);
  
  let errorMessages = {
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/popup-closed-by-user': 'Login popup was closed before completing.',
    'auth/cancelled-popup-request': 'Login cancelled.',
    'auth/unauthorized-domain': 'This domain is not authorized for Firebase auth.'
  };
  
  const friendlyMessage = errorMessages[error.code] || error.message;
  
  // Check if it's an unauthorized domain error
  if (error.code === 'auth/unauthorized-domain') {
    console.error('⚠️ You need to add this domain to Firebase authorized domains:');
    console.error(`   Current domain: ${window.location.hostname}`);
    console.error('   Go to Firebase Console > Authentication > Settings > Authorized domains');
  }
  
  let errorDisplay = document.querySelector('.auth-error');
  if (!errorDisplay) {
    errorDisplay = document.createElement('div');
    errorDisplay.className = 'auth-error';
    errorDisplay.style.cssText = `
      color: #ff6b6b;
      background-color: rgba(255, 107, 107, 0.1);
      padding: 10px;
      border-radius: 5px;
      margin-bottom: 15px;
      border-left: 3px solid #ff6b6b;
    `;
    const activeForm = document.querySelector('.auth-form.active');
    if (activeForm) {
      activeForm.prepend(errorDisplay);
    } else {
      document.querySelector('.auth-content')?.prepend(errorDisplay);
    }
  }
  
  errorDisplay.textContent = friendlyMessage;
  
  setTimeout(() => {
    errorDisplay.remove();
  }, 5000);
}

// Add debug function to window for testing
window.debugAuth = function() {
  console.log('=== Auth Debug Info ===');
  console.log('Auth object:', auth);
  console.log('Current user:', auth?.currentUser);
  console.log('Firebase token:', localStorage.getItem('firebase_token'));
  console.log('DOM Elements:', {
    googleBtn: !!document.getElementById('googleLoginBtn'),
    loginForm: !!document.getElementById('loginForm'),
    email: document.getElementById('email')?.value,
  });
};