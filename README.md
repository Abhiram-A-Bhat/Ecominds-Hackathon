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
3. Open **AI Source Segregator** on the laptop and scan its QR code. It opens a
   phone capture page served by the laptop. Tap **Take photo**; Ecominds
   compresses the still image and sends it over
   `ws://<laptop-ip>:8000/ws/classify` for analysis. Open the displayed LAN URL
   directly if the QR image service is unavailable.
5. If the page cannot load, allow inbound TCP ports `5173` and `8000` in the
   laptop firewall for the private Wi-Fi network. Do not use `localhost` on the
   phone: that points to the phone itself.

The scanner is available to staff accounts. The deployed HTTPS site is not
connected to a laptop running on your private Wi-Fi; open the laptop-hosted URL
on the phone for scanning. If you host a separate secure WebSocket vision
service, set `VITE_VISION_WS_URL` to its `wss://.../ws/classify` address.

### Classifier limits and accuracy

The bundled `yolo26n.pt` is a general object detector. The backend maps a small
set of detected COCO object labels to campus disposal guidance; it is not a
material-composition model trained on RNSIT waste photos. The displayed score
is the detector's object confidence, not measured classification accuracy.
Preset test-bench cards are simulations and are marked as such. No labeled,
representative validation dataset is currently included, so the project cannot
claim an accuracy percentage. Staff should verify items—especially batteries
and other hazardous waste—before assigning points or disposing of them.

The CCTV screen uses the bundled `public/cctv/classroom-stock-demo.mp4` clip,
not an actual campus camera stream. The player labels it as stock classroom
demo footage.

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
