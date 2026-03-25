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
import { Link } from "expo-router"
import { useAuth } from "@/contexts/auth-context"
import { Colors } from "@/constants/theme"
import { useColorScheme } from "@/hooks/use-color-scheme"

export default function ForgotPasswordScreen() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? "light"]
  const { resetPassword } = useAuth()

  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleReset() {
    if (!email) {
      Alert.alert("Error", "Please enter your email")
      return
    }
    setLoading(true)
    try {
      await resetPassword(email)
      setSent(true)
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Could not send reset email",
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
          Reset Password
        </Text>

        {sent ? (
          <View style={styles.sentContainer}>
            <Text style={[styles.sentText, { color: colors.text }]}>
              Check your email for a password reset link.
            </Text>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.tint }]}
              onPress={() => setSent(false)}
            >
              <Text style={styles.buttonText}>Send again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={[styles.subtitle, { color: colors.icon }]}>
              Enter your email and we'll send you a reset link.
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.icon,
                  backgroundColor:
                    colorScheme === "dark" ? "#1e1e1e" : "#f5f5f5",
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
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.tint }]}
              onPress={handleReset}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Sending..." : "Send reset link"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Link href="/(auth)/login" asChild>
          <TouchableOpacity style={styles.linkButton}>
            <Text style={[styles.linkText, { color: colors.tint }]}>
              Back to sign in
            </Text>
          </TouchableOpacity>
        </Link>
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
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
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
    marginTop: 24,
  },
  linkText: {
    fontSize: 14,
    fontWeight: "500",
  },
  sentContainer: {
    alignItems: "center",
    gap: 16,
  },
  sentText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 8,
  },
})
