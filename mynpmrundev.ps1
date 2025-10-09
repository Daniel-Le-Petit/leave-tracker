# Port à utiliser
$PORT = 3002

# Vérifier si le port est utilisé
$proc = Get-NetTCPConnection -LocalPort $PORT -ErrorAction SilentlyContinue | Select-Object -First 1

if ($proc) {
    Write-Host "Port $PORT est occupé par le PID $($proc.OwningProcess). Arrêt du process..."
    Stop-Process -Id $proc.OwningProcess -Force
    Start-Sleep -Seconds 1
    Write-Host "Process tué. Port $PORT libre."
} else {
    Write-Host "Port $PORT libre."
}

# Lancer npm start (React utilise 'start' et non 'dev')
Write-Host "Lancement de npm start sur le port $PORT..."
$env:PORT=$PORT
npm start
