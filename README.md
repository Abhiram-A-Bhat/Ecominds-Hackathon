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
