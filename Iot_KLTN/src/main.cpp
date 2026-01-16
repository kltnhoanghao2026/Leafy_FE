#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>

// ===== WiFi =====
const char* WIFI_SSID = "Wokwi-GUEST";
const char* WIFI_PASS = "";

// ===== MQTT Public Broker =====
const char* MQTT_HOST = "test.mosquitto.org";
const int   MQTT_PORT = 1883;

// ===== IDs / Topic =====
const char* FARM_ID   = "coffee-farm-01";
const char* DEVICE_ID = "node-01";

String topicSensors = String("farm/") + FARM_ID + "/device/" + DEVICE_ID + "/sensors";
String topicStatus  = String("farm/") + FARM_ID + "/device/" + DEVICE_ID + "/status";

// ===== Sensors =====
Adafruit_BME280 bme;
bool envOk = false;

const int SOIL_PIN = 34;

// ===== MQTT =====
WiFiClient espClient;
PubSubClient mqtt(espClient);

unsigned long lastPublishMs = 0;
const unsigned long PUBLISH_INTERVAL_MS = 5000;

// ---------- Helpers ----------
void logWifiInfo() {
  Serial.print("WiFi status: ");
  Serial.print(WiFi.status());
  Serial.print(" | IP: ");
  Serial.print(WiFi.localIP());
  Serial.print(" | RSSI: ");
  Serial.println(WiFi.RSSI());
}

void connectWiFi(unsigned long timeoutMs = 15000) {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.println("\n[WiFi] Connecting...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && (millis() - start) < timeoutMs) {
    delay(250);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("[WiFi] Connected");
    logWifiInfo();

    // Optional: check DNS resolution (helps debug "can't reach broker")
    IPAddress ip;
    bool resolved = WiFi.hostByName(MQTT_HOST, ip);
    Serial.print("[WiFi] DNS ");
    Serial.print(MQTT_HOST);
    Serial.print(" -> ");
    Serial.println(resolved ? ip.toString() : String("FAILED"));
  } else {
    Serial.println("[WiFi] Connect TIMEOUT");
  }
}

const char* mqttStateToText(int st) {
  switch (st) {
    case MQTT_CONNECTION_TIMEOUT: return "TIMEOUT";
    case MQTT_CONNECTION_LOST: return "CONNECTION_LOST";
    case MQTT_CONNECT_FAILED: return "CONNECT_FAILED";
    case MQTT_DISCONNECTED: return "DISCONNECTED";
    case MQTT_CONNECTED: return "CONNECTED";
    case MQTT_CONNECT_BAD_PROTOCOL: return "BAD_PROTOCOL";
    case MQTT_CONNECT_BAD_CLIENT_ID: return "BAD_CLIENT_ID";
    case MQTT_CONNECT_UNAVAILABLE: return "UNAVAILABLE";
    case MQTT_CONNECT_BAD_CREDENTIALS: return "BAD_CREDENTIALS";
    case MQTT_CONNECT_UNAUTHORIZED: return "UNAUTHORIZED";
    default: return "UNKNOWN";
  }
}

bool connectMQTTOnce() {
  // random clientId to avoid collision on public broker
  String clientId = String("wokwi-") + DEVICE_ID + "-" + String(random(0xffff), HEX);

  // Last Will (status offline)
  String willPayload = "{\"deviceId\":\"" + String(DEVICE_ID) + "\",\"status\":\"offline\"}";
  bool ok = mqtt.connect(
    clientId.c_str(),
    topicStatus.c_str(),
    0,      // will QoS
    true,   // will retain
    willPayload.c_str()
  );

  if (!ok) {
    int st = mqtt.state();
    Serial.print("[MQTT] connect failed, state=");
    Serial.print(st);
    Serial.print(" (");
    Serial.print(mqttStateToText(st));
    Serial.println(")");
  }
  return ok;
}

void connectMQTT(unsigned long timeoutMs = 15000) {
  if (mqtt.connected()) return;
  if (WiFi.status() != WL_CONNECTED) return;

  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setKeepAlive(30);
  mqtt.setSocketTimeout(5);

  Serial.println("\n[MQTT] Connecting...");
  unsigned long start = millis();

  while (!mqtt.connected() && (millis() - start) < timeoutMs) {
    if (connectMQTTOnce()) {
      Serial.println("[MQTT] Connected");

      // Publish online status (retain)
      String onlinePayload = "{\"deviceId\":\"" + String(DEVICE_ID) + "\",\"status\":\"online\"}";
      mqtt.publish(topicStatus.c_str(), onlinePayload.c_str(), true);

      return;
    }
    delay(800);
  }

  if (!mqtt.connected()) {
    Serial.println("[MQTT] Connect TIMEOUT");
  }
}

int readSoilRaw() {
  return analogRead(SOIL_PIN); // 0..4095
}

String buildPayload(bool okEnv, float t, float h, int soil) {
  String payload = "{";
  payload += "\"farmId\":\"" + String(FARM_ID) + "\",";
  payload += "\"deviceId\":\"" + String(DEVICE_ID) + "\",";
  payload += "\"timestamp\":" + String(millis()) + ",";
  payload += "\"soilMoisture\":" + String(soil) + ",";
  payload += "\"envOk\":" + String(okEnv ? "true" : "false") + ",";

  if (okEnv) {
    payload += "\"temperature\":" + String(t, 1) + ",";
    payload += "\"humidity\":" + String(h, 1);
  } else {
    payload += "\"temperature\":null,";
    payload += "\"humidity\":null";
  }

  payload += "}";
  return payload;
}

void setup() {
  Serial.begin(115200);
  delay(200);

  randomSeed(analogRead(0));
  Serial.println("\n=== ESP32 IoT Node Start ===");

  // I2C default pins on ESP32: SDA=21, SCL=22
  Wire.begin(21, 22);

  // Try common I2C addresses
  envOk = bme.begin(0x76);
  if (!envOk) envOk = bme.begin(0x77);

  Serial.print("[BME280] init: ");
  Serial.println(envOk ? "OK" : "FAIL (will publish null temp/hum)");

  connectWiFi();
  connectMQTT();

  Serial.println("[APP] Ready");
  Serial.println("[APP] Sensors topic: " + topicSensors);
  Serial.println("[APP] Status  topic: " + topicStatus);
}

void loop() {
  // Keep connections alive
  if (WiFi.status() != WL_CONNECTED) connectWiFi();
  if (!mqtt.connected()) connectMQTT();

  mqtt.loop();

  unsigned long now = millis();
  if (now - lastPublishMs >= PUBLISH_INTERVAL_MS) {
    lastPublishMs = now;

    int soil = readSoilRaw();
    float t = NAN, h = NAN;

    if (envOk) {
      t = bme.readTemperature();
      h = bme.readHumidity();
      if (isnan(t) || isnan(h)) {
        Serial.println("[BME280] read NaN -> degrade envOk=false");
        envOk = false;
      }
    }

    String payload = buildPayload(envOk, t, h, soil);

    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("[PUBLISH] Skip (WiFi not connected)");
      Serial.println(payload);
      return;
    }
    if (!mqtt.connected()) {
      Serial.println("[PUBLISH] Skip (MQTT not connected)");
      Serial.println(payload);
      return;
    }

    bool ok = mqtt.publish(topicSensors.c_str(), payload.c_str());
    Serial.print("[PUBLISH] ");
    Serial.print(ok ? "OK" : "FAIL");
    Serial.print(" | mqtt.state=");
    Serial.print(mqtt.state());
    Serial.print(" | ");
    Serial.println(payload);
  }
}
