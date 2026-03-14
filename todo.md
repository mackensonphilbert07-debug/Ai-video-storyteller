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
