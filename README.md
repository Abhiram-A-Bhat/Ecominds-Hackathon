# Ecominds

Ecominds is a campus sustainability app for smart-bin monitoring, student
reports, plant care, recycling, and campus operations.

## Run locally

1. Install Node.js and Python 3.10 or later.
2. Copy `.env.example` to `.env` and add your API keys.
3. Install frontend dependencies with `npm ci`.
4. Install backend dependencies with `py -m pip install -r backend/requirements.txt`.
5. Start the API with `py backend/server.py` and the frontend with
   `npm run dev -- --host 0.0.0.0 --port 5173`.
6. Open [http://localhost:5173](http://localhost:5173).

### Use a phone camera for waste classification

1. Start both the FastAPI backend and Vite frontend on the laptop. The backend
   listens on `0.0.0.0:8000`; the Vite dev server listens on `0.0.0.0:5173`.
2. Connect the laptop and phone to the same Wi-Fi network. A phone hotspot also
   works if both devices are connected to that hotspot.
3. Find the laptop's local IPv4 address (`ipconfig` on Windows, `ip addr` on
   Linux, or `ifconfig` on macOS). For example, if it is `192.168.1.20`, open
   `http://192.168.1.20:5173` on the phone.
4. Open **AI Source Segregator** and tap **Take Photo / Choose Image**. The
   phone's rear camera opens. Capture the item; Ecominds compresses the still
   image and sends it over `ws://<laptop-ip>:8000/ws/classify` for analysis.
5. If the page cannot load, allow inbound TCP ports `5173` and `8000` in the
   laptop firewall for the private Wi-Fi network. Do not use `localhost` on the
   phone: that points to the phone itself.

The CCTV screen uses stock demo footage, not an actual campus camera stream.
The clip is [Pexels video 5823867](https://www.pexels.com/video/hallway-in-a-building-5823867/)
and is labeled as stock footage in the player.

Hermes chat and dispatch currently use the project's Groq-compatible backend
adapter. The upstream Hermes Agent source is
[NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent).
The local Hermes binary is optional; without it, the backend reports
`CLOUD_HYBRID` and uses the configured Groq API.

The Windows `setup.bat` and `start.bat` scripts can install and launch the
project as well.

## Overseer and feedback

Students apply for the Overseer seat. When an administrator appoints the next
holder, Ecominds selects the pending applicant with the highest current
EcoCredit points. Every term expires automatically after 14 days.

Students can submit campus issues from **Student Feedback**, including
concerns about Overseer conduct or negligence. Reports are stored in the local
SQLite database at `backend/ecominds_feedback.sqlite3` and appear in the admin
**Feedback Inbox**. Anonymous reports hide the student's name and USN from the
inbox.

## ESP32 bin sensor

See [the ESP32 ultrasonic bin guide](hardware/esp32_ultrasonic_bin/README.md)
for wiring, Wi-Fi setup, and firmware instructions.
