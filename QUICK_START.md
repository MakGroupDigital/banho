# 🚀 Quick Start - Banho App

## ✅ Configuration terminée !

Tout est prêt pour utiliser l'application. Voici comment démarrer :

## 🏃 Démarrage rapide

### 1. Lancer l'application en développement
```bash
npm run dev
```

### 2. Tester l'ajout de produit
1. Ouvrir l'application dans le navigateur
2. Se connecter ou créer un compte
3. Cliquer sur le bouton **+** au centre de la navigation
4. Ajouter des photos et remplir le formulaire
5. Cliquer sur **Publier**

### 3. Vérifier dans Firebase Console
- **Storage** : https://console.firebase.google.com/project/banho-zando-online-3ljs41/storage
- **Firestore** : https://console.firebase.google.com/project/banho-zando-online-3ljs41/firestore

## 📦 Scripts disponibles

```bash
# Développement
npm run dev                    # Lancer le serveur de développement

# Build
npm run build                  # Créer le build de production
npm run preview                # Prévisualiser le build

# Firebase
npm run deploy                 # Build + déployer tout
npm run deploy:hosting         # Build + déployer uniquement le hosting
npm run deploy:rules           # Déployer uniquement les règles
npm run firebase:emulators     # Lancer les émulateurs Firebase
```

## 🎯 Fonctionnalités disponibles

### ✅ Authentification
- Inscription avec email/mot de passe
- Connexion
- Déconnexion
- Réinitialisation du mot de passe
- Gestion de session persistante

### ✅ Ajout de produits
- Upload de 1 à 3 images (max 5MB chacune)
- Sélection du type : Neuve, Occasion, Services
- Catégories dynamiques selon le type
- 16 catégories de produits
- 18 catégories de services
- Validation complète du formulaire
- Sauvegarde dans Firestore

### ✅ Navigation
- Page d'accueil avec produits
- BanhoPay (portefeuille)
- Commandes
- Profil utilisateur
- Bouton d'ajout centré dans la navigation

### ✅ Sécurité
- Règles Storage déployées
- Règles Firestore déployées
- Authentification requise pour publier
- Isolation des données utilisateur

## 🔧 Configuration Firebase

### Projet
- **ID** : banho-zando-online-3ljs41
- **Région** : us-central1

### Services activés
- ✅ Authentication (Email/Password)
- ✅ Firestore Database
- ✅ Storage
- ✅ Hosting (prêt à déployer)

### Règles déployées
- ✅ Storage : Upload sécurisé d'images
- ✅ Firestore : CRUD sécurisé des produits
- ✅ Index : Requêtes optimisées

## 📱 Structure de l'application

```
banho/
├── src/
│   ├── App.tsx                 # Composant principal
│   ├── firebase.ts             # Configuration Firebase
│   ├── services/
│   │   ├── authService.ts      # Service d'authentification
│   │   ├── productService.ts   # Service de gestion des produits
│   │   └── orderService.ts     # Service de gestion des commandes
│   └── ...
├── storage.rules               # Règles Storage
├── firestore.rules             # Règles Firestore
├── firestore.indexes.json      # Index Firestore
├── firebase.json               # Configuration Firebase
└── .firebaserc                 # Projet Firebase
```

## 🎨 Catégories disponibles

### Produits (Neuve/Occasion)
Électronique, Mode, Automobile, Immobilier, Mobilier, Alimentation, Sport, Livres, Jouets, Animaux, Jardin, Bricolage, Bijoux, Art, Musique

### Services
Réparation, Beauté, Santé, Éducation, Digital, Transport, Nettoyage, Événementiel, Juridique, Finance, Immobilier, Photographie, Traduction, Livraison, Sécurité, Consulting, Marketing

## 🐛 Dépannage

### L'upload d'images ne fonctionne pas
```bash
# Redéployer les règles Storage
npm run deploy:rules
```

### Les produits ne s'affichent pas
- Vérifier la console du navigateur pour les erreurs
- Vérifier que l'utilisateur est connecté
- Vérifier la console Firebase

### Erreur de permission
- S'assurer que l'utilisateur est authentifié
- Vérifier que les règles sont déployées

## 📚 Documentation

- `FIREBASE_RULES.md` - Détails des règles de sécurité
- `FIREBASE_DEPLOYMENT.md` - Guide de déploiement complet
- `FIREBASE_SUCCESS.md` - Résumé de la configuration
- `FIREBASE_SETUP.md` - Configuration initiale
- `FIREBASE_ACTIVATION.md` - Activation des services

## 🎯 Prochaines étapes

1. Tester l'ajout de produits avec différents types
2. Vérifier que les images s'uploadent correctement
3. Consulter les données dans Firebase Console
4. Implémenter la récupération des produits depuis Firestore
5. Ajouter la pagination et la recherche

## 💡 Conseils

- Utilisez toujours un compte réel pour tester
- Vérifiez la console Firebase régulièrement
- Gardez les règles de sécurité à jour
- Testez avec différents types d'images et tailles

---

**Tout est prêt !** Lancez `npm run dev` et commencez à tester ! 🚀
