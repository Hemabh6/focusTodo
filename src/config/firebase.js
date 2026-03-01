// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";           // <-- Required for authentication
import { getFirestore } from "firebase/firestore"; // <-- REQUIRED: Fixes the getFirestore error
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCrfApa_AnIQKB7ndHCxnbdgHRF5840i9U",
  authDomain: "todo-react-84693.firebaseapp.com",
  projectId: "todo-react-84693",
  storageBucket: "todo-react-84693.firebasestorage.app",
  messagingSenderId: "262533805984",
  appId: "1:262533805984:web:b420d7cea87b7ffeffd6c5",
  measurementId: "G-L2RZKWPFL4"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const APP_ID = 'focus-flow-app';