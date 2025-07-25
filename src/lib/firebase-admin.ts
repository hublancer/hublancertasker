
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK only once
if (!admin.apps.length) {
    try {
        admin.initializeApp();
    } catch(err) {
        console.error("Failed to initialize firebase-admin", err);
    }
}

let db, auth;

try {
    db = admin.firestore();
    auth = admin.auth();
} catch (err) {
    console.error("Failed to get firestore/auth from firebase-admin", err);
}


export { db, auth };
