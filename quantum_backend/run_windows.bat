@echo off
cd /d "%~dp0"

if not exist .venv (
    python -m venv .venv
)

call .venv\Scripts\activate

python -m pip install --upgrade pip
pip install -r requirements.txt

if not exist .env (
    copy .env.example .env
    echo.
    echo Created .env from .env.example.
    echo Add your backend credentials there if you want IBM Quantum.
)

echo.
echo Starting Quantum Backend on http://127.0.0.1:8000
echo Swagger docs: http://127.0.0.1:8000/docs
echo.

uvicorn app.main:app --reload --port 8000
