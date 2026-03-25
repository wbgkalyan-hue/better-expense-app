import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import auth, { type FirebaseAuthTypes } from "@react-native-firebase/auth"

interface AuthContextValue {
  user: FirebaseAuthTypes.User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function signIn(email: string, password: string) {
    await auth().signInWithEmailAndPassword(email, password)
  }

  async function signUp(email: string, password: string) {
    await auth().createUserWithEmailAndPassword(email, password)
  }

  async function signOut() {
    await auth().signOut()
  }

  async function resetPassword(email: string) {
    await auth().sendPasswordResetEmail(email)
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signUp, signOut, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
