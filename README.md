# GripSense 🖐️  
### Intelligent Grip, Motion & Emergency-Aware Safety System

GripSense is an advanced **embedded IoT safety system** that intelligently combines grip pressure sensing, motion analysis, and cloud-connected emergency response to dynamically control motor behavior and trigger safety alerts in real time.

The system enhances **human–machine interaction safety** by detecting unstable conditions and enabling remote emergency notifications — even when the mobile app is closed.

---

## 🚩 Problem Statement

Traditional motor-driven assistive or handheld systems lack awareness of:

- User grip strength
- Sudden or unsafe motion
- Fall-like conditions

This can lead to:

- Mechanical instability  
- Loss of control  
- Unsafe operation  
- Delayed emergency response  

In real-world scenarios, users may be unable to react quickly during unsafe conditions.

---

## 💡 Solution

GripSense integrates:

- **Force Sensitive Resistors (FSR)** → Grip pressure analysis  
- **MPU6050 Gyroscope** → Motion & fall detection  
- **ESP32 Wi-Fi Module** → Cloud communication  
- **Mobile Application** → Monitoring & emergency setup  

The system:

✔️ Dynamically adjusts motor speed based on safety  
✔️ Detects unsafe motion & fall-like patterns  
✔️ Sends real-time data to cloud  
✔️ Tracks user location silently in background  
✔️ Automatically sends emergency SMS alerts  

---

## 🧠 Key Features

### 🔹 Embedded Safety Control
- Real-time grip pressure normalization  
- Motion classification using sliding window analysis  
- Pattern-based danger detection  
- Gentle acceleration & deceleration  

### 🔹 Fall & Risk Detection
- Multi-sensor fusion (Grip + Motion)
- Critical risk state detection
- Automated safety logic execution

### 🔹 Cloud Connectivity
- ESP32 streams live sensor data to backend
- REST-based location updates from mobile app
- Event-driven emergency logic

### 🔹 Background Location Tracking
- Runs even when mobile app is closed
- Updates last known user location periodically

### 🔹 Emergency SMS Alerts
When **CRITICAL risk** is detected:

➡️ Backend triggers emergency SMS  
➡️ Includes last known live location  
➡️ Works even if:
- App is closed  
- Phone is locked  
- User is unconscious  

---

## 🏗️ System Architecture

![Architecture](docs/architecture.png)

---

## 🔄 System Flow

![System Flow](docs/system-flow.png)

---

## 🔌 Circuit Diagram

![Circuit Diagram](docs/circuitdiagram.jpg)

---

## 📱 Mobile Application

Built using **React Native (Expo)**

Provides:

- Live sensor monitoring dashboard
- Emergency contact setup
- Background location tracking
- Real-time risk visualization

---

## 🌐 Backend Services

- Node.js + Express server
- Real-time ESP32 communication via Socket.IO
- REST APIs for:
  - Location updates
  - Emergency contact storage
- Automated SMS trigger using cloud gateway

---

## 📡 Emergency Flow

```
Unsafe Motion / Fall Detected
        ↓
ESP32 sends CRITICAL state
        ↓
Backend receives alert
        ↓
Last known mobile location retrieved
        ↓
Emergency SMS sent
```

---

## ▶️ Watch Full Demo Video:
https://drive.google.com/file/d/1elsRZMTPvooa_Qo_aMxw_2bkWMY5SjzO/view

---

## 🛠️ Tech Stack

### Embedded
- ESP32
- Force Sensitive Resistors (FSR)
- MPU6050 (Gyroscope)
- L298N Motor Driver
- Embedded C / Arduino

### Mobile
- React Native (Expo)
- Background Location Tracking

### Backend
- Node.js
- Express.js
- Socket.IO
- REST APIs

### Cloud Integration
- SMS Gateway API

---

## 🚀 Future Enhancements

- AI-based fall prediction
- Health monitoring integration
- Cloud analytics dashboard
- BLE fallback communication
- Assistive robotics integration

---

## 📜 License
MIT License
