# Script de test pour RetraiteClair
Write-Host "=== Test de l'application RetraiteClair ===" -ForegroundColor Green

# Vérifier que les fichiers principaux existent
$files = @(
    "package.json",
    "src/App.js",
    "src/index.js",
    "src/components/Formulaire.js",
    "src/components/Resultats.js",
    "src/components/Scenarios.js",
    "src/components/Conseils.js"
)

Write-Host "`nVérification des fichiers..." -ForegroundColor Yellow
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file MANQUANT" -ForegroundColor Red
    }
}

# Vérifier les dépendances
Write-Host "`nVérification des dépendances..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "✅ node_modules présent" -ForegroundColor Green
} else {
    Write-Host "❌ node_modules manquant - Exécutez 'npm install'" -ForegroundColor Red
}

# Vérifier le package.json
Write-Host "`nVérification du package.json..." -ForegroundColor Yellow
try {
    $package = Get-Content "package.json" | ConvertFrom-Json
    Write-Host "✅ Nom: $($package.name)" -ForegroundColor Green
    Write-Host "✅ Version: $($package.version)" -ForegroundColor Green
    Write-Host "✅ Scripts disponibles:" -ForegroundColor Green
    foreach ($script in $package.scripts.PSObject.Properties) {
        Write-Host "   - $($script.Name): $($script.Value)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Erreur de lecture du package.json" -ForegroundColor Red
}

Write-Host "`n=== Test terminé ===" -ForegroundColor Green
Write-Host "Pour lancer l'application: npm start" -ForegroundColor Cyan
Write-Host "URL: http://localhost:3000" -ForegroundColor Cyan










