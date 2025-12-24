# Guide de déploiement Firebase

## 🎉 Configuration terminée !

Le projet est maintenant configuré avec Firebase et les règles de sécurité ont été déployées.

## ✅ Ce qui a été fait

1. **Firebase CLI installé** (version 15.0.0)
2. **Projet Firebase initialisé** : `banho-zando-online-3ljs41`
3. **Règles Storage déployées** : Upload d'images sécurisé
4. **Règles Firestore déployées** : Base de données sécurisée
5. **Index Firestore créés** : Requêtes optimisées

## 🔧 Fichiers de configuration

- `.firebaserc` : Configuration du projet Firebase
- `firebase.json` : Configuration des services Firebase
- `storage.rules` : Règles de sécurité Storage
- `firestore.rules` : Règles de sécurité Firestore
- `firestore.indexes.json` : Index de la base de données

## 🚀 Déploiement de l'application

### 1. Build de production
```bash
npm run build
```

### 2. Déployer sur Firebase Hosting
```bash
firebase deploy --only hosting
```

### 3. Déployer tout (Hosting + Rules)
```bash
firebase deploy
```

## 🔐 Règles de sécurité

### Storage
- ✅ Les utilisateurs authentifiés peuvent uploader des images
- ✅ Limite de 5MB pour les images de produits
- ✅ Limite de 2MB pour les photos de profil
- ✅ Seules les images sont acceptées

### Firestore
- ✅ Lecture publique des produits
- ✅ Création de produits pour utilisateurs authentifiés uniquement
- ✅ Modification/suppression par le propriétaire uniquement
- ✅ Validation des données (prix > 0, champs obligatoires)

## 📱 Tester l'application

L'application est maintenant prête à être testée :

1. **Créer un compte** : Inscription avec email/mot de passe
2. **Ajouter un produit** :
   - Cliquer sur le bouton + au centre de la navigation
   - Sélectionner le type (Neuve/Occasion/Services)
   - Ajouter jusqu'à 3 photos
   - Remplir les informations
   - Publier

3. **Voir les produits** : Les produits publiés apparaissent dans la page d'accueil

## 🌐 URLs du projet

- **Console Firebase** : https://console.firebase.google.com/project/banho-zando-online-3ljs41
- **Hosting URL** : Sera disponible après `firebase deploy --only hosting`

## 🛠️ Commandes utiles

```bash
# Voir le statut du projet
firebase projects:list

# Voir les règles actuelles
firebase storage:rules:get
firebase firestore:rules:get

# Déployer uniquement les règles
firebase deploy --only storage,firestore:rules

# Déployer uniquement le hosting
firebase deploy --only hosting

# Voir les logs
firebase functions:log

# Ouvrir la console Firebase
firebase open
```

## 🔄 Mettre à jour les règles

Si vous devez modifier les règles de sécurité :

1. Modifier `storage.rules` ou `firestore.rules`
2. Tester localement (optionnel) :
   ```bash
   firebase emulators:start
   ```
3. Déployer :
   ```bash
   firebase deploy --only storage,firestore:rules
   ```

## 📊 Extensions Firebase recommandées

Pour ajouter des fonctionnalités supplémentaires :

```bash
# Redimensionnement automatique des images
firebase ext:install storage-resize-images

# Suppression automatique des données utilisateur
firebase ext:install delete-user-data

# Traduction de texte
firebase ext:install firestore-translate-text
```

## 🐛 Dépannage

### Erreur "Permission denied"
- Vérifier que l'utilisateur est bien authentifié
- Vérifier que les règles sont déployées : `firebase deploy --only storage,firestore:rules`

### Images ne s'uploadent pas
- Vérifier la taille (max 5MB)
- Vérifier le format (images uniquement)
- Vérifier la connexion internet

### Produits ne s'affichent pas
- Vérifier les règles Firestore
- Vérifier la console Firebase pour les erreurs
- Vérifier que le produit a bien été créé dans Firestore

## 📝 Notes

- Les règles de sécurité sont en production
- Toutes les écritures nécessitent une authentification
- Les images sont publiques (lecture pour tous)
- Les données utilisateur sont isolées et protégées

## 🎯 Prochaines étapes

1. ✅ Tester l'upload d'images
2. ✅ Tester la création de produits
3. ⏳ Implémenter la récupération des produits depuis Firestore
4. ⏳ Ajouter la pagination
5. ⏳ Ajouter la recherche
6. ⏳ Implémenter le système de commandes
7. ⏳ Ajouter le chat entre acheteurs et vendeurs
