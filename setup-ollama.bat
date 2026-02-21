@echo off
echo ========================================
echo Setting up Ollama for Shark Tank AI
echo ========================================
echo.

echo Step 1: Starting Ollama service...
start "Ollama Service" ollama serve
timeout /t 3 /nobreak >nul

echo.
echo Step 2: Pulling nomic-embed-text model (768 dimensions)...
ollama pull nomic-embed-text

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Ollama is now running with the nomic-embed-text model.
echo The service will continue running in the background.
echo.
echo To stop Ollama, close the "Ollama Service" window.
echo.
pause
