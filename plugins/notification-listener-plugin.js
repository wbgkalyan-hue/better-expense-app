/**
 * Expo config plugin to register the Android NotificationListenerService.
 *
 * This adds the required <service> entry and intent-filter to AndroidManifest.xml
 * so that Android exposes the app in Settings → Notification access.
 */
const { withAndroidManifest } = require("expo/config-plugins")

function withNotificationListenerService(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults
    const application = manifest.manifest.application?.[0]

    if (!application) return config

    // Ensure the service array exists
    if (!application.service) {
      application.service = []
    }

    const serviceName =
      "me.leandrodev.rn.notificationlistener.NotificationListenerService"

    // Don't add if already present
    const alreadyAdded = application.service.some(
      (s) => s.$?.["android:name"] === serviceName,
    )

    if (!alreadyAdded) {
      application.service.push({
        $: {
          "android:name": serviceName,
          "android:label": "BetterExpenses Notification Listener",
          "android:permission":
            "android.permission.BIND_NOTIFICATION_LISTENER_SERVICE",
          "android:exported": "false",
        },
        "intent-filter": [
          {
            action: [
              {
                $: {
                  "android:name":
                    "android.service.notification.NotificationListenerService",
                },
              },
            ],
          },
        ],
      })
    }

    return config
  })
}

module.exports = withNotificationListenerService
