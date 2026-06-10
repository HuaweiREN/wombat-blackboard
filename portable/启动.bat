@echo off
cd /d "%~dp0"
echo Wombat-Blackboard v1.0
echo.
echo Starting server...
start http://localhost:3001
wombat-blackboard.exe
pause
