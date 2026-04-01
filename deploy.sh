#!/bin/bash

# Config
PROJECT_DIR="/media/daniel/HDD/AIFB/leave-tracker"
BRANCH="main"
PORT=3002
REPO_URL="https://Daniel-Le-Petit@github.com/Daniel-Le-Petit/leave-tracker.git"


echo "🧹 Vérification du port $PORT..."

PID=$(lsof -t -i:$PORT)

if [ -n "$PID" ]; then
  echo "⚠️ Port $PORT occupé par PID $PID → arrêt..."
  kill -9 $PID
  sleep 1
  echo "✅ Port libéré"
else
  echo "🟢 Port $PORT déjà libre"
fi

echo "📁 Accès au projet..."
cd "$PROJECT_DIR" || { echo "❌ Dossier introuvable"; exit 1; }

# Vérifie si remote existe
if ! git remote | grep -q origin; then
  echo "🔗 Ajout du remote origin..."
  git remote add origin $REPO_URL
else
  echo "🔄 Mise à jour du remote origin..."
  git remote set-url origin $REPO_URL
fi

echo "🌿 Passage sur $BRANCH"
git checkout $BRANCH

echo "⬇️ Pull..."
git pull origin $BRANCH

echo "📝 Ajout des fichiers..."
git add .

# Commit seulement si nécessaire
if ! git diff --cached --quiet; then
  echo "💾 Commit..."
  git commit -m "auto-update $(date '+%Y-%m-%d %H:%M:%S')"

  echo "🚀 Push sans prompt username..."
  git push origin $BRANCH
else
  echo "🟢 Rien à commit"
fi

echo "📦 Installation dépendances..."
npm install

# Gestion du port
echo "🧹 Vérification port $PORT..."
PROC=$(lsof -ti:$PORT)
if [ -n "$PROC" ]; then
  echo "⚠️ Kill process $PROC"
  kill -9 $PROC
  sleep 1
fi

echo "🚀 Lancement app..."
npx next dev -p $PORT

echo "✅ Repo à jour + app lancée"
