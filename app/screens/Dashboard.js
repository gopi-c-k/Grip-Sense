import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Vibration,
  Alert,
  Dimensions,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import io from "socket.io-client";
import * as SecureStore from "expo-secure-store";
import { triggerSMS } from "../utils/emergency";
import { useTheme } from "../context/ThemeContext";

const SOCKET_URL = "https://grip-sense.onrender.com"; // 🔁 Replace with your actual endpoint
const COUNTDOWN_SECONDS = 10;
const MAX_DATA_POINTS = 20; // Number of data points to show on graph

let socket = null;

export default function Dashboard() {
  const { theme } = useTheme();
  const [data, setData] = useState({
    fsr1: "--",
    fsr2: "--",
    motionStatus: "idle",
    motorSpeed: 0,
    riskLevel: "NORMAL",
  });
  const [connected, setConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [smsSent, setSmsSent] = useState(false);
  
  // Graph data states
  const [fsr1History, setFsr1History] = useState([0]);
  const [fsr2History, setFsr2History] = useState([0]);
  const [motorSpeedHistory, setMotorSpeedHistory] = useState([0]);
  
  const countdownRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const alertActive = useRef(false);

  // Pulse animation for critical state
  const startPulse = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  const stopPulse = useCallback(() => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  }, [pulseAnim]);

  const cancelAlert = useCallback(() => {
    clearInterval(countdownRef.current);
    setCountdown(null);
    alertActive.current = false;
    stopPulse();
  }, [stopPulse]);

  const startCountdown = useCallback(async () => {
    if (alertActive.current) return;
    alertActive.current = true;
    setSmsSent(false);
    startPulse();
    Vibration.vibrate([500, 200, 500, 200, 500]);

    let remaining = COUNTDOWN_SECONDS;
    setCountdown(remaining);

    countdownRef.current = setInterval(async () => {
      remaining -= 1;
      setCountdown(remaining);

      if (remaining <= 0) {
        clearInterval(countdownRef.current);
        setCountdown(null);
        alertActive.current = false;
        stopPulse();

        const number = await SecureStore.getItemAsync("emergencyNumber");
        if (number) {
          const result = await triggerSMS(number);
          if (result.success) setSmsSent(true);
        } else {
          Alert.alert(
            "No Emergency Number",
            "Please set an emergency number in Settings.",
            [{ text: "OK" }]
          );
        }
      }
    }, 1000);
  }, [startPulse, stopPulse]);

  // Update graph history
  const updateHistory = useCallback((newData) => {
    const fsr1Value = typeof newData.fsr1 === 'number' ? newData.fsr1 : 0;
    const fsr2Value = typeof newData.fsr2 === 'number' ? newData.fsr2 : 0;
    const motorValue = typeof newData.currentSpeed === 'number' ? newData.currentSpeed : 0;

    setFsr1History(prev => {
      const updated = [...prev, fsr1Value];
      return updated.length > MAX_DATA_POINTS ? updated.slice(1) : updated;
    });

    setFsr2History(prev => {
      const updated = [...prev, fsr2Value];
      return updated.length > MAX_DATA_POINTS ? updated.slice(1) : updated;
    });

    setMotorSpeedHistory(prev => {
      const updated = [...prev, motorValue];
      return updated.length > MAX_DATA_POINTS ? updated.slice(1) : updated;
    });
  }, []);

  useEffect(() => {
    socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on("connect", () => {
      socket.emit("register", "app");
      setConnected(true);
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));

    socket.on("app-data", (incoming) => {
      setData(incoming);
      setLastUpdated(new Date());
      updateHistory(incoming);
      
      if (incoming.riskLevel === "CRITICAL") {
        startCountdown();
      } else {
        cancelAlert();
      }
    });

    return () => {
      socket.disconnect();
      clearInterval(countdownRef.current);
    };
  }, [startCountdown, cancelAlert, updateHistory]);

  const getRiskColor = (level) => {
    switch (level) {
      case "CRITICAL": return theme.danger;
      case "HIGH": return theme.warning;
      case "MEDIUM": return theme.warning;
      default: return theme.success;
    }
  };

  const getMotionColor = (status) => {
    if (!status || status === "idle" || status === "stable") return theme.success;
    if (status === "moving") return theme.warning;
    return theme.danger;
  };

  const s = styles(theme);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>GripSense</Text>
          <Text style={s.subtitle}>Live Monitoring Dashboard</Text>
        </View>
        <View style={[s.statusDot, { backgroundColor: connected ? theme.success : theme.danger }]}>
          <Text style={s.statusText}>{connected ? "LIVE" : "OFF"}</Text>
        </View>
      </View>

      {/* CRITICAL ALERT BANNER */}
      {countdown !== null && (
        <Animated.View style={[s.alertBanner, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={s.alertTitle}>⚠️  CRITICAL ALERT DETECTED</Text>
          <Text style={s.alertSub}>
            Sending emergency SMS in{" "}
            <Text style={s.alertCount}>{countdown}s</Text>
          </Text>
          <TouchableOpacity style={s.cancelBtn} onPress={cancelAlert}>
            <Text style={s.cancelText}>I'm OK – Cancel SMS</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {smsSent && (
        <View style={[s.alertBanner, { backgroundColor: theme.success }]}>
          <Text style={[s.alertTitle, { color: "#fff" }]}>✅  Emergency SMS Sent</Text>
          <Text style={[s.alertSub, { color: "#fff" }]}>
            Your emergency contact has been notified with your location.
          </Text>
        </View>
      )}

      {/* Risk Level Card */}
      <View style={[s.riskCard, { borderColor: getRiskColor(data.riskLevel), backgroundColor: data.riskLevel === "CRITICAL" ? theme.dangerLight : theme.card }]}>
        <Text style={s.riskLabel}>RISK LEVEL</Text>
        <Text style={[s.riskValue, { color: getRiskColor(data.riskLevel) }]}>
          {data.riskLevel || "NORMAL"}
        </Text>
      </View>

      {/* FSR Sensors with Graphs */}
      <View style={s.graphSection}>
        <Text style={s.sectionTitle}>Force Sensors (FSR)</Text>
        
        <GraphCard
          theme={theme}
          icon="👋"
          label="FSR Sensor 1"
          value={data.fsr1 ?? "--"}
          unit="N"
          history={fsr1History}
          color={theme.accent}
        />
        
        <GraphCard
          theme={theme}
          icon="✋"
          label="FSR Sensor 2"
          value={data.fsr2 ?? "--"}
          unit="N"
          history={fsr2History}
          color={theme.accent}
        />
      </View>

      {/* Motor Speed with Graph */}
      <View style={s.graphSection}>
        <Text style={s.sectionTitle}>Motor Performance</Text>
        
        <GraphCard
          theme={theme}
          icon="⚙️"
          label="Motor Speed"
          value={data.currentSpeed ?? 0}
          unit="rpm"
          history={motorSpeedHistory}
          color={theme.accent}
        />
      </View>

      {/* Motion Status Card */}
      <View style={s.motionSection}>
        <MetricCard
          theme={theme}
          icon="🏃"
          label="Motion Status"
          value={data.motionStatus ?? "idle"}
          color={getMotionColor(data.motionStatus)}
          capitalize
        />
      </View>

      {/* Last Updated */}
      {lastUpdated && (
        <Text style={s.updated}>
          Last updated: {lastUpdated.toLocaleTimeString()}
        </Text>
      )}

      {!connected && (
        <View style={s.offlineBanner}>
          <Text style={s.offlineText}>
            🔌  Not connected to GripSense device. Retrying...
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function GraphCard({ theme, icon, label, value, unit, history, color }) {
  const s = graphCardStyles(theme);
  const screenWidth = Dimensions.get("window").width;
  
  const chartConfig = {
    backgroundColor: theme.card,
    backgroundGradientFrom: theme.card,
    backgroundGradientTo: theme.card,
    decimalPlaces: 1,
    color: (opacity = 1) => color,
    labelColor: (opacity = 1) => theme.subtext,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: color,
    },
    propsForBackgroundLines: {
      strokeDasharray: "",
      stroke: theme.dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
      strokeWidth: 1,
    },
  };

  const chartData = {
    labels: history.map((_, i) => (i % 5 === 0 ? "" : "")), // Empty labels for cleaner look
    datasets: [
      {
        data: history.length > 0 ? history : [0],
        color: (opacity = 1) => color,
        strokeWidth: 2.5,
      },
    ],
  };

  return (
    <View style={s.card}>
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.icon}>{icon}</Text>
          <View>
            <Text style={s.label}>{label}</Text>
            <Text style={[s.value, { color }]}>
              {value}
              {unit ? <Text style={s.unit}> {unit}</Text> : null}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={s.chartContainer}>
        <LineChart
          data={chartData}
          width={screenWidth - 60}
          height={180}
          chartConfig={chartConfig}
          bezier
          style={s.chart}
          withInnerLines={true}
          withOuterLines={false}
          withVerticalLabels={false}
          withHorizontalLabels={true}
          withDots={true}
          withShadow={false}
          fromZero
        />
      </View>
    </View>
  );
}

function MetricCard({ theme, icon, label, value, color, capitalize }) {
  const s = cardStyles(theme);
  return (
    <View style={s.card}>
      <Text style={s.icon}>{icon}</Text>
      <Text style={s.label}>{label}</Text>
      <Text style={[s.value, { color, textTransform: capitalize ? "capitalize" : "none" }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = (t) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    content: { padding: 20, paddingBottom: 40 },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 24,
      marginTop: 8,
    },
    title: { fontSize: 26, fontWeight: "800", color: t.text },
    subtitle: { fontSize: 13, color: t.subtext, marginTop: 2 },
    statusDot: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    statusText: { color: "#fff", fontSize: 11, fontWeight: "700" },

    alertBanner: {
      backgroundColor: t.dangerLight,
      borderWidth: 2,
      borderColor: t.danger,
      borderRadius: 16,
      padding: 18,
      marginBottom: 16,
      alignItems: "center",
    },
    alertTitle: {
      fontSize: 17,
      fontWeight: "800",
      color: t.danger,
      marginBottom: 6,
    },
    alertSub: { fontSize: 14, color: t.danger, textAlign: "center" },
    alertCount: { fontSize: 22, fontWeight: "900" },
    cancelBtn: {
      marginTop: 14,
      backgroundColor: t.danger,
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 30,
    },
    cancelText: { color: "#fff", fontWeight: "700", fontSize: 15 },

    riskCard: {
      borderWidth: 2,
      borderRadius: 16,
      padding: 20,
      alignItems: "center",
      marginBottom: 24,
    },
    riskLabel: { fontSize: 11, fontWeight: "700", color: t.subtext, letterSpacing: 2 },
    riskValue: { fontSize: 36, fontWeight: "900", marginTop: 4 },

    graphSection: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: t.text,
      marginBottom: 12,
      letterSpacing: 0.5,
    },

    motionSection: {
      marginBottom: 24,
    },

    updated: { textAlign: "center", color: t.subtext, fontSize: 12, marginTop: 20 },

    offlineBanner: {
      marginTop: 16,
      backgroundColor: t.accentLight,
      borderRadius: 12,
      padding: 14,
    },
    offlineText: { color: t.subtext, fontSize: 13, textAlign: "center" },
  });

const graphCardStyles = (t) =>
  StyleSheet.create({
    card: {
      backgroundColor: t.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: t.dark ? 0.4 : 0.06,
      shadowRadius: 8,
      elevation: 3,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    icon: { fontSize: 32 },
    label: { fontSize: 12, color: t.subtext, fontWeight: "600", letterSpacing: 0.5 },
    value: { fontSize: 28, fontWeight: "800", marginTop: 2 },
    unit: { fontSize: 16, fontWeight: "500" },
    chartContainer: {
      alignItems: "center",
      marginTop: 8,
    },
    chart: {
      borderRadius: 12,
    },
  });

const cardStyles = (t) =>
  StyleSheet.create({
    card: {
      backgroundColor: t.card,
      borderRadius: 16,
      padding: 20,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: t.dark ? 0.4 : 0.06,
      shadowRadius: 8,
      elevation: 3,
    },
    icon: { fontSize: 32, marginBottom: 12 },
    label: { fontSize: 12, color: t.subtext, fontWeight: "600", letterSpacing: 0.5 },
    value: { fontSize: 26, fontWeight: "800", marginTop: 6 },
  });