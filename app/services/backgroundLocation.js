import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import * as Notifications from 'expo-notifications';

const LOCATION_TASK = "background-location-task";

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Define the background task BEFORE any other code runs
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error("Background location error:", error);
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Background Location Failed",
          body: `Error: ${error.message}`
        },
        trigger: null
      });
    } catch (e) {
      console.error("Failed to send error notification:", e);
    }
    return;
  }

  if (data) {
    const { locations } = data;
    if (locations && locations.length > 0) {
      const loc = locations[0];
      
      console.log("Background location update:", {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        timestamp: new Date(loc.timestamp).toISOString()
      });

      // Send notification
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Location Updated",
            body: `Lat: ${loc.coords.latitude.toFixed(4)}, Lng: ${loc.coords.longitude.toFixed(4)}`
          },
          trigger: null
        });
      } catch (e) {
        console.error("Failed to send location notification:", e);
      }

      // Send to server
      try {
        const response = await fetch("https://grip-sense.onrender.com/update-location", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
            timestamp: loc.timestamp,
            accuracy: loc.coords.accuracy,
          }),
        });

        if (!response.ok) {
          console.error("Server responded with error:", response.status);
        }
      } catch (error) {
        console.error("Failed to send location to server:", error);
      }
    }
  }
});

export async function startBackgroundTracking() {
  console.log("Starting background tracking...");
  
  // Request notification permissions
  const notifStatus = await Notifications.requestPermissionsAsync();
  console.log("Notification permission:", notifStatus.status);
  
  // Request foreground location permission
  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
  console.log("Foreground permission:", foregroundStatus);
  
  if (foregroundStatus !== "granted") {
    console.log("Foreground permission not granted");
    return false;
  }

  // Request background location permission
  const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
  console.log("Background permission:", backgroundStatus);
  
  if (backgroundStatus !== "granted") {
    console.log("Background permission not granted");
    return false;
  }

  // Check if already started
  const isStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
  console.log("Location updates already started:", isStarted);

  if (isStarted) {
    console.log("Stopping existing location updates...");
    await Location.stopLocationUpdatesAsync(LOCATION_TASK);
  }

  // Start location updates
  try {
    await Location.startLocationUpdatesAsync(LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 120000, // 2 minutes
      distanceInterval: 50, // 50 meters (helps trigger updates)
      deferredUpdatesInterval: 120000,
      showsBackgroundLocationIndicator: true, // Set to true for testing
      foregroundService: {
        notificationTitle: "GripSense Active",
        notificationBody: "Tracking your location for safety",
        notificationColor: "#4F46E5",
      },
    });
    
    console.log("Background location tracking started successfully");
    
    // Send confirmation notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "GripSense Started",
        body: "Background location tracking is now active"
      },
      trigger: null
    });
    
    return true;
  } catch (error) {
    console.error("Failed to start location updates:", error);
    return false;
  }
}

export async function stopBackgroundTracking() {
  try {
    const isStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
    if (isStarted) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK);
      console.log("Background tracking stopped");
    }
  } catch (error) {
    console.error("Failed to stop background tracking:", error);
  }
}