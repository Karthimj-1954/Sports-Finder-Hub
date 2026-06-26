import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCtZyLagwdGJ3LJsHISwxy8564ZpeWJCjo",
  authDomain: "sports-finder-hub-k19j4.firebaseapp.com",
  projectId: "sports-finder-hub-k19j4",
  storageBucket: "sports-finder-hub-k19j4.firebasestorage.app",
  messagingSenderId: "1063802347985",
  appId: "1:1063802347985:web:d8168d9c02163c3bf4c0f0",
  measurementId: "G-ZPPDC89SV3"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

export default app;