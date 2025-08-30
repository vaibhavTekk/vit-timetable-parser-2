// Firebase configuration and Google Calendar integration
let firebaseApp;
let auth;
let currentUser = null;
let userAccessToken = null;

// Initialize Firebase
async function initializeFirebase() {
  try {
    const response = await fetch('/api/firebase-config');
    const data = await response.json();
    
    if (!data.configured) {
      console.warn('Firebase is not configured. Google Calendar integration is disabled.');
      updateUIForNoFirebase();
      return;
    }
    
    const firebaseConfig = data;
    
    // Import Firebase modules
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js');
    const { getAuth, GoogleAuthProvider, signInWithPopup, signOut } = await import('https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js');
    
    // Initialize Firebase
    firebaseApp = initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    
    // Set up auth state listener
    auth.onAuthStateChanged((user) => {
      currentUser = user;
      updateUIBasedOnAuthState();
    });
    
    // Store auth functions globally
    window.GoogleAuthProvider = GoogleAuthProvider;
    window.signInWithPopup = signInWithPopup;
    window.signOut = signOut;
    
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    updateUIForNoFirebase();
  }
}

// Update UI when Firebase is not available
function updateUIForNoFirebase() {
  const authButton = document.getElementById('auth-button');
  const googleCalendarOptions = document.getElementById('google-calendar-options');
  
  if (authButton) {
    authButton.style.display = 'none';
  }
  
  if (googleCalendarOptions) {
    googleCalendarOptions.innerHTML = '<p class="text-sm text-gray-500">Google Calendar integration requires Firebase configuration</p>';
  }
}

// Sign in with Google
async function signInWithGoogle() {
  try {
    const provider = new window.GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar');
    
    const result = await window.signInWithPopup(auth, provider);
    const credential = window.GoogleAuthProvider.credentialFromResult(result);
    userAccessToken = credential.accessToken;
    
    console.log('Signed in successfully');
    showSuccess('Signed in with Google successfully!');
  } catch (error) {
    console.error('Error signing in:', error);
    showError('Error signing in with Google: ' + error.message);
  }
}

// Sign out
async function signOutUser() {
  try {
    await window.signOut(auth);
    userAccessToken = null;
    console.log('Signed out successfully');
    showSuccess('Signed out successfully!');
  } catch (error) {
    console.error('Error signing out:', error);
    showError('Error signing out: ' + error.message);
  }
}

// Update UI based on authentication state
function updateUIBasedOnAuthState() {
  const authButton = document.getElementById('auth-button');
  const googleCalendarOptions = document.getElementById('google-calendar-options');
  const userInfo = document.getElementById('user-info');
  
  if (currentUser) {
    authButton.textContent = 'Sign Out';
    authButton.onclick = signOutUser;
    authButton.className = 'flex flex-row gap-2 px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm';
    
    if (userInfo) {
      userInfo.innerHTML = `<span class="text-sm text-gray-600">Signed in as: ${currentUser.email}</span>`;
    }
    
    if (googleCalendarOptions) {
      googleCalendarOptions.classList.remove('hidden');
    }
  } else {
    authButton.textContent = 'Sign in with Google';
    authButton.onclick = signInWithGoogle;
    authButton.className = 'flex flex-row gap-2 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm';
    
    if (userInfo) {
      userInfo.innerHTML = '';
    }
    
    if (googleCalendarOptions) {
      googleCalendarOptions.classList.add('hidden');
    }
  }
}

// Add events to Google Calendar
async function addToGoogleCalendar() {
  try {
    if (!currentUser || !userAccessToken) {
      showError('Please sign in with Google first');
      return;
    }

    const form = document.querySelector('form');
    const formData = new FormData(form);
    
    if (!formData.get('timetable') || !formData.get('startDate') || !formData.get('endDate')) {
      showError('Please fill all form fields');
      return;
    }

    // Show loading state
    const googleButton = document.getElementById('google-calendar-btn');
    const originalText = googleButton.innerHTML;
    googleButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Adding to Calendar...';
    googleButton.disabled = true;

    // First create a calendar
    const idToken = await currentUser.getIdToken();
    const createCalendarResponse = await fetch('/api/calendar/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        accessToken: userAccessToken,
        calendarName: 'VIT Timetable'
      })
    });

    if (!createCalendarResponse.ok) {
      throw new Error('Failed to create calendar');
    }

    const { calendar } = await createCalendarResponse.json();

    // Then add events to the calendar
    formData.append('accessToken', userAccessToken);
    formData.append('calendarId', calendar.id);

    const addEventsResponse = await fetch('/api/calendar/add-events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`
      },
      body: formData
    });

    if (!addEventsResponse.ok) {
      throw new Error('Failed to add events to calendar');
    }

    const result = await addEventsResponse.json();
    showSuccess(`Successfully added ${result.eventsCount} events to your Google Calendar!`);
    
    // Reset button
    googleButton.innerHTML = originalText;
    googleButton.disabled = false;
    
  } catch (error) {
    console.error('Error adding to Google Calendar:', error);
    showError('Error adding to Google Calendar: ' + error.message);
    
    // Reset button
    const googleButton = document.getElementById('google-calendar-btn');
    googleButton.innerHTML = '<i class="fa-brands fa-google"></i> Add to Google Calendar';
    googleButton.disabled = false;
  }
}

// Utility functions for showing messages
function showSuccess(message) {
  const successDiv = document.getElementById('success');
  const successText = document.getElementById('successtext');
  if (successDiv && successText) {
    successText.textContent = message;
    successDiv.classList.remove('hidden');
    successDiv.classList.add('flex');
    setTimeout(() => {
      successDiv.classList.add('hidden');
      successDiv.classList.remove('flex');
    }, 5000);
  }
}

// Initialize Firebase when the page loads
document.addEventListener('DOMContentLoaded', initializeFirebase);