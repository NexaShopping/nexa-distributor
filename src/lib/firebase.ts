import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";

// Public Firebase web configuration. The server verifies each ID token before
// issuing a NexaShopping session.
const firebaseConfig = {
  apiKey: "AIzaSyC7kQ3WU2mBhTFaRiI4_hVOYECvag8lqdk",
  authDomain: "nexashopping-a3bdd.firebaseapp.com",
  projectId: "nexashopping-a3bdd",
  storageBucket: "nexashopping-a3bdd.firebasestorage.app",
  messagingSenderId: "535209789556",
  appId: "1:535209789556:web:6b9e64a53ac3b334cda921",
  measurementId: "G-NEVN9GFK6X",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export async function firebasePasswordToken(email: string, password: string): Promise<string> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  if (!credential.user.emailVerified) {
    try { await sendEmailVerification(credential.user); }
    finally { await signOut(auth); }
    throw { code: "UNAUTHENTICATED", message: "Verify your email address before signing in" };
  }
  return credential.user.getIdToken();
}

export async function firebaseGoogleToken(): Promise<string> {
  const credential = await signInWithPopup(auth, googleProvider);
  return credential.user.getIdToken();
}

export async function firebaseSignOut(): Promise<void> {
  await signOut(auth);
}
