# Send ESP32 dustbin readings to Ecominds

The ESP32 keeps printing sensor status to Arduino Serial Monitor and also sends
each reading to the laptop's Ecominds API over Wi-Fi. No MQTT broker is needed
for one ESP32: the laptop API receives a direct HTTP POST. The laptop then
forwards each reading over HTTPS to the shared cloud feed, so the deployed
Ecominds site can show the same live value.

## 1. Start Ecominds on the laptop

Keep both processes running:

```powershell
py backend/server.py
```

In a second PowerShell window, from the Ecominds project folder:

```powershell
npm run dev -- --host 0.0.0.0 --port 5173
```

Open [http://localhost:5173](http://localhost:5173), sign in, then go to
**Campus Bins → Live**. Check that the API is running by opening
`http://127.0.0.1:8000/health` on the laptop.

Keep the laptop connected to the internet and leave its FastAPI backend running.
The backend reads its cloud-relay URL and private token from the ignored local
`.env` file; never paste that token into the ESP32 sketch or commit it. The
deployed page reads only the public, read-only cloud feed. It refreshes every
two seconds; the ESP32 sends a new sample every ten seconds.

## 2. Put the laptop and ESP32 on the same Wi-Fi

Use a **2.4 GHz** network; ESP32 boards cannot connect to a 5 GHz-only Wi-Fi
network. The laptop and ESP32 must join the same router or hotspot. The ESP32
does not create a hotspot in this sketch.

On this laptop, `ipconfig` currently reports Wi-Fi IPv4 address `192.168.1.43`.
If both devices join that same router, use this API URL in the sketch:

```cpp
const char* API_URL = "http://192.168.1.43:8000/api/bin-readings";
```

If the laptop's address changes, run `ipconfig` again and use the IPv4 address
for the adapter that the ESP32 is also connected through. Do not put
`localhost` in `API_URL`; on the ESP32, localhost means the ESP32 itself.

If you instead turn on Windows Mobile Hotspot on the laptop, connect the ESP32
to that hotspot's Wi-Fi name and password. Find the hotspot adapter's address
in `ipconfig` (often `192.168.137.1`) and use that address in `API_URL`.

## 3. Allow the API through Windows Firewall

The backend listens on port 8000 on the laptop's network interfaces so the
ESP32 can reach it. If Windows asks, allow Python on **Private networks**. If
it does not ask and uploads fail, open **Windows Security → Firewall & network
protection → Allow an app through firewall**, then allow the Python executable
on your Private network. Keep the current network profile set to Private.

## 4. Check wiring and calibration

| HC-SR04 | ESP32 |
| --- | --- |
| VCC | regulated 5 V / VIN |
| GND | GND |
| TRIG | GPIO 5 |
| ECHO | GPIO 18 through a voltage divider |

The HC-SR04 ECHO pin outputs 5 V; ESP32 GPIO is 3.3 V. Use a voltage divider
(for example, 1 kΩ from ECHO to GPIO 18 and 2 kΩ from GPIO 18 to GND) or a
logic-level shifter. Connect the sensor and ESP32 grounds together.

The sketch uses your calibration values:

```cpp
constexpr float EMPTY_DISTANCE_CM = 30.0f;
constexpr float FULL_DISTANCE_CM = 5.0f;
```

Measure from the sensor face. Set `EMPTY_DISTANCE_CM` to the reading when the
bin is empty and `FULL_DISTANCE_CM` to the reading at the fill level you want
to call 100%. Keep the sensor pointed straight down, away from the bin walls.

## 5. Configure and upload the sketch

1. Open `esp32_ultrasonic_bin.ino` in Arduino IDE and select your ESP32 board
   and USB port.
2. Change `WIFI_SSID` and `WIFI_PASSWORD` to the exact 2.4 GHz Wi-Fi
   credentials. Set `API_URL` to the laptop address from step 2.
3. Keep `BIN_ID` as `B-101` unless you also change `VITE_LIVE_BIN_ID` in the
   laptop's `.env`. The project `.env` already uses `B-101`.
4. Click **Upload**. Open **Tools → Serial Monitor**, set the speed to
   **115200 baud**, and press the ESP32 reset button once if the output does
   not start.
5. Look for `Wi-Fi connected`, `HTTP response: 200`, and `Laptop accepted
   reading`. The sketch takes 10 samples, filters out spikes using the median,
   prints distance/fill/status to Serial Monitor, sends the reading, then sleeps
   for 10 seconds to reduce ESP32 battery use.
6. In local Ecominds and on the deployed site, open **Campus Bins → Live**.
   Both read the shared cloud feed and show the latest fill percentage and
   percentage of capacity remaining.

The fill calculation used in both the sketch and backend is:

```text
clamp((empty distance - measured distance) /
      (empty distance - full distance) * 100, 0, 100)
```

For example, a 17.5 cm reading with the 30 cm / 5 cm calibration is 50% full.

## If it does not connect

- `Wi-Fi connection failed`: check the SSID, password, and that the network is
  2.4 GHz.
- `HTTP response: -1` or another negative code: confirm the laptop IPv4 in
  `API_URL`, verify `http://127.0.0.1:8000/health` works on the laptop, and
  allow Python through the Private-network firewall.
- HTTP `422`: check the calibration values and ensure `EMPTY_DISTANCE_CM` is
  greater than `FULL_DISTANCE_CM`.
- Ecominds says **Signal stale**: the API has not received a reading for 60
  seconds. Check Serial Monitor for an HTTP 200 response.
- The local app updates but the deployed site does not: confirm the laptop has
  internet access, the backend window is still running, and its log says
  `[Bin sensor] Forwarded B-101 reading to cloud.` The cloud feed needs the
  laptop bridge to stay online.

If you need faster updates while tuning, change `SEND_INTERVAL_SECONDS` from
10 to 5. Deep sleep reduces ESP32 power draw, but the HC-SR04 itself remains
powered; reducing sensor battery use further requires switching its VCC with a
MOSFET or power switch.
