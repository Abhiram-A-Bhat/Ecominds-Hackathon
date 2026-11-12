#include <WiFi.h>
#include <HTTPClient.h>
#include "esp_sleep.h"

// Connect the ESP32 to the same Wi-Fi network as the laptop. For a Windows
// Mobile Hotspot, API_URL is commonly http://192.168.137.1:8000/api/bin-readings.
const char* WIFI_SSID = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* API_URL = "http://192.168.137.1:8000/api/bin-readings";

const char* DEVICE_ID = "ESP32-bin-01";
const char* BIN_ID = "B-101";
const char* BIN_NAME = "Live ESP32 Dustbin";

// HC-SR04: TRIG to GPIO 5; ECHO to GPIO 18 through a 5V-to-3.3V divider.
constexpr int TRIG_PIN = 5;
constexpr int ECHO_PIN = 18;
// Measure from the sensor face to the inside bottom of the empty bin.
constexpr float BIN_HEIGHT_CM = 60.0;
constexpr uint64_t SEND_INTERVAL_SECONDS = 30;

float readDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(3);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  const unsigned long duration = pulseIn(ECHO_PIN, HIGH, 30000UL);
  if (duration == 0) return -1;
  return duration * 0.0343f / 2.0f;
}

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  const unsigned long startedAt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startedAt < 20000) {
    delay(500);
    Serial.print('.');
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("Wi-Fi connected; ESP32 IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("Wi-Fi connection timed out; will retry.");
  }
}

void sendReading(float distanceCm) {
  if (WiFi.status() != WL_CONNECTED) return;
  HTTPClient http;
  http.setTimeout(4000);
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");

  String body = "{\"device_id\":\"" + String(DEVICE_ID) +
    "\",\"bin_id\":\"" + String(BIN_ID) +
    "\",\"bin_name\":\"" + String(BIN_NAME) +
    "\",\"distance_cm\":" + String(distanceCm, 1) +
    ",\"bin_height_cm\":" + String(BIN_HEIGHT_CM, 1) + "}";
  const int status = http.POST(body);
  Serial.printf("POST %s -> HTTP %d\n", API_URL, status);
  if (status > 0) Serial.println(http.getString());
  http.end();
}

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  connectWiFi();
  const float distanceCm = readDistanceCm();
  if (distanceCm > 0) {
    Serial.printf("Surface distance: %.1f cm; estimated fill: %.1f%%\n",
      distanceCm,
      max(0.0f, min(100.0f, (BIN_HEIGHT_CM - distanceCm) / BIN_HEIGHT_CM * 100.0f)));
    sendReading(distanceCm);
  } else {
    Serial.println("No echo; skipping this sample.");
  }
  Serial.printf("Sleeping for %llu seconds.\n", SEND_INTERVAL_SECONDS);
  Serial.flush();
  esp_sleep_enable_timer_wakeup(SEND_INTERVAL_SECONDS * 1000000ULL);
  esp_deep_sleep_start();
}

void loop() {}
