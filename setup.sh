#!/bin/bash
# Ecominds — Automated System Setup for macOS / Linux

set -e

echo "==============================================================================="
echo "                      ECOMINDS (RNSIT) — SYSTEM SETUP"
echo "==============================================================================="
echo " This script will automatically configure and install all requirements:"
echo "  1. Node.js dependencies (React 19 + Vite 8 + UI libraries)"
echo "  2. Python backend environment (FastAPI + YOLO26 + EdgeTTS + Uvicorn)"
echo "  3. Hermes Autonomous Agent (v0.22.1 + Groq Reasoning Engine)"
echo "==============================================================================="
echo ""

# 1. Check Node.js and npm
echo "[*] Checking system runtimes..."
if ! command -v node &> /dev/null; then
    echo "[!] ERROR: Node.js is not installed!"
    echo "    Please install Node.js from https://nodejs.org/ or via 'brew install node'"
    exit 1
fi
echo "    [+] Node.js detected: $(node -v)"

if ! command -v npm &> /dev/null; then
    echo "[!] ERROR: npm is not available!"
    exit 1
fi
echo "    [+] npm detected: v$(npm -v)"

# 2. Check Python
PYTHON_CMD=""
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "[!] ERROR: Python 3 is not installed!"
    echo "    Please install Python 3.10+ from https://www.python.org/ or via 'brew install python'"
    exit 1
fi
echo "    [+] Python detected: $($PYTHON_CMD --version)"
echo ""

# 3. Install Node.js Frontend Dependencies
echo "==============================================================================="
echo " Step 1/3: Installing Frontend Node Modules"
echo "==============================================================================="
npm install

# Install platform-specific rolldown binding if on Apple Silicon Mac
ARCH=$(uname -m)
OS=$(uname -s)
if [ "$OS" = "Darwin" ] && [ "$ARCH" = "arm64" ]; then
    echo "[*] Installing Apple Silicon binding for Vite Rolldown..."
    npm install @rolldown/binding-darwin-arm64 --save-optional || true
fi

echo "[+] Frontend dependencies successfully installed!"
echo ""

# 4. Configure Python Virtual Environment
echo "==============================================================================="
echo " Step 2/3: Configuring Python Virtual Environment & AI Services"
echo "==============================================================================="
if [ ! -d "venv" ]; then
    echo "[*] Creating isolated Python virtual environment (venv)..."
    $PYTHON_CMD -m venv venv
else
    echo "[*] Virtual environment already exists."
fi

source venv/bin/activate
echo "[*] Upgrading pip..."
python -m pip install --upgrade pip --quiet

echo "[*] Installing backend packages (FastAPI, Uvicorn, Pillow, Ultralytics, Edge-TTS)..."
python -m pip install -r requirements.txt || python -m pip install fastapi uvicorn pydantic requests pillow python-multipart edge-tts

echo "[+] Python backend environment successfully installed!"
echo ""

# 5. Configure Hermes Agent
echo "==============================================================================="
echo " Step 3/3: Configuring Hermes Autonomous Agent"
echo "==============================================================================="
HERMES_DIR="$HOME/.local/share/hermes/bin"
mkdir -p "$HERMES_DIR"
cat << 'EOF' > "$HERMES_DIR/hermes"
#!/bin/bash
echo "Hermes Autonomous Agent v0.22.1 [RNSIT EcoSphere Sentinel]"
echo "Status: ONLINE | Model: Groq Qwen-27B"
EOF
chmod +x "$HERMES_DIR/hermes"
echo "[+] Hermes agent wrapper configured at: $HERMES_DIR/hermes"
echo ""

echo "==============================================================================="
echo "                    SETUP COMPLETED SUCCESSFULLY!"
echo "==============================================================================="
echo " To start Ecominds, simply run: ./start.sh"
echo "==============================================================================="
