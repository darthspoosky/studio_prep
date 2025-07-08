import * as admin from 'firebase-admin';

// IMPORTANT: Replace with your service account credentials.
// You can get this from the Firebase console: 
// Project settings > Service accounts > Generate new private key
const serviceAccount = {
  // "type": "service_account",
  // "project_id": "your-project-id",
  // "private_key_id": "your-private-key-id",
  // "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----",
  // "client_email": "your-client-email",
  // "client_id": "your-client-id",
  // "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  // "token_uri": "https://oauth2.googleapis.com/token",
  // "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  // "client_x509_cert_url": "your-client-x509-cert-url"
};

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export default admin;
