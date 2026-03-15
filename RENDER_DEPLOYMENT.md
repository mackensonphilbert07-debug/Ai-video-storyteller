# Guide de Déploiement Render.com - Corrigé

Ce guide explique comment déployer correctement l'application sur Render.com avec les commandes de build et start qui fonctionnent.

## ✅ Changements effectués

Les fichiers suivants ont été créés pour corriger les problèmes de déploiement :

1. **build.sh** - Script de build qui fonctionne avec la structure du projet
2. **start.sh** - Script de démarrage qui lance le serveur correctement
3. **render.json** - Configuration Render avec les bonnes variables d'environnement

## 📋 Étapes de déploiement

### Étape 1 : Pousser le code vers GitHub

```bash
cd ai-video-generator
git add build.sh start.sh render.json
git commit -m "Add Render.com deployment scripts"
git push origin main
```

### Étape 2 : Créer la base de données PostgreSQL sur Render

1. Allez sur [render.com](https://render.com)
2. Cliquez sur **"New +"** → **"PostgreSQL"**
3. Configurez :
   - **Name :** `ai-video-db`
   - **Database :** `ai_video_storyteller`
   - **User :** `postgres`
   - **Region :** Choisissez la plus proche
   - **Plan :** Free
4. Cliquez sur **"Create Database"**
5. **Copiez la connection string complète** (exemple : `postgresql://user:password@host:5432/database`)

### Étape 3 : Déployer le backend sur Render

1. Cliquez sur **"New +"** → **"Web Service"**
2. Sélectionnez votre dépôt GitHub `Ai-video-storyteller`
3. Configurez :
   - **Name :** `ai-video-api`
   - **Environment :** Node
   - **Region :** Même région que la base de données
   - **Build Command :** `bash build.sh`
   - **Start Command :** `bash start.sh`
   - **Plan :** Free
4. Cliquez sur **"Advanced"** et ajoutez les variables d'environnement :

```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=<generate avec: openssl rand -hex 32>
VITE_APP_ID=<votre Manus app ID>
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im/oauth
OWNER_OPEN_ID=<votre Manus open ID>
OWNER_NAME=<votre nom>
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=<votre clé API Manus>
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=<votre clé API frontend Manus>
VITE_APP_TITLE=AI Video Storyteller
```

5. Cliquez sur **"Create Web Service"**
6. Attendez le déploiement (environ 5-10 minutes)
7. **Copiez l'URL du service** (par exemple : `https://ai-video-api.onrender.com`)

### Étape 4 : Déployer le frontend sur Render

1. Cliquez sur **"New +"** → **"Static Site"**
2. Sélectionnez votre dépôt GitHub
3. Configurez :
   - **Name :** `ai-video-frontend`
   - **Build Command :** `pnpm install && pnpm exec vite build`
   - **Publish Directory :** `client/dist`
   - **Plan :** Free
4. Cliquez sur **"Advanced"** et ajoutez les variables d'environnement :

```
VITE_API_URL=https://ai-video-api.onrender.com
VITE_APP_ID=<votre Manus app ID>
VITE_OAUTH_PORTAL_URL=https://manus.im/oauth
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=<votre clé API frontend Manus>
VITE_APP_TITLE=AI Video Storyteller
```

5. Cliquez sur **"Create Static Site"**
6. Attendez le déploiement

## 🔧 Commandes de build et start

### Build Command
```bash
bash build.sh
```

Ce script :
- Installe les dépendances avec pnpm
- Construit le frontend avec Vite
- Construit le backend avec esbuild
- Exécute les migrations de base de données

### Start Command
```bash
bash start.sh
```

Ce script :
- Définit l'environnement de production
- Vérifie que le répertoire dist existe
- Lance le serveur Express

## 🧪 Test local

Pour tester localement avant de déployer :

```bash
# Build
bash build.sh

# Start
bash start.sh
```

L'application devrait être accessible sur `http://localhost:3000`

## 🐛 Dépannage

### Build échoue avec "command not found: bash"

Render utilise `/bin/sh` par défaut. Utilisez :
```bash
sh build.sh
```

### Erreur "Cannot find module"

Assurez-vous que `pnpm-lock.yaml` est dans le dépôt GitHub :
```bash
git add pnpm-lock.yaml
git commit -m "Add pnpm lock file"
git push
```

### Base de données ne se connecte pas

1. Vérifiez que `DATABASE_URL` est correct
2. Assurez-vous que la base de données PostgreSQL est en cours d'exécution
3. Vérifiez les logs du backend dans Render

### Frontend ne se connecte pas au backend

1. Vérifiez que `VITE_API_URL` pointe vers le bon URL du backend
2. Assurez-vous que le backend est en cours d'exécution
3. Vérifiez les logs du frontend dans Render

## 📊 Limitations du plan gratuit

- **Backend :** Pause après 15 minutes d'inactivité, 512 MB RAM
- **Database :** 256 MB de stockage, pause après 15 minutes d'inactivité
- **Frontend :** Bande passante limitée
- **Uptime :** ~99.9% (avec pauses)

Pour la production, envisagez une mise à niveau vers des plans payants.

## ✅ Vérification du déploiement

Une fois déployé :

1. Visitez l'URL du frontend
2. Cliquez sur **"Commencer"** (Start Now)
3. Essayez de générer une vidéo
4. Vérifiez la page de tarification

Si tout fonctionne, le déploiement est réussi ! 🎉

## 📞 Support

- **Render.com :** https://render.com/docs
- **GitHub :** https://github.com/mackensonphilbert07-debug/Ai-video-storyteller
- **Manus :** https://manus.im
