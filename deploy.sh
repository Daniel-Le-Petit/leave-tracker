#!/bin/sh

# ==========================================
# Script de déploiement Leave Tracker (SH)
# ==========================================

PROJECT_DIR="/media/daniel/HDD/AIFB/leave-tracker"
BRANCH="main"
PORT=3002
REMOTE_REPO="git@github.com:Daniel-Le-Petit/leave-tracker.git"

echo "🧹 Vérification du port $PORT..."
PROC=$(lsof -ti:$PORT)
if [ -n "$PROC" ]; then
  echo "⚠️ Port $PORT occupé, arrêt du processus..."
  kill -9 $PROC
  sleep 1
fi
echo "🟢 Port $PORT libre"

echo "📁 Accès au projet..."
cd "$PROJECT_DIR" || exit 1

# Ajoute GitHub à known_hosts pour éviter la confirmation interactive
echo "🔐 Vérification SSH pour GitHub..."
ssh-keyscan github.com >> ~/.ssh/known_hosts 2>/dev/null

echo "🔄 Mise à jour du remote..."
git remote set-url origin "$REMOTE_REPO"
echo "🔄 Remote mis à jour vers $REMOTE_REPO"

echo "🌿 Passage sur branche $BRANCH..."
git checkout "$BRANCH"

echo "⬇️ Pull depuis $BRANCH..."
git pull origin "$BRANCH"

echo "📝 Ajout des fichiers..."
git add .

echo "💾 Commit auto-update..."
NOW=$(date +"%Y-%m-%d %H:%M:%S")
git commit -m "auto-update $NOW" || echo "Aucun changement à commit"

echo "🚀 Push vers $BRANCH..."
git push origin "$BRANCH"

echo "📦 Installation des dépendances..."
npm install

echo "🧹 Vérification port $PORT..."
PROC=$(lsof -ti:$PORT)
if [ -n "$PROC" ]; then
  echo "⚠️ Port $PORT occupé, arrêt du processus..."
  kill -9 $PROC
  sleep 1
fi

echo "🚀 Lancement de l'application..."
npx next dev -p "$PORT"
