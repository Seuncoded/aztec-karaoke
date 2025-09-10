// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: window.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: window.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: window.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: window.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: window.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: window.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };