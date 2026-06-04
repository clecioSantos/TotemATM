// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC5yiYZsQbhWYPzNAKYFEpjzeT3Yl41Org",
  authDomain: "totenatm.firebaseapp.com",
  projectId: "totenatm",
  storageBucket: "totenatm.firebasestorage.app",
  messagingSenderId: "919273037092",
  appId: "1:919273037092:web:1f9fa90c131f253f4aa7b1",
  measurementId: "G-Z7H89MQCTL"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize and export services
export const db = getFirestore(app);
export const auth = getAuth(app);

let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}
export { analytics };
