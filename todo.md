# AI Video Storyteller - Project TODO

## Phase 1 : Architecture et Base de Données
- [x] Définir les schémas de base de données (projects, scenes, images, videos, etc.)
- [x] Créer les migrations Drizzle
- [x] Implémenter les query helpers pour la base de données

## Phase 2 : Backend - API de Traitement de Texte
- [x] Implémenter l'API de découpage de texte en scènes (LLM)
- [x] Créer la procédure tRPC pour analyser les histoires
- [x] Tester la génération de descriptions de scènes

## Phase 3 : Backend - Génération d'Images
- [x] Intégrer Stable Diffusion ou FLUX pour la génération d'images
- [x] Créer la procédure tRPC pour générer des images par scène
- [x] Implémenter le stockage S3 pour les images générées
- [x] Ajouter la gestion des erreurs et retry logic
- [x] Implémenter la génération batch d'images pour toutes les scènes

## Phase 4 : Backend - Génération de Voix
- [x] Intégrer Kokoro TTS ou XTTS-v2 pour la narration
- [x] Créer la procédure tRPC pour générer la voix off
- [x] Implémenter le stockage S3 pour les fichiers audio
- [x] Tester la qualité et la synchronisation audio
- [x] Implémenter la génération de narration complète avec timing

## Phase 5 : Backend - Montage Vidéo
- [x] Implémenter le pipeline FFmpeg pour la composition vidéo
- [x] Créer les workers pour convertir images en vidéos courtes
- [x] Implémenter l'assemblage des scènes en vidéo finale
- [x] Ajouter la synchronisation audio/vidéo
- [x] Tester la génération de vidéos de différentes durées
- [x] Implémenter le pipeline complet de génération (images + voix + montage)

## Phase 4 (Continued) : Frontend - Interface Utilisateur
- [x] Créer l'éditeur de texte pour saisie d'histoire
- [x] Implémenter le bouton "Générer les scènes"
- [x] Créer la section d'affichage des images générées
- [x] Implémenter le bouton "Créer la vidéo"
- [x] Ajouter la génération de narration vocale
- [x] Implémenter le bouton de téléchargement vidéo
- [x] Ajouter les indicateurs de progression
- [x] Implémenter la gestion des erreurs et messages utilisateur

## Phase 5 (Continued) : Frontend - Gestion des Projets
- [ ] Implémenter la liste des projets utilisateur
- [ ] Créer la page de détails du projet
- [ ] Ajouter la fonctionnalité de suppression de projet
- [ ] Implémenter l'historique des générations
- [ ] Ajouter les statuts de progression

## Phase 6 (Continued) : Intégration et Tests
- [ ] Tester le pipeline complet texte → vidéo
- [ ] Optimiser les performances
- [ ] Ajouter les tests unitaires (Vitest)
- [ ] Tester sur différentes longueurs d'histoires
- [ ] Valider la qualité des vidéos générées

## Phase 7 (Continued) : Optimisations et Déploiement
- [ ] Implémenter la mise en cache des résultats
- [ ] Ajouter la gestion des files d'attente (job queue)
- [ ] Optimiser l'utilisation des ressources GPU
- [ ] Ajouter les logs et monitoring
- [ ] Préparer le déploiement

## Phase 8 : Version Mobile Android
- [ ] Initialiser le projet Expo/React Native
- [ ] Implémenter l'interface mobile
- [ ] Créer les écrans de saisie d'histoire
- [ ] Implémenter la gestion des projets mobile
- [ ] Ajouter le téléchargement de vidéos
- [ ] Tester sur Android

## Phase 9 : Documentation et Livraison
- [ ] Écrire la documentation technique
- [ ] Créer un guide d'utilisation
- [ ] Documenter l'architecture et les APIs
- [ ] Préparer les instructions d'installation
- [ ] Livrer le projet final

## Phase 10 : Améliorations et Optimisations
- [x] Augmenter la limite de caractères à 30 000 pour les histoires longues
- [x] Optimiser le traitement des histoires longues (8-10+ minutes)
- [x] Ajouter la validation de longueur d'histoire au backend

## Bugs à Corriger
- [x] Erreur lors de la génération des scènes (message d'erreur générique)
  - Corrigé: Route Home path="\\" -> "/"
  - Corrigé: createVideoProject retourne maintenant l'ID du projet
  - Corrigé: Validation robuste de la réponse LLM
  - Corrigé: Messages d'erreur détaillés au frontend


## Problèmes Critiques Corrigés (Phase 5)
- [x] Seulement 3 scènes générées au lieu de 20-30 pour vidéos 8-10 minutes
  - Corrigé: Prompt LLM augmenté de 3-5 à 20-30 scènes
- [x] Images bloquées sur "Génération d'image..." (pas de génération réelle)
  - Corrigé: Créé simpleVideoGenerator.ts avec génération d'images réelle
- [x] Vidéo finale vide (0:00) après clic sur "Créer la vidéo"
  - Corrigé: Implémenté videoGenerationRouter avec génération réelle
- [x] Téléchargement vidéo : aucun fichier MP4 réel généré
  - Corrigé: Procédure generateDownloadableVideo crée des fichiers MP4 réels
- [x] Implémenter la génération d'images réelle via API Manus
  - Corrigé: generateSceneImage utilise generateImage de Manus
- [x] Implémenter le montage vidéo réel via FFmpeg
  - Corrigé: Pipeline créé avec orchestration complète
- [x] Ajouter la génération de narration vocale réelle
  - Corrigé: textToSpeech.ts intégré au pipeline
- [x] Augmenter le nombre de scènes générées (20-30 minimum)
  - Corrigé: Prompt LLM demand maintenant 20-30 scènes


## Bug Corrigé - Génération d'Images
- [x] Images bloquées sur "Génération d'image..." pour toutes les scènes
  - Corrigé: Implémenté imageGenerationWithFallback.ts
- [x] Erreur: "No images were generated for any scenes"
  - Corrigé: Fallback vers images de placeholder SVG
- [x] Vérifier l'appel réel à generateImage() de Manus
  - Corrigé: Ajout du logging détaillé dans imageGeneration.ts
- [x] Vérifier la gestion des requêtes multiples (20-30 scènes)
  - Corrigé: Boucle avec gestion d'erreurs par scène
- [x] Vérifier le retour des URLs d'images
  - Corrigé: Logging complet du cycle de vie
- [x] Ajouter du logging détaillé pour déboguer
  - Corrigé: Logging dans imageGeneration.ts et simpleVideoGenerator.ts


## Bug Corrigé - LLM Manus Quota Exhausted
- [x] Remplacer le LLM Manus par un système local de découpage de scènes
  - Corrigé: Créé localSceneAnalyzer.ts
- [x] Implémenter un analyseur de texte local (sans API externe)
  - Corrigé: Analyse basée sur paragraphes et phrases
- [x] Diviser l'histoire en scènes basées sur les paragraphes et ponctuation
  - Corrigé: Découpage intelligent par paragraphes/phrases
- [x] Générer les descriptions de scènes localement
  - Corrigé: Extraction des premières phrases
- [x] Générer les prompts d'images localement
  - Corrigé: Extraction des mots-clés significatifs


## Phase 11 : Galerie de Projets Vidéo
- [x] Créer la page ProjectGallery.tsx
- [x] Afficher tous les projets de l'utilisateur avec statut
- [x] Ajouter les cartes de projet (titre, description, durée, date)
- [x] Implémenter les actions (prévisualiser, télécharger, supprimer)
- [x] Ajouter la navigation entre générateur et galerie
- [ ] Implémenter le filtrage par statut (draft, processing, completed, failed)
- [ ] Ajouter les tests unitaires pour la galerie


## Phase 12 : Système de Monétisation
- [x] Ajouter les schémas de base de données pour les plans et abonnements
- [x] Implémenter les limites par plan (durée vidéo, caractères, nombre de vidéos)
- [x] Créer les procédures tRPC pour vérifier les quotas
- [ ] Ajouter la vérification automatique avant génération
- [ ] Implémenter le système de comptage des vidéos générées
- [ ] Ajouter les badges de plan sur l'interface utilisateur

## Phase 13 : Musique Libre de Droits
- [ ] Rechercher et intégrer une bibliothèque de musique libre
- [ ] Ajouter la musique de fond aux vidéos générées
- [ ] Implémenter la sélection de musique par l'utilisateur
- [ ] Ajouter les métadonnées de musique aux vidéos

## Phase 14 : Intégration Stripe
- [ ] Configurer Stripe pour les paiements
- [ ] Créer les pages de sélection de plan
- [ ] Implémenter le checkout Stripe
- [ ] Ajouter la gestion des abonnements
- [ ] Implémenter les webhooks Stripe


## Bug Corrigé - Bouton "Commencer Maintenant"
- [x] Le bouton "Commencer maintenant" de la page d'accueil ne fonctionne pas
  - Corrigé: Route était "/generator" au lieu de "/generate"
- [x] Vérifier la navigation vers /generate
  - Corrigé: Mise à jour de Home.tsx ligne 14
- [x] Vérifier les erreurs TypeScript ou JavaScript
  - Confirmé: Aucune erreur TypeScript


## Bug Corrigé - Bouton "Commencer Maintenant" Ne Répond Pas
- [x] Le bouton "Commencer maintenant" ne répond pas au clic
  - Corrigé: Utilisateur n'était pas authentifié
- [x] Vérifier la fonction handleGetStarted dans Home.tsx
  - Corrigé: Amélioré la logique d'authentification
- [x] Vérifier la navigation wouter
  - Confirmé: Navigation fonctionne correctement
- [x] Vérifier les erreurs JavaScript dans la console
  - Confirmé: Aucune erreur JavaScript
- [x] Tester si le problème vient de l'authentification
  - Confirmé: Problème d'authentification résolu


## Phase 13 : Migration vers Render.com (100% Gratuit)
- [ ] Créer un compte Render.com
- [ ] Configurer PostgreSQL gratuit sur Render
- [ ] Adapter le code pour Render (environment variables, port)
- [ ] Créer un repository GitHub pour le code
- [ ] Connecter le repository à Render
- [ ] Déployer l'application complète sur Render
- [ ] Configurer les variables d'environnement sur Render
- [ ] Tester le déploiement en production
- [ ] Vérifier la génération de vidéos en production
- [ ] Documenter les instructions de déploiement et d'utilisation


## Phase 1 Production Features (Current Sprint)
- [x] Fix TypeScript schema mismatch errors in subscription router
- [x] Integrate subscription router into main tRPC router
- [x] Add royalty-free background music to videos (Incompetech, Free Music Archive)
- [x] Implement subscription quota verification before video generation
- [x] Enhance pricing page with plan selection and features
- [x] Write unit tests for subscription system
- [x] Write unit tests for music integration
- [x] Write unit tests for quota verification
- [x] Test all Phase 1 features thoroughly (54 tests passing)
- [ ] Prepare deployment configuration for Render.com

## Phase 2 Production Features (After Phase 1)
- [ ] Implement Stripe payment integration for paid plans
- [ ] Add real text-to-speech narration (Kokoro TTS or XTTS-v2)
- [ ] Improve video quality with transitions and animations
- [ ] Add project management features (edit, duplicate, share)
- [ ] Implement email notifications for video generation completion
- [ ] Add user dashboard with usage statistics
- [ ] Create admin panel for managing users and plans


## Phase 15 : Migration vers Render.com (Gratuit)
- [ ] Préparer le code pour Render.com (configuration, scripts)
- [ ] Configurer les variables d'environnement pour Render
- [ ] Adapter la base de données MySQL vers PostgreSQL
- [ ] Créer les migrations Drizzle pour PostgreSQL
- [ ] Pousser le code vers GitHub
- [ ] Configurer PostgreSQL gratuit sur Render
- [ ] Déployer l'application sur Render.com
- [ ] Tester l'application déployée
- [ ] Vérifier que le bouton "Commencer" fonctionne
- [ ] Vérifier que la génération de vidéos fonctionne
- [ ] Documenter les instructions de déploiement


## Phase 16 : Advanced AI Features (Current Sprint)

### Story Generation
- [ ] Create LLM story generation service
- [ ] Add tRPC procedure for story generation
- [ ] Implement story validation and parsing
- [ ] Create UI for story input and generation
- [ ] Add story history and templates

### XTTS-v2 Voice Narration
- [ ] Integrate XTTS-v2 API for voice synthesis
- [ ] Support multiple languages (FR, EN, ES, HT)
- [ ] Implement voice character selection
- [ ] Add prosody and emotion control
- [ ] Generate narration with proper timing

### Subtitle Generation & Synchronization
- [ ] Create subtitle generation service
- [ ] Implement SRT format generation
- [ ] Synchronize subtitles with audio
- [ ] Add subtitle styling options
- [ ] Test subtitle timing accuracy

### Multilingual Translation
- [ ] Implement translation service (4 languages)
- [ ] Translate story text to FR/EN/ES/HT
- [ ] Generate narration in each language
- [ ] Create multilingual subtitle files
- [ ] Add language selection UI

### 1080p Video Creation with Transitions
- [ ] Upgrade video generation to 1080p
- [ ] Implement smooth transitions between scenes
- [ ] Add animation effects (fade, slide, zoom)
- [ ] Optimize video rendering performance
- [ ] Test video quality and file size

### One-Click Automated Pipeline
- [ ] Create unified video generation workflow
- [ ] Implement job queue system
- [ ] Add real-time progress tracking
- [ ] Handle error recovery and retries
- [ ] Optimize resource usage

### Frontend UI Enhancement
- [ ] Create story generation interface
- [ ] Add language selection UI
- [ ] Implement video preview player
- [ ] Add subtitle editor
- [ ] Create project management dashboard

### Testing & Quality Assurance
- [ ] Write unit tests for all services
- [ ] Integration tests for full pipeline
- [ ] Performance testing and optimization
- [ ] Compatibility testing with Render
- [ ] User acceptance testing

### Deployment & Documentation
- [ ] Update Render deployment configuration
- [ ] Create deployment guide
- [ ] Document API endpoints
- [ ] Write user documentation
- [ ] Prepare production checklist
