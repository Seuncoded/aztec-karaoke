// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// Your config from Firebase console
const firebaseConfig = {
  apiKey: "AIzaSyAonG1_DBWPP-_tyzlm7GmpoYCSDpcHlgA",
  authDomain: "aztec-karaoke.firebaseapp.com",
  projectId: "aztec-karaoke",
  storageBucket: "aztec-karaoke.firebasestorage.app",
  messagingSenderId: "653086043635",
  appId: "1:653086043635:web:05a9aea258b15e6c67b686",
  measurementId: "G-VLQR52TG9K"
};

// Initialize
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);