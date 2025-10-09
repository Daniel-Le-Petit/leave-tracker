# Script de lancement pour RetraiteClair
Write-Host "🚀 RetraiteClair - Simulateur de Retraite Progressive" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green

# Port par défaut
$PORT = 3000

# Vérifier si le port est utilisé
$proc = Get-NetTCPConnection -LocalPort $PORT -ErrorAction SilentlyContinue | Select-Object -First 1

if ($proc) {
    Write-Host "⚠️  Port $PORT est occupé par le PID $($proc.OwningProcess)" -ForegroundColor Yellow
    Write-Host "🔄 Arrêt du processus..." -ForegroundColor Yellow
    Stop-Process -Id $proc.OwningProcess -Force
    Start-Sleep -Seconds 2
    Write-Host "✅ Processus arrêté. Port $PORT libre." -ForegroundColor Green
} else {
    Write-Host "✅ Port $PORT libre." -ForegroundColor Green
}

# Vérifier les fichiers essentiels
Write-Host "`n🔍 Vérification des fichiers..." -ForegroundColor Cyan

$requiredFiles = @(
    "package.json",
    "public/index.html",
    "src/App.js",
    "src/index.js"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file MANQUANT" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if (-not $allFilesExist) {
    Write-Host "`n❌ Des fichiers essentiels sont manquants !" -ForegroundColor Red
    Write-Host "   Veuillez vérifier l'installation de l'application." -ForegroundColor Yellow
    exit 1
}

# Vérifier node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "`n📦 Installation des dépendances..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors de l'installation des dépendances" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Dépendances installées" -ForegroundColor Green
} else {
    Write-Host "✅ Dépendances présentes" -ForegroundColor Green
}

# Lancer l'application
Write-Host "`n🎯 Lancement de l'application..." -ForegroundColor Cyan
Write-Host "🌐 URL: http://localhost:$PORT" -ForegroundColor Cyan
Write-Host "⏹️  Pour arrêter: Ctrl+C" -ForegroundColor Gray
Write-Host "`n" + "="*50 -ForegroundColor Green

$env:PORT=$PORT
npm start









