# 🚨 RENDER DEPLOYMENT FIX FOR LEAVE-TRACKER

## ❌ PROBLEM IDENTIFIED

```
Error: "next start" does not work with "output: export" configuration.
Use "npx serve@latest out" instead.
```

**Root Cause:** Render is trying to deploy as a **Web Service** but leave-tracker is a **Static Site**.

---

## ✅ SOLUTION: Deploy as Static Site

### Option 1: Update in Render Dashboard (RECOMMENDED)

1. Go to your Render Dashboard
2. Find the `leave-tracker` service
3. **Delete the current service** (or suspend it)
4. **Create a NEW Static Site:**
   - Click "New +" → "Static Site"
   - Connect your GitHub repository
   - Configure:
     - **Name:** leave-tracker
     - **Build Command:** `npm install && npm run build`
     - **Publish Directory:** `out`
     - **Auto-Deploy:** Yes

### Option 2: Use render.yaml (IF you want infrastructure-as-code)

Your `render.yaml` is already correct:
```yaml
services:
  - type: static          ← Correct!
    name: leave-tracker
    env: static
    buildCommand: npm install && npm run build
    staticPublishPath: ./out
```

But you need to:
1. **Delete any existing web service** in Render dashboard
2. Go to "Blueprint" → "New Blueprint Instance"
3. Connect repository
4. Render will read `render.yaml` automatically

---

## 🔧 Alternative: If You Must Use Web Service

If for some reason you need to keep it as a web service (NOT recommended), update `package.json`:

```json
{
  "scripts": {
    "start": "npx serve@latest out -p $PORT"
  }
}
```

And add `serve` dependency:
```bash
npm install serve --save
```

**But this is NOT ideal** - static sites are better for your use case.

---

## ✅ VERIFY AFTER DEPLOYMENT

Once deployed as a static site:
1. Check URL works
2. Test IndexedDB (add a leave entry)
3. Test Export/Import
4. Verify data persists on page refresh

---

## 📝 WHY STATIC SITE IS CORRECT

✅ **Your app:**
- Uses client-side storage (IndexedDB/idb)
- No server-side API needed
- All processing in browser
- Perfect for static hosting

❌ **Web Service would:**
- Waste resources
- Cost money
- Add unnecessary complexity

---

## 🎯 NEXT STEPS

1. Delete current web service deployment in Render
2. Create new Static Site deployment
3. Push code to trigger deployment
4. Verify it works

**Static site = Free + Fast + Perfect for your app!**


