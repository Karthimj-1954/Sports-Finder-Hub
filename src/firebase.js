import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyBHTa-uvIUBueJKlqIX4_2aQzZeY0Zffbc",
    authDomain: "sports-finder-fa849.firebaseapp.com",
    projectId: "sports-finder-fa849",
    storageBucket: "sports-finder-fa849.firebasestorage.app",
    messagingSenderId: "256763495992",
    appId: "1:256763495992:web:2362fddae766c876d688cd",
    measurementId: "G-CDYMN0FS2E"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;