import { 
    auth, 
    provider, 
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    onAuthStateChanged
  } from "./firebase-config.js";
  
  // Redirect if already logged in
  onAuthStateChanged(auth, (user) => {
    if (user) {
      window.location.href = "homepage.html";
    }
  });
  
  // Google Login
  document.getElementById('googleLoginBtn')?.addEventListener('click', () => {
    signInWithPopup(auth, provider)
      .then(() => {
        window.location.href = "homepage.html";
      })
      .catch(handleAuthError);
  });
  
  // Email/Password Login
  document.getElementById('loginForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        window.location.href = "homepage.html";
      })
      .catch(handleAuthError);
  });
  
  // Forgot Password
  document.getElementById('forgotPassword')?.addEventListener('click', (e) => {
    e.preventDefault();
    const email = document.getElementById('email')?.value || prompt('Please enter your email:');
    if (email) {
      sendPasswordResetEmail(auth, email)
        .then(() => alert('Password reset email sent! Check your inbox.'))
        .catch(handleAuthError);
    }
  });
  
  // Create Account
  document.getElementById('createAccount')?.addEventListener('click', (e) => {
    e.preventDefault();
    const email = document.getElementById('email')?.value || prompt('Enter your email:');
    const password = prompt('Create a password:');
    
    if (email && password) {
      createUserWithEmailAndPassword(auth, email, password)
        .then(() => {
          alert('Account created successfully!');
          window.location.href = "homepage.html";
        })
        .catch(handleAuthError);
    }
  });
  
  // Error Handling
  function handleAuthError(error) {
    console.error('Authentication error:', error);
    
    let errorDisplay = document.querySelector('.auth-error');
    if (!errorDisplay) {
      errorDisplay = document.createElement('div');
      errorDisplay.className = 'auth-error';
      const activeForm = document.querySelector('.auth-form.active');
      if (activeForm) activeForm.prepend(errorDisplay);
    }
    
    errorDisplay.textContent = error.message;
    
    setTimeout(() => {
      errorDisplay.remove();
    }, 5000);
  }