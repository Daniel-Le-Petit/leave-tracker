# Script de vérification pour RetraiteClair
Write-Host "🔍 Vérification de RetraiteClair" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green

# Vérifier les fichiers essentiels
Write-Host "`n📁 Fichiers essentiels:" -ForegroundColor Yellow
$files = @(
    "package.json",
    "public/index.html", 
    "public/manifest.json",
    "src/App.js",
    "src/index.js",
    "src/index.css"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $size = (Get-Item $file).Length
        Write-Host "✅ $file ($size octets)" -ForegroundColor Green
    } else {
        Write-Host "❌ $file MANQUANT" -ForegroundColor Red
    }
}

# Vérifier les composants
Write-Host "`n🧩 Composants React:" -ForegroundColor Yellow
$components = @(
    "src/components/Formulaire.js",
    "src/components/Resultats.js", 
    "src/components/Scenarios.js",
    "src/components/Conseils.js"
)

foreach ($comp in $components) {
    if (Test-Path $comp) {
        Write-Host "✅ $comp" -ForegroundColor Green
    } else {
        Write-Host "❌ $comp MANQUANT" -ForegroundColor Red
    }
}

# Vérifier node_modules
Write-Host "`n📦 Dépendances:" -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "✅ node_modules présent" -ForegroundColor Green
    if (Test-Path "node_modules/.bin/react-scripts.cmd") {
        Write-Host "✅ react-scripts installé" -ForegroundColor Green
    } else {
        Write-Host "❌ react-scripts manquant" -ForegroundColor Red
    }
} else {
    Write-Host "❌ node_modules manquant" -ForegroundColor Red
}

Write-Host "`n🚀 Pour lancer l'application:" -ForegroundColor Cyan
Write-Host "   npm start" -ForegroundColor White
Write-Host "`n🌐 URL: http://localhost:3000" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Green










