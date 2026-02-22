import * as Location from "expo-location";
import { Linking, Platform } from "react-native";

export const triggerSMS = async (number) => {
  try {
    let { status } = await Location.requestForegroundPermissionsAsync();
    let locationLink = "Location unavailable";

    if (status === "granted") {
      let loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      locationLink = `https://maps.google.com/?q=${loc.coords.latitude},${loc.coords.longitude}`;
    }

    const message = `🚨 GripSense Alert! Possible fall or grip failure detected.\nLocation: ${locationLink}\nPlease check on the user immediately.`;

    const separator = Platform.OS === "ios" ? "&" : "?";
    const url = `sms:${number}${separator}body=${encodeURIComponent(message)}`;

    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return { success: true };
    } else {
      return { success: false, error: "SMS not supported on this device" };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
};
