#include <WiFi.h>
#include <HTTPClient.h>
#include "esp_sleep.h"
#include "wifi_credentials.h"

// Connect only to the Motorola Edge 40 2.4 GHz hotspot in wifi_credentials.h.

// Laptop's Wi-Fi IPv4 address, not localhost. Update if the laptop's address changes.
const char* API_URL = "http://10.50.45.6:8000/api/bin-readings";

const char* DEVICE_ID = "ESP32-bin-01";
const char* BIN_ID = "B-101"; // Must match VITE_LIVE_BIN_ID in the laptop's .env.
const char* BIN_NAME = "Live ESP32 Dustbin";

// HC-SR04: TRIG -> GPIO 5; ECHO -> GPIO 18 through a 5 V to 3.3 V divider.
constexpr int TRIG_PIN = 5;
constexpr int ECHO_PIN = 18;

// Your calibration: empty bin reads about 30 cm; full bin reads about 5 cm.
constexpr float EMPTY_DISTANCE_CM = 30.0f;
constexpr float FULL_DISTANCE_CM = 5.0f;

// Battery-friendly: measure, post, then sleep. Change to 5 for quicker updates.
constexpr uint64_t SEND_INTERVAL_SECONDS = 10;
constexpr int SAMPLE_COUNT = 10;

float readDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(3);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  const unsigned long duration = pulseIn(ECHO_PIN, HIGH, 30000UL);
  if (duration == 0) return -1.0f;
  return duration * 0.0343f / 2.0f;
}

// Median of valid samples rejects occasional HC-SR04 spikes better than a mean.
float readFilteredDistanceCm(int& validCount) {
  float samples[SAMPLE_COUNT];
  validCount = 0;
  for (int i = 0; i < SAMPLE_COUNT; i++) {
    const float sample = readDistanceCm();
    if (sample >= 2.0f && sample <= 400.0f) samples[validCount++] = sample;
    delay(50);
  }
  if (validCount == 0) return -1.0f;

  for (int i = 0; i < validCount - 1; i++) {
    for (int j = i + 1; j < validCount; j++) {
      if (samples[j] < samples[i]) {
        const float temp = samples[i];
        samples[i] = samples[j];
        samples[j] = temp;
      }
    }
  }
  if (validCount % 2 == 1) return samples[validCount / 2];
  return (samples[validCount / 2 - 1] + samples[validCount / 2]) / 2.0f;
}

float fillPercentFor(float distanceCm) {
  const float percent = (EMPTY_DISTANCE_CM - distanceCm) /
    (EMPTY_DISTANCE_CM - FULL_DISTANCE_CM) * 100.0f;
  return constrain(percent, 0.0f, 100.0f);
}

const char* fillStatus(float percent) {
  if (percent < 1.0f) return "EMPTY";
  if (percent <= 30.0f) return "LOW";
  if (percent <= 70.0f) return "MEDIUM";
  if (percent < 90.0f) return "ALMOST FULL";
  return "FULL";
}

bool connectToSavedNetwork(int index, int rssi) {
  const char* ssid = WIFI_NETWORKS[index].ssid;
  const char* password = WIFI_NETWORKS[index].password;

  WiFi.disconnect(false, false);
  delay(150);
  Serial.printf("Connecting to saved network: %s", ssid);
  if (rssi > -1000) Serial.printf(" (signal %d dBm)", rssi);
  Serial.println();

  if (password[0] == '\0') WiFi.begin(ssid); // Supports an intentionally open network.
  else WiFi.begin(ssid, password);

  const unsigned long startedAt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startedAt < 15000UL) {
    delay(500);
    Serial.print('.');
  }
  Serial.println();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.printf("Could not join %s; will retry after the next wake.\n", ssid);
    WiFi.disconnect(false, false);
    return false;
  }

  Serial.printf("Connected to %s. ESP32 IP: %s\n", ssid, WiFi.localIP().toString().c_str());
  return true;
}

bool connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return true;
  WiFi.mode(WIFI_STA);
  if (WIFI_NETWORK_COUNT == 0 || WIFI_NETWORKS[0].ssid[0] == '\0') {
    Serial.println("No Motorola hotspot credentials configured. Check wifi_credentials.h.");
    return false;
  }
  return connectToSavedNetwork(0, WiFi.RSSI());
}

void sendReading(float distanceCm, float fillPercent) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Upload skipped: ESP32 is not connected to Wi-Fi.");
    return;
  }

  HTTPClient http;
  http.setConnectTimeout(4000);
  http.setTimeout(5000);
  if (!http.begin(API_URL)) {
    Serial.println("Could not initialize HTTP connection.");
    return;
  }
  http.addHeader("Content-Type", "application/json");

  String body = "{\"device_id\":\"" + String(DEVICE_ID) +
    "\",\"bin_id\":\"" + String(BIN_ID) +
    "\",\"bin_name\":\"" + String(BIN_NAME) +
    "\",\"distance_cm\":" + String(distanceCm, 1) +
    ",\"empty_distance_cm\":" + String(EMPTY_DISTANCE_CM, 1) +
    ",\"full_distance_cm\":" + String(FULL_DISTANCE_CM, 1) + "}";

  Serial.printf("Uploading to %s\n", API_URL);
  const int httpCode = http.POST(body);
  Serial.printf("HTTP response: %d\n", httpCode);
  if (httpCode > 0) {
    Serial.println(http.getString());
    if (httpCode >= 200 && httpCode < 300) {
      Serial.printf("Laptop accepted reading: %.1f%% full (%s)\n", fillPercent, fillStatus(fillPercent));
    }
  } else {
    Serial.printf("Upload failed: %s\n", HTTPClient::errorToString(httpCode).c_str());
  }
  http.end();
}

void setup() {
  Serial.begin(115200);
  delay(250);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  digitalWrite(TRIG_PIN, LOW);

  Serial.println("\n===== ECOMINDS SMART DUSTBIN =====");
  connectWiFi();

  int validCount = 0;
  const float distanceCm = readFilteredDistanceCm(validCount);
  if (distanceCm < 0.0f) {
    Serial.println("Sensor error: no valid echoes. Check power, ground, TRIG and ECHO wiring.");
  } else {
    const float fillPercent = fillPercentFor(distanceCm);
    Serial.printf("Valid samples: %d/%d\n", validCount, SAMPLE_COUNT);
    Serial.printf("Distance to waste: %.1f cm\n", distanceCm);
    Serial.printf("Dustbin filled: %.1f%%\n", fillPercent);
    Serial.printf("Status: %s\n", fillStatus(fillPercent));
    sendReading(distanceCm, fillPercent);
  }

  Serial.printf("Sleeping %llu seconds before the next sample.\n", SEND_INTERVAL_SECONDS);
  Serial.flush();
  esp_sleep_enable_timer_wakeup(SEND_INTERVAL_SECONDS * 1000000ULL);
  esp_deep_sleep_start();
}

void loop() {}
