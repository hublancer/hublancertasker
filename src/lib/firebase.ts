// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
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

export { app, db, auth, storage };
