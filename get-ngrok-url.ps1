Start-Sleep -Seconds 3
try {
    $response = Invoke-RestMethod -Uri 'http://127.0.0.1:4040/api/tunnels'
    $url = $response.tunnels[0].public_url
    Write-Host ""
    Write-Host "========================================"
    Write-Host "🎉 ngrok is running!"
    Write-Host "========================================"
    Write-Host ""
    Write-Host "📱 Your HTTPS URL:" -ForegroundColor Cyan
    Write-Host $url -ForegroundColor Green
    Write-Host ""
    Write-Host "Open this URL on your phone to test AF mode!"
    Write-Host ""
} catch {
    Write-Host "ngrok is starting... check the ngrok window for the URL"
}



