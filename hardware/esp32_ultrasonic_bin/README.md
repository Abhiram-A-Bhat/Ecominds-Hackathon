# ESP32 ultrasonic dustbin sensor

This sketch measures the air gap between an HC-SR04 sensor mounted inside the
bin lid and the top of the waste. The laptop backend converts that distance to
fill and remaining-space percentages. The Live tab polls the backend every two
seconds; the ESP32 uploads every five seconds.

## Connection model

For this demo, the laptop runs the API and the ESP32 sends it ordinary HTTP
requests over Wi-Fi. A message broker is a relay that many devices can publish
to and subscribe from; it is useful for larger sensor networks but is extra
infrastructure for this one-bin setup.

Connect both devices to the same 2.4 GHz Wi-Fi network (ESP32 boards generally
do not join 5 GHz-only networks). The simplest option is to enable the laptop's
mobile hotspot and connect the ESP32 to it. Leave the browser on the
laptop at `http://localhost:5173`. Set `API_URL` in the sketch to the laptop's
hotspot IPv4 address on port 8000 (Windows Mobile Hotspot commonly uses
`192.168.137.1`). A shared home/router Wi-Fi works too; use the laptop's local
IPv4 address instead. Do not use `localhost` in `API_URL`: that would point
back to the ESP32 itself. If Windows Firewall prompts you, allow Python on the
Private network so the ESP32 can reach port 8000.

## Wiring (ESP32 + HC-SR04)

| HC-SR04 | ESP32 |
| --- | --- |
| VCC | 5V / VIN |
| GND | GND |
| TRIG | GPIO 5 |
| ECHO | GPIO 18 through a voltage divider |

The HC-SR04 ECHO signal is 5 V and can damage the ESP32's 3.3 V GPIO. Use a
voltage divider (for example, 1 kΩ from ECHO to GPIO 18 and 2 kΩ from GPIO 18
to GND), or a suitable level shifter. Share ground between sensor and ESP32.

## Configure and flash

1. Open `esp32_ultrasonic_bin.ino` in Arduino IDE and install the ESP32 board
   package.
2. Replace `WIFI_SSID`, `WIFI_PASSWORD`, and `API_URL` with your network and
   laptop API address. Set `BIN_HEIGHT_CM` to the measured distance from the
   sensor face to the inside bottom of the empty bin. Set `BIN_ID` to the
   desired ID (the web app defaults to `B-101`; set `VITE_LIVE_BIN_ID` in the
   frontend `.env` to match a different ID).
3. Select the ESP32 board and port, upload, then open Serial Monitor at
   115200 baud. A successful upload prints an HTTP 200 response. The sketch
   sends one sample every 30 seconds and then uses deep sleep to reduce battery
   drain. The ESP32 reconnects to Wi-Fi after each wake.
4. In the app, open **Campus Bins → Live**. The display shows fill percentage,
   remaining capacity, sensor distance, and whether readings are arriving.

The fill calculation is `clamp((bin height − measured distance) / bin height ×
100, 0, 100)`. Keep the sensor aimed down at the waste surface, away from the
bin walls. Irregular or soft waste can cause noisy ultrasonic readings. Power
the HC-SR04 from a regulated 5 V rail and the ESP32 from its board's supported
battery input; do not connect a bare lithium cell directly to 5 V/VIN.

## API payload

The ESP32 posts JSON to `POST /api/bin-readings`:

```json
{
  "device_id": "ESP32-bin-01",
  "bin_id": "B-101",
  "bin_name": "Live ESP32 Dustbin",
  "distance_cm": 28.4,
  "bin_height_cm": 60
}
```

The latest reading is available at `GET /api/bin-readings/latest?bin_id=B-101`.
The local backend keeps the latest reading in memory, so it clears when the
backend restarts and repopulates after the next sensor upload.
