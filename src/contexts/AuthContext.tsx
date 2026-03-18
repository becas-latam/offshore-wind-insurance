import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  type User,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider } from '@/firebase/config'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

async function saveUserProfile(userId: string, email: string | null, displayName: string | null) {
  const userRef = doc(db, 'users', userId)
  const snapshot = await getDoc(userRef)

  const data: Record<string, unknown> = {
    email,
    updatedAt: serverTimestamp(),
  }
  if (displayName) data.displayName = displayName

  if (!snapshot.exists()) {
    data.createdAt = serverTimestamp()
  }

  await setDoc(userRef, data, { merge: true })
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  // Handle Google redirect result on app load (production flow)
  useEffect(() => {
    getRedirectResult(auth).then((result) => {
      if (result?.user) {
        saveUserProfile(result.user.uid, result.user.email, result.user.displayName)
      }
    }).catch(() => {
      // Redirect result errors are non-critical
    })
  }, [])

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function signup(email: string, password: string) {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    await saveUserProfile(result.user.uid, result.user.email, null)
  }

  async function loginWithGoogle() {
    if (window.location.hostname === 'localhost') {
      const result = await signInWithPopup(auth, googleProvider)
      await saveUserProfile(result.user.uid, result.user.email, result.user.displayName)
    } else {
      await signInWithRedirect(auth, googleProvider)
    }
  }

  async function logout() {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
