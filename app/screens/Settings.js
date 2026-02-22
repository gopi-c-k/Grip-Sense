import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { startBackgroundTracking } from "../services/backgroundLocation";
import { useTheme } from "../context/ThemeContext";
import { triggerSMS } from "../utils/emergency";

export default function Settings() {
  const { theme, dark, toggleTheme } = useTheme();
  const [number, setNumber] = useState("");
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync("emergencyNumber").then((val) => {
      if (val) setNumber(val);
    });
  }, []);

  // const saveNumber = async () => {
  //   if (!number.trim()) {
  //     Alert.alert("Invalid", "Please enter a valid phone number.");
  //     return;
  //   }
  //   await SecureStore.setItemAsync("emergencyNumber", number.trim());
  //   setSaved(true);
  //   setTimeout(() => setSaved(false), 2500);
  // };
  const saveNumber = async () => {
  if (!number.trim()) {
    Alert.alert("Invalid", "Please enter a valid phone number.");
    return;
  }

  const userId = "user_" + gripsense;

  await SecureStore.setItemAsync("emergencyNumber", number.trim());
  await SecureStore.setItemAsync("userId", userId);

  await fetch("https://your-backend/register-user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      phone: number.trim(),
    }),
  });

  await startBackgroundTracking();

  setSaved(true);
  setTimeout(() => setSaved(false), 2500);
};

  const testSMS = async () => {
    const stored = await SecureStore.getItemAsync("emergencyNumber");
    if (!stored) {
      Alert.alert("No Number Saved", "Please save an emergency number first.");
      return;
    }
    setTesting(true);
    const result = await triggerSMS(stored);
    setTesting(false);
    if (!result.success) {
      Alert.alert("Error", result.error || "Could not send SMS.");
    }
  };

  const s = styles(theme);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={s.container}>
        <Text style={s.pageTitle}>Settings</Text>

        {/* Emergency Contact */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>🚨  Emergency Contact</Text>
          <Text style={s.sectionDesc}>
            This number will receive an SMS with your GPS location if a CRITICAL
            event is detected and not cancelled within 10 seconds.
          </Text>
          <Text style={s.label}>Phone Number</Text>
          <TextInput
            style={s.input}
            placeholder="+91XXXXXXXXXX"
            placeholderTextColor={theme.subtext}
            value={number}
            onChangeText={setNumber}
            keyboardType="phone-pad"
            autoCorrect={false}
          />
          <TouchableOpacity style={s.saveBtn} onPress={saveNumber}>
            <Text style={s.saveBtnText}>{saved ? "✅  Saved!" : "Save Number"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.testBtn, testing && s.disabledBtn]}
            onPress={testSMS}
            disabled={testing}
          >
            <Text style={s.testBtnText}>
              {testing ? "Opening SMS..." : "📲  Test Emergency SMS"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Appearance */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>🎨  Appearance</Text>
          <View style={s.row}>
            <View>
              <Text style={s.rowLabel}>Dark Mode</Text>
              <Text style={s.rowSub}>Switch between light and dark theme</Text>
            </View>
            <Switch
              value={dark}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.border, true: theme.accent }}
              thumbColor={dark ? "#fff" : "#fff"}
            />
          </View>
        </View>

        {/* About */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>ℹ️  About GripSense</Text>
          <Text style={s.sectionDesc}>
            GripSense monitors grip strength and motion via ESP32 sensors.{"\n"}
            It detects potential falls or grip failures and alerts your
            emergency contact automatically.
          </Text>
          <View style={s.infoRow}>
            <Text style={s.infoKey}>Version</Text>
            <Text style={s.infoVal}>1.0.0</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoKey}>Alert Countdown</Text>
            <Text style={s.infoVal}>10 seconds</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoKey}>Socket Endpoint</Text>
            <Text style={[s.infoVal, { fontSize: 11 }]}>gripsense/getdata</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = (t) =>
  StyleSheet.create({
    container: { padding: 20, paddingBottom: 50 },
    pageTitle: {
      fontSize: 26,
      fontWeight: "800",
      color: t.text,
      marginBottom: 24,
      marginTop: 8,
    },

    section: {
      backgroundColor: t.card,
      borderRadius: 16,
      padding: 18,
      marginBottom: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: t.dark ? 0.4 : 0.06,
      shadowRadius: 8,
      elevation: 3,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: t.text,
      marginBottom: 8,
    },
    sectionDesc: {
      fontSize: 13,
      color: t.subtext,
      lineHeight: 19,
      marginBottom: 16,
    },

    label: { fontSize: 13, fontWeight: "600", color: t.subtext, marginBottom: 6 },
    input: {
      backgroundColor: t.inputBg,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: t.text,
      marginBottom: 12,
    },
    saveBtn: {
      backgroundColor: t.accent,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      marginBottom: 10,
    },
    saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
    testBtn: {
      borderWidth: 1.5,
      borderColor: t.accent,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: "center",
    },
    testBtnText: { color: t.accent, fontWeight: "600", fontSize: 14 },
    disabledBtn: { opacity: 0.5 },

    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    rowLabel: { fontSize: 15, fontWeight: "600", color: t.text },
    rowSub: { fontSize: 12, color: t.subtext, marginTop: 2 },

    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    infoKey: { fontSize: 13, color: t.subtext },
    infoVal: { fontSize: 13, color: t.text, fontWeight: "600" },
  });
