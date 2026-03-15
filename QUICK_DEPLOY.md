# 🚀 Déploiement Ultra-Rapide sur Render.com

**3 étapes simples pour déployer l'application !**

---

## Étape 1️⃣ : Pousser le code vers GitHub (5 minutes)

Ouvrez un terminal dans le dossier du projet et exécutez :

```bash
bash push-to-github.sh
```

Entrez vos identifiants GitHub quand demandé.

**C'est tout !** Le code est maintenant sur GitHub. ✅

---

## Étape 2️⃣ : Créer un compte Render.com (2 minutes)

1. Allez sur https://render.com
2. Cliquez sur **"Sign up"**
3. Connectez-vous avec GitHub (recommandé)

---

## Étape 3️⃣ : Déployer avec un clic (10 minutes)

1. Une fois connecté à Render, cliquez sur **"New +"**
2. Sélectionnez **"Blueprint"**
3. Cherchez votre dépôt `Ai-video-storyteller`
4. Cliquez sur **"Connect"**
5. Render va lire le fichier `render.yaml` et configurer automatiquement :
   - ✅ Base de données PostgreSQL
   - ✅ Backend API
   - ✅ Frontend

6. Cliquez sur **"Deploy"**
7. Attendez 10-15 minutes

**C'est tout !** L'application est maintenant en ligne ! 🎉

---

## ⚙️ Configuration des Variables d'Environnement

Après le déploiement, vous devez ajouter les variables Manus :

1. Allez dans le service **"ai-video-api"** sur Render
2. Cliquez sur **"Environment"**
3. Modifiez les variables :
   - `VITE_APP_ID` → Votre ID Manus
   - `OWNER_OPEN_ID` → Votre ID Manus
   - `OWNER_NAME` → Votre nom
   - `BUILT_IN_FORGE_API_KEY` → Votre clé API Manus
   - `VITE_FRONTEND_FORGE_API_KEY` → Votre clé API frontend Manus

4. Cliquez sur **"Save"**
5. Render va redéployer automatiquement

---

## ✅ Vérifier que ça marche

1. Allez sur l'URL du frontend (Render vous la donne)
2. Cliquez sur **"Commencer"**
3. Essayez de générer une vidéo
4. Vérifiez la page de tarification

**Si tout fonctionne, bravo ! 🎉**

---

## 🐛 Si ça ne marche pas

Consultez les logs sur Render :

1. Cliquez sur le service qui a un problème
2. Cliquez sur **"Logs"**
3. Cherchez les messages d'erreur
4. Vérifiez les variables d'environnement

---

## 📊 Limitations du plan gratuit

- Backend pause après 15 min d'inactivité
- Base de données 256 MB
- Bande passante limitée

Pour la production, mettez à niveau vers un plan payant.

---

## 🎯 Résumé

| Étape | Temps | Action |
|-------|-------|--------|
| 1 | 5 min | `bash push-to-github.sh` |
| 2 | 2 min | Créer compte Render |
| 3 | 15 min | Cliquer "Deploy" sur Render |
| 4 | 5 min | Ajouter variables Manus |
| **Total** | **27 min** | **Prêt !** ✅ |

---

**Besoin d'aide ?** Consultez `DEPLOYMENT_GUIDE_FR.md` pour plus de détails.
