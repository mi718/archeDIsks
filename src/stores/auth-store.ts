import { create } from 'zustand'
import { 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import type { User as FirebaseUser } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { useDiscStore } from './disc-store'

interface AuthState {
  isLoggedIn: boolean
  user: { email: string; uid?: string; createdAt?: Date } | null
  loading: boolean
  error: string | null
  login: (email: string) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  setUser: (user: { email: string; uid?: string; createdAt?: Date } | null) => void
  setError: (error: string | null) => void
  signup: (email: string, password: string) => Promise<void>
  signin: (email: string, password: string) => Promise<void>
}

function getFriendlyAuthError(error: unknown): string {
  if (!error || typeof error !== 'object') return 'An unknown error occurred.'
  // Type guard for error.code
  const code = (error as { code?: string; message?: string }).code
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please log in or use a different email.'
    case 'auth/invalid-email':
      return 'The email address is not valid.'
    case 'auth/weak-password':
      return 'The password is too weak. Please use a stronger password.'
    case 'auth/user-not-found':
      return 'No account found with this email.'
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.'
    default:
      return (error as { message?: string }).message || 'An unknown error occurred.'
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: localStorage.getItem('isLoggedIn') === 'true',
  user: localStorage.getItem('userEmail') ? { email: localStorage.getItem('userEmail')! } : null,
  loading: true,
  error: null,
  login: (email: string) => {
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('userEmail', email)
    set({ isLoggedIn: true, user: { email }, error: null })
  },
  logout: () => {
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('userEmail')
    signOut(auth).catch(console.error)
    set({ isLoggedIn: false, user: null, error: null })
  },
  setLoading: (loading: boolean) => set({ loading }),
  setUser: (user: { email: string; uid?: string } | null) => {
    if (user) {
      localStorage.setItem('isLoggedIn', 'true')
      localStorage.setItem('userEmail', user.email)
      set({ isLoggedIn: true, user, error: null })
    } else {
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('userEmail')
      set({ isLoggedIn: false, user: null, error: null })
    }
  },
  setError: (error: string | null) => set({ error }),
  signup: async (email: string, password: string) => {
    set({ loading: true, error: null })
    try {
      await createUserWithEmailAndPassword(auth, email, password)
      set({ error: null })
    } catch (error) {
      set({ error: getFriendlyAuthError(error) })
    } finally {
      set({ loading: false })
    }
  },
  signin: async (email: string, password: string) => {
    set({ loading: true, error: null })
    try {
      await signInWithEmailAndPassword(auth, email, password)
      set({ error: null })
    } catch (error) {
      set({ error: getFriendlyAuthError(error) })
    } finally {
      set({ loading: false })
    }
  }
}))

// Listen for auth state changes
onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
  const store = useAuthStore.getState()
  const discStore = useDiscStore.getState()

  if (firebaseUser) {
    // Fetch user data from Firestore to get createdAt
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid)
      const userDocSnap = await getDoc(userDocRef)
      
      let createdAt: Date | undefined
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data()
        if (userData.createdAt) {
          // Convert Firestore Timestamp to Date
          createdAt = userData.createdAt.toDate()
        }
      }
      
      store.setUser({ 
        email: firebaseUser.email || '', 
        uid: firebaseUser.uid,
        createdAt
      })
    } catch (error) {
      console.error('Error fetching user data from Firestore:', error)
      store.setUser({ email: firebaseUser.email || '', uid: firebaseUser.uid })
    }
    
    // Sync local discs to Firestore when user logs in
    await discStore.syncLocalToFirestore()
    // Refresh discs from Firestore
    await discStore.loadDiscs()
  } else {
    // If we're not using Firebase yet (keys missing), we might want to keep the local storage logic
    // but for a clean setup, we should eventually rely only on Firebase
    // For now, let's just log it
    console.log("Firebase auth state changed: No user")
    // When logged out, reload discs from local storage
    await discStore.loadDiscs()
  }
  store.setLoading(false)
})
