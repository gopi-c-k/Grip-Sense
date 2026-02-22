import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";

const LOCATION_TASK = "background-location-task";

TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  if (error) return;

  const { locations } = data;
  const loc = locations[0];

  const userId = await SecureStore.getItemAsync("userId");

  if (!userId) return;

  await fetch("https://grip-sense.onrender.com/update-location", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      lat: loc.coords.latitude,
      lng: loc.coords.longitude,
    }),
  });
});

export async function startBackgroundTracking() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") return;

  await Location.requestBackgroundPermissionsAsync();

  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 120000, // 2 minutes
    distanceInterval: 0,
    showsBackgroundLocationIndicator: false,
  });
}