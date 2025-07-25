// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "hublancer-udvgo",
  "appId": "1:466321885666:web:624d4629847e24a93691bb",
  "storageBucket": "hublancer-udvgo.appspot.com",
  "apiKey": "AIzaSyCNtRphGdVBLikH8f3LGo2Wo-PTDV6dE7o",
  "authDomain": "hublancer-udvgo.firebaseapp.com",
  "messagingSenderId": "466321885666"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Enable Firestore persistence
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db)
    .catch((err) => {
      if (err.code == 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time.
        console.warn('Firestore persistence failed: multiple tabs open.');
      } else if (err.code == 'unimplemented') {
        // The current browser does not support all of the features required to enable persistence
        console.warn('Firestore persistence is not available in this browser.');
      }
    });
}


export { app, db, auth, storage };
