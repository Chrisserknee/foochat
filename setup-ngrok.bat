@echo off
echo.
echo ========================================
echo ngrok Authentication Setup
echo ========================================
echo.
echo 1. Go to: https://dashboard.ngrok.com/signup
echo 2. Sign up (free)
echo 3. Copy your auth token
echo 4. Paste it below when prompted
echo.
set /p TOKEN="Enter your ngrok auth token: "
echo.
echo Adding auth token...
ngrok config add-authtoken %TOKEN%
echo.
echo ✅ Done! Now starting ngrok...
echo.
start ngrok http 3000
echo.
echo ngrok is running! Look for the HTTPS URL in the ngrok window.
echo Copy that URL and open it on your phone!
echo.
pause






