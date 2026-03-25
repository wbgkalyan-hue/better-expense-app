import firebase from "@react-native-firebase/app"
import auth from "@react-native-firebase/auth"
import firestore from "@react-native-firebase/firestore"

// @react-native-firebase reads config from google-services.json (Android)
// placed at: android/app/google-services.json
// No manual initialization needed — the native SDK auto-configures.

export { firebase, auth, firestore }
export default firebase
