# Règles de sécurité Firebase

## ✅ Déploiement réussi

Les règles de sécurité ont été déployées avec succès sur le projet Firebase `banho-zando-online-3ljs41`.

## 📦 Storage Rules (storage.rules)

### Règles pour les images de produits
- **Lecture** : Accessible à tous (public)
- **Écriture** : 
  - Utilisateur doit être authentifié
  - Peut uniquement uploader dans son propre dossier (`products/{userId}/`)
  - Taille maximale : 5 MB
  - Types acceptés : Images uniquement (image/*)

### Règles pour les photos de profil
- **Lecture** : Accessible à tous (public)
- **Écriture** :
  - Utilisateur doit être authentifié
  - Peut uniquement uploader dans son propre dossier (`profiles/{userId}/`)
  - Taille maximale : 2 MB
  - Types acceptés : Images uniquement (image/*)

## 🗄️ Firestore Rules (firestore.rules)

### Collection `products`
- **Lecture** : Accessible à tous
- **Création** : 
  - Utilisateur authentifié uniquement
  - Le `userId` doit correspondre à l'utilisateur connecté
  - Validation des champs obligatoires (name, price, category, description)
  - Le prix doit être > 0
- **Modification/Suppression** : Propriétaire uniquement

### Collection `orders`
- **Lecture** : Propriétaire ou vendeur uniquement
- **Création** : Utilisateur authentifié, userId doit correspondre
- **Modification** : Propriétaire ou vendeur
- **Suppression** : Propriétaire uniquement

### Collection `users`
- **Lecture** : Accessible à tous (profils publics)
- **Création/Modification** : Utilisateur peut gérer son propre profil uniquement
- **Suppression** : Utilisateur peut supprimer son propre profil uniquement

### Collection `reviews`
- **Lecture** : Accessible à tous
- **Création** : Utilisateur authentifié, userId doit correspondre
- **Modification/Suppression** : Propriétaire uniquement

### Collection `messages`
- **Lecture** : Expéditeur ou destinataire uniquement
- **Création** : Utilisateur authentifié, senderId doit correspondre
- **Modification/Suppression** : Expéditeur uniquement

## 📊 Index Firestore (firestore.indexes.json)

Les index suivants ont été configurés pour optimiser les requêtes :

1. **Products par condition et date** : `condition (ASC) + createdAt (DESC)`
2. **Products par catégorie et date** : `category (ASC) + createdAt (DESC)`
3. **Products par utilisateur et date** : `userId (ASC) + createdAt (DESC)`
4. **Orders par utilisateur et date** : `userId (ASC) + createdAt (DESC)`

## 🚀 Commandes utiles

### Déployer les règles
```bash
# Déployer Storage et Firestore rules
firebase deploy --only storage,firestore:rules

# Déployer uniquement Storage
firebase deploy --only storage

# Déployer uniquement Firestore
firebase deploy --only firestore:rules

# Déployer les index Firestore
firebase deploy --only firestore:indexes
```

### Tester les règles localement
```bash
# Démarrer l'émulateur
firebase emulators:start

# Tester les règles Firestore
firebase emulators:exec --only firestore "npm test"
```

### Voir les règles actuelles
```bash
# Voir les règles Storage
firebase storage:rules:get

# Voir les règles Firestore
firebase firestore:rules:get
```

## 🔐 Sécurité

Les règles actuelles garantissent :
- ✅ Authentification requise pour toutes les écritures
- ✅ Isolation des données utilisateur
- ✅ Validation des types de fichiers
- ✅ Limitation de la taille des fichiers
- ✅ Validation des données avant écriture
- ✅ Contrôle d'accès basé sur les rôles (propriétaire/vendeur)

## 📝 Notes importantes

1. Les images de produits sont publiques (lecture pour tous)
2. Seul le propriétaire peut modifier/supprimer ses produits
3. Les commandes sont visibles par l'acheteur ET le vendeur
4. Taille maximale : 5MB pour produits, 2MB pour profils
5. Seules les images sont acceptées dans Storage

## 🔄 Prochaines étapes

Pour ajouter de nouvelles règles ou modifier les existantes :
1. Modifier `storage.rules` ou `firestore.rules`
2. Tester localement avec les émulateurs
3. Déployer avec `firebase deploy --only storage,firestore:rules`
