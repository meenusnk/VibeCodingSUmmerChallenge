// Firebase initialization for IE compatibility
// This must be loaded after firebase-compat.js

if (typeof firebase === 'undefined') {
  console.error('Firebase SDK not loaded');
} else {
  firebase.initializeApp(firebaseConfig);
  window.db = firebase.firestore();
  window.auth = firebase.auth();
}
