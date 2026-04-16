import {
    clearEncryption,
    initializeEncryption,
    restoreEncryption,
} from "@/services/encryption"
import {
    initNotificationProcessor,
    stopNotificationProcessor,
} from "@/services/notification-processor"
import auth, { type FirebaseAuthTypes } from "@react-native-firebase/auth"
import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react"
import { Platform } from "react-native"

interface AuthContextValue {
  user: FirebaseAuthTypes.User | null
  loading: boolean
  encryptionReady: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null)
  const [loading, setLoading] = useState(true)
  const [encryptionReady, setEncryptionReady] = useState(false)

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        // Try to restore encryption key from SecureStore (app restart)
        const restored = await restoreEncryption()
        setEncryptionReady(restored)
        // Start notification processor if encryption is ready
        if (restored && Platform.OS === "android") {
          initNotificationProcessor(firebaseUser.uid).catch(() => {})
        }
      } else {
        setEncryptionReady(false)
        stopNotificationProcessor()
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function signIn(email: string, password: string) {
    const credential = await auth().signInWithEmailAndPassword(email, password)
    // Derive and cache encryption key from password
    await initializeEncryption(password)
    setEncryptionReady(true)
    // Start notification processor after sign-in
    if (Platform.OS === "android" && credential.user) {
      initNotificationProcessor(credential.user.uid).catch(() => {})
    }
  }

  async function signUp(email: string, password: string) {
    const credential = await auth().createUserWithEmailAndPassword(email, password)
    // Derive and cache encryption key from password
    await initializeEncryption(password)
    setEncryptionReady(true)
    // Start notification processor after sign-up
    if (Platform.OS === "android" && credential.user) {
      initNotificationProcessor(credential.user.uid).catch(() => {})
    }
  }

  async function signOut() {
    // Stop notification processor
    stopNotificationProcessor()
    // Wipe encryption key — local data becomes unreadable
    await clearEncryption()
    setEncryptionReady(false)
    await auth().signOut()
  }

  async function resetPassword(email: string) {
    await auth().sendPasswordResetEmail(email)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        encryptionReady,
        signIn,
        signUp,
        signOut,
        resetPassword,
      }}
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
