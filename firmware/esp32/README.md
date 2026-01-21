## Firmware Overview

This firmware runs on an ESP32 and performs:
- Grip pressure sensing using two FSR sensors
- Motion detection using MPU6050 gyroscope
- Rule-based motor speed control via L298N driver

### Core Logic
- Sensor data is sampled periodically
- Motion is averaged over a time window
- Safety decisions are based on consecutive patterns
- Motor speed transitions are gradual to avoid jerks
