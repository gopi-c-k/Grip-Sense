# GripSense Mobile App

A React Native (Expo) app for real-time grip and fall detection monitoring via ESP32.

---

## 📦 Setup

```bash
# 1. Install dependencies
npm install

# 2. Start Expo
npx expo start
```

---

## 🔁 Configure Your Socket Endpoint

Open `screens/Dashboard.js` and update line 9:

```js
const SOCKET_URL = "https://gripsense/getdata"; // ← Replace with your IP/URL
```

For local ESP32/server testing use your machine's local IP:
```js
const SOCKET_URL = "http://192.168.1.XXX:3000";
```

---

## 📡 Expected Socket Data from ESP32

Your ESP32/backend should emit a `data` event with this JSON:

```json
{
  "fsr1": 18,
  "fsr2": 22,
  "motionStatus": "danger",
  "motorSpeed": 0,
  "riskLevel": "CRITICAL"
}
```

`riskLevel` options: `"NORMAL"` | `"MEDIUM"` | `"HIGH"` | `"CRITICAL"`

---

## ✅ Features

| Feature | Description |
|--------|-------------|
| 📊 Live Dashboard | Real-time sensor data via Socket.IO |
| 🚨 Critical Alert | 10-second countdown before sending SMS |
| ❌ Cancel Alert | User can cancel if false alarm |
| 📲 Emergency SMS | Sends GPS location to saved contact |
| 🌗 Dark Mode | Toggle in Settings |
| 🔐 Secure Storage | Emergency number saved with expo-secure-store |
| 📲 Test SMS | Send a test alert from Settings |

---

## 📁 File Structure

```
/App.js                   → Navigation + Theme wrapper
/context/ThemeContext.js  → Light/Dark theme provider
/screens/Dashboard.js     → Live sensor dashboard
/screens/Settings.js      → Emergency number + theme toggle
/utils/emergency.js       → SMS trigger with GPS location
/package.json
/app.json
```

---

## 🛠 Required Permissions

- **Location** – to attach GPS coordinates to emergency SMS
- **SMS** – to send the emergency message (Android)
