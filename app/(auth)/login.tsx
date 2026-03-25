import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native"
import { Link, useRouter } from "expo-router"
import { useAuth } from "@/contexts/auth-context"
import { Colors } from "@/constants/theme"
import { useColorScheme } from "@/hooks/use-color-scheme"

export default function LoginScreen() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? "light"]
  const router = useRouter()
  const { signIn } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }
    setLoading(true)
    try {
      await signIn(email, password)
      router.replace("/(tabs)")
    } catch (err) {
      Alert.alert(
        "Login Failed",
        err instanceof Error ? err.message : "Invalid email or password",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          BetterExpenses
        </Text>
        <Text style={[styles.subtitle, { color: colors.icon }]}>
          Sign in to your account
        </Text>

        <View style={styles.form}>
          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: colors.icon,
                backgroundColor: colorScheme === "dark" ? "#1e1e1e" : "#f5f5f5",
              },
            ]}
            placeholder="Email"
            placeholderTextColor={colors.icon}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: colors.icon,
                backgroundColor: colorScheme === "dark" ? "#1e1e1e" : "#f5f5f5",
              },
            ]}
            placeholder="Password"
            placeholderTextColor={colors.icon}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
          />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.tint }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Signing in..." : "Sign in"}
            </Text>
          </TouchableOpacity>

          <Link href="/(auth)/forgot-password" asChild>
            <TouchableOpacity style={styles.linkButton}>
              <Text style={[styles.linkText, { color: colors.tint }]}>
                Forgot password?
              </Text>
            </TouchableOpacity>
          </Link>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.icon }]}>
            Don't have an account?{" "}
          </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text style={[styles.linkText, { color: colors.tint }]}>
                Sign up
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
  },
  form: {
    gap: 16,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  button: {
    height: 48,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  linkButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 14,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
})
