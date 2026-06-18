import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  projectId: "lucky-ship-kv7sv",
  appId: "1:856118881262:web:2cebec8a98f9dc24f1fcff",
  apiKey: "AIzaSyB0gz4z9FNpFTTmQ_LGt84lqBezC4uQJjU",
  authDomain: "lucky-ship-kv7sv.firebaseapp.com",
  storageBucket: "lucky-ship-kv7sv.firebasestorage.app",
  messagingSenderId: "856118881262",
  measurementId: ""
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {}, "ai-studio-b2b3490e-7529-462b-b448-8395d29f9ca3");
