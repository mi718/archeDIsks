import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAEQ637p-rHgrdaXPbZ0zRtoUhofgh8FtA",
  authDomain: "orbitaldisk.firebaseapp.com",
  projectId: "orbitaldisk",
  storageBucket: "orbitaldisk.firebasestorage.app",
  messagingSenderId: "463346738974",
  appId: "1:463346738974:web:5eaf70353ae1dcba1e0b0f",
  measurementId: "G-E9WNP4QMZP"
};

// Log only once
if (typeof window !== 'undefined') {
  (window as any)._firebaseConfig = { ...firebaseConfig, apiKey: "REDACTED" };
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log("[DEBUG_LOG] Firebase Initialized with projectId:", firebaseConfig.projectId);
console.log("[DEBUG_LOG] Firebase Config Auth Domain:", firebaseConfig.authDomain);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

/**
 * Recursively removes undefined values from an object/array
 * Firestore does not support undefined values.
 */
export const sanitizeData = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(v => sanitizeData(v));
  }
  
  if (data !== null && typeof data === 'object' && !(data instanceof Date)) {
    return Object.fromEntries(
      Object.entries(data)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, sanitizeData(v)])
    );
  }
  
  return data;
};

export default app;
