#!/bin/bash

# Config
PROJECT_DIR="/media/daniel/HDD/AIFB/leave-tracker"
BRANCH="main"
PORT=3002

echo "📁 Accès au projet..."
cd "$PROJECT_DIR" || { echo "❌ Dossier introuvable"; exit 1; }

echo "🔍 Vérification git..."
if [ ! -d ".git" ]; then
  echo "❌ Pas un repo git"
  exit 1
fi

echo "🌿 Branche actuelle : $(git branch --show-current)"

echo "📡 Synchronisation avec GitHub..."
git fetch origin

echo "🔀 Checkout $BRANCH"
git checkout $BRANCH

echo "⬇️ Pull..."
git pull origin $BRANCH

# --- AJOUT IMPORTANT ICI ---
echo "📝 Ajout des modifications locales..."
git add .

echo "💾 Commit (si nécessaire)..."
git commit -m "auto-update $(date '+%Y-%m-%d %H:%M:%S')" 2>/dev/null

echo "🚀 Push vers GitHub..."
git push origin $BRANCH
# ---------------------------

echo "📦 Installation dépendances..."
npm install

# Kill port si utilisé
echo "🧹 Vérification du port $PORT..."
PROC=$(lsof -ti:$PORT)
if [ -n "$PROC" ]; then
  echo "⚠️ Port occupé → kill $PROC"
  kill -9 $PROC
  sleep 1
fi

echo "🚀 Lancement app..."
npx next dev -p $PORT

echo "✅ Tout est à jour et lancé"

