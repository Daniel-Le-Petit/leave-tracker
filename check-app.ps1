# Script de vérification pour RetraiteClair
Write-Host "🔍 Vérification de l'application RetraiteClair" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Vérifier les fichiers essentiels
$essentialFiles = @(
    "package.json",
    "src/App.js",
    "src/index.js",
    "src/index.css",
    "src/components/Formulaire.js",
    "src/components/Resultats.js",
    "src/components/Scenarios.js",
    "src/components/Conseils.js",
    "src/data/exemples.js"
)

Write-Host "`n📁 Vérification des fichiers..." -ForegroundColor Yellow
$allFilesExist = $true
foreach ($file in $essentialFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file MANQUANT" -ForegroundColor Red
        $allFilesExist = $false
    }
}

# Vérifier node_modules
Write-Host "`n📦 Vérification des dépendances..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "✅ node_modules présent" -ForegroundColor Green
    
    # Vérifier react-scripts
    if (Test-Path "node_modules/.bin/react-scripts.cmd") {
        Write-Host "✅ react-scripts installé" -ForegroundColor Green
    } else {
        Write-Host "❌ react-scripts manquant" -ForegroundColor Red
        $allFilesExist = $false
    }
} else {
    Write-Host "❌ node_modules manquant" -ForegroundColor Red
    $allFilesExist = $false
}

# Vérifier le package.json
Write-Host "`n📋 Vérification du package.json..." -ForegroundColor Yellow
try {
    $package = Get-Content "package.json" | ConvertFrom-Json
    Write-Host "✅ Nom: $($package.name)" -ForegroundColor Green
    Write-Host "✅ Version: $($package.version)" -ForegroundColor Green
    
    # Vérifier les scripts
    if ($package.scripts.start) {
        Write-Host "✅ Script 'start' disponible" -ForegroundColor Green
    } else {
        Write-Host "❌ Script 'start' manquant" -ForegroundColor Red
        $allFilesExist = $false
    }
} catch {
    Write-Host "❌ Erreur de lecture du package.json" -ForegroundColor Red
    $allFilesExist = $false
}

# Résumé
Write-Host "`n📊 Résumé:" -ForegroundColor Cyan
if ($allFilesExist) {
    Write-Host "🎉 Application prête à être lancée !" -ForegroundColor Green
    Write-Host "`n🚀 Commandes disponibles:" -ForegroundColor Yellow
    Write-Host "   npm start          - Lancer l'application" -ForegroundColor White
    Write-Host "   npm run build      - Build pour production" -ForegroundColor White
    Write-Host "   npm test           - Lancer les tests" -ForegroundColor White
    Write-Host "`n🌐 URL: http://localhost:3000" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  Des problèmes ont été détectés" -ForegroundColor Red
    Write-Host "   Exécutez 'npm install' pour installer les dépendances" -ForegroundColor Yellow
}

Write-Host "`n=============================================" -ForegroundColor Cyan











