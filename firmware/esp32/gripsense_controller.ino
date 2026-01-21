#include <Wire.h> 
#include <Adafruit_MPU6050.h> 
#include <Adafruit_Sensor.h> 
Adafruit_MPU6050 mpu; 
const int ENA = 25;  
const int IN1 = 26;   
const int IN2 = 27;  
const int fsr1 = 34;  
const int fsr2 = 35;  
const int fsr1_max = 4095; 
const int fsr2_max = 3000; 
const int pwmFreq = 5000; 
const int pwmResolution = 8; 
const float mediumThreshold = 0.8; 
const float dangerThreshold = 1.8;      
const unsigned long sampleInterval = 50;  
const unsigned long windowTime = 500;     
int baseSpeed = 255;            
int currentSpeed = 255;     
int targetSpeed = 255;          
const int speedChangeRate = 2; 
const float fsrThreshold = 45.0;  
int fsrSpeedReduction = 0;      
float sumRate = 0; 
int sampleCount = 0; 
unsigned long lastSample = 0; 
unsigned long windowStart = 0; 
String currentStatus = "normal"; 
String lastStatus = "normal"; 
int consecutiveDanger = 0; 
int consecutiveMedium = 0; 
int consecutiveNormal = 0; 
void setup() { 
  Serial.begin(115200); 
  Wire.begin(21, 22);
  pinMode(IN1, OUTPUT); 
  pinMode(IN2, OUTPUT); 
  digitalWrite(IN1, HIGH); 
  digitalWrite(IN2, LOW); 
  ledcAttach(ENA, pwmFreq, pwmResolution); 
  if (!mpu.begin(0x68, &Wire)) { 
    Serial.println("Failed to find MPU6050 chip"); 
    while (1) delay(10); 
  } 
  Serial.println("MPU6050 Found!"); 
  mpu.setGyroRange(MPU6050_RANGE_500_DEG); 
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ); 
  windowStart = millis(); 
  ledcWrite(ENA, currentSpeed); 
} 
void updateConsecutiveCount(String status) { 
  if (status == lastStatus) { 
  if (status == "danger") { 
      consecutiveDanger++; 
      consecutiveMedium = 0; 
      consecutiveNormal = 0; 
    } else if (status == "medium") { 
      consecutiveMedium++; 
      consecutiveDanger = 0; 
      consecutiveNormal = 0; 
    } else { 
      consecutiveNormal++; 
      consecutiveDanger = 0; 
      consecutiveMedium = 0; 
    } 
  } else { 
    consecutiveDanger = (status == "danger") ? 1 : 0; 
    consecutiveMedium = (status == "medium") ? 1 : 0; 
    consecutiveNormal = (status == "normal") ? 1 : 0; 
  } 
  lastStatus = status; 
} 
void calculateFSRSpeedReduction(float norm1, float norm2) { 
  if (norm1 <= fsrThreshold || norm2 <= fsrThreshold) { 
    float minFSR = min(norm1, norm2); 

    if (minFSR <= fsrThreshold) { 
      float reductionFactor = (fsrThreshold - minFSR) / fsrThreshold; 
      fsrSpeedReduction = (int)(reductionFactor * 150); 
    } 
  } else { 
    fsrSpeedReduction = 0; 
  } 
} 
void calculateTargetSpeed() { 
  int baseTargetSpeed; 
  if (consecutiveDanger >= 6) { 
    baseTargetSpeed = 0; 
  } 
  else if (consecutiveDanger >= 4 && consecutiveDanger <= 5) { 
    baseTargetSpeed = 40; 
  } 
  else if (consecutiveMedium >= 2 && consecutiveDanger > 0) { 
    baseTargetSpeed = 40; 
  } 
  else if (consecutiveMedium >= 3) { 
    baseTargetSpeed = 100; 
  } 
  else if (consecutiveNormal >= 3) { 
    baseTargetSpeed = baseSpeed; 
  } 
  else { 
    baseTargetSpeed = targetSpeed; 
  } 
  targetSpeed = baseTargetSpeed - fsrSpeedReduction; 
  if (targetSpeed < 0) { 
    targetSpeed = 0; 
  } 
} 
void updateMotorSpeed() { 
  if (currentSpeed < targetSpeed) { 
    currentSpeed += speedChangeRate; 
    if (currentSpeed > targetSpeed) currentSpeed = targetSpeed; 
  } else if (currentSpeed > targetSpeed) { 
    currentSpeed -= speedChangeRate; 
    if (currentSpeed < targetSpeed) currentSpeed = targetSpeed; 
  } 
  ledcWrite(ENA, currentSpeed); 
} 
void loop() {
  int raw1 = analogRead(fsr1); 
  int raw2 = analogRead(fsr2); 
  float norm1 = (raw1 * 100.0) / fsr1_max; 
  float norm2 = (raw2 * 100.0) / fsr2_max; 
  if (norm1 > 100) norm1 = 100; 
  if (norm2 > 100) norm2 = 100; 
  calculateFSRSpeedReduction(norm1, norm2); 
  if (millis() - lastSample >= sampleInterval) { 
    lastSample = millis(); 
    sensors_event_t a, g, temp; 
    mpu.getEvent(&a, &g, &temp); 
    float rateX = fabs(g.gyro.x); 
    float rateY = fabs(g.gyro.y); 
    float rateZ = fabs(g.gyro.z); 
    float maxRate = max(max(rateX, rateY), rateZ); 
    sumRate += maxRate; 
    sampleCount++; 
  } 
  if (millis() - windowStart >= windowTime) { 
    float avgRate = (sampleCount > 0) ? (sumRate / sampleCount) : 0; 
    if (avgRate < mediumThreshold) { 
      currentStatus = "normal"; 
    } else if (avgRate < dangerThreshold) { 
      currentStatus = "medium"; 
    } else { 
      currentStatus = "danger"; 
    } 
    updateConsecutiveCount(currentStatus); 
    calculateTargetSpeed(); 
    Serial.print("FSR1: "); 
    Serial.print(norm1, 1); 
    Serial.print("%   FSR2: "); 
    Serial.print(norm2, 1); 
    Serial.print("% | Status: "); 
    Serial.print(currentStatus); 
    Serial.print(" | Consecutive: D="); 
    Serial.print(consecutiveDanger); 
    Serial.print(" M="); 
    Serial.print(consecutiveMedium); 
    Serial.print(" N="); 
    Serial.print(consecutiveNormal); 
    Serial.print(" | FSR Reduction: "); 
    Serial.print(fsrSpeedReduction); 
    Serial.print(" | Speed: "); 
    Serial.print(currentSpeed); 
    Serial.print(" → "); 
    Serial.print(targetSpeed); 
    Serial.print(" | AvgRate: "); 
    Serial.println(avgRate, 2); 
    sumRate = 0; 
    sampleCount = 0; 
    windowStart = millis(); 

  } 
  updateMotorSpeed(); 
  delay(20);

} 

 
