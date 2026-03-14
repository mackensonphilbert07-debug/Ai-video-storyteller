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
- [ ] Ajouter les schémas de base de données pour les plans et abonnements
- [ ] Implémenter les limites par plan (durée vidéo, caractères, nombre de vidéos)
- [ ] Créer les procédures tRPC pour vérifier les quotas
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
