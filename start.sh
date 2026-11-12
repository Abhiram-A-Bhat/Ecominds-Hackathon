#!/bin/bash
# EcoSphere Campus OS — Launcher for macOS / Linux

set -e

echo "==============================================================================="
echo "               ECOSPHERE CAMPUS OS (RNSIT) — SYSTEM LAUNCHER"
echo "==============================================================================="

if [ ! -d "node_modules" ] || [ ! -d "venv" ]; then
    echo "[*] Initial setup required. Running ./setup.sh ..."
    ./setup.sh
fi

source venv/bin/activate

echo "[*] Starting Python FastAPI AI Backend on http://127.0.0.1:8000 ..."
python backend/server.py &
BACKEND_PID=$!

echo "[*] Waiting for backend to initialize..."
sleep 2

echo "[*] Starting Vite Frontend on http://localhost:5173 ..."
node ./node_modules/vite/bin/vite.js --port 5173 &
FRONTEND_PID=$!

sleep 2

# Open browser
if command -v open &> /dev/null; then
    open http://localhost:5173/
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:5173/
fi

echo ""
echo "==============================================================================="
echo "                ECOSPHERE CAMPUS OS (RNSIT) — RUNNING"
echo "==============================================================================="
echo " [+] Frontend:  http://localhost:5173/"
echo " [+] AI Engine: http://127.0.0.1:8000/"
echo " [+] PID Backend: $BACKEND_PID | PID Frontend: $FRONTEND_PID"
echo "==============================================================================="
echo " Press Ctrl+C to terminate both servers."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM
wait
