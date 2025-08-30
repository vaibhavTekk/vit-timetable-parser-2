const admin = require('firebase-admin');
require('dotenv').config();

let firebaseInitialized = false;

// Check if all required Firebase environment variables are present and valid
function hasValidFirebaseConfig() {
  const requiredVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY_ID', 
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_CLIENT_ID'
  ];
  
  return requiredVars.every(varName => {
    const value = process.env[varName];
    return value && value !== 'your-project-id' && value !== 'your-private-key-id' && 
           !value.includes('your-') && !value.includes('Your-');
  });
}

// Initialize Firebase Admin SDK only if credentials are valid
function initializeFirebase() {
  if (firebaseInitialized) return admin;
  
  if (!hasValidFirebaseConfig()) {
    console.warn('Firebase configuration not found or invalid. Firebase features will be disabled.');
    return null;
  }

  try {
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI,
      token_uri: process.env.FIREBASE_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
    };

    // Initialize Firebase Admin only if not already initialized
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
    }

    firebaseInitialized = true;
    console.log('Firebase Admin SDK initialized successfully');
    return admin;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error.message);
    return null;
  }
}

module.exports = {
  admin: initializeFirebase(),
  isInitialized: () => firebaseInitialized,
  hasValidConfig: hasValidFirebaseConfig
};