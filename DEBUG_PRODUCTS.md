# 🐛 Debug - Produits ne s'affichent pas

## Problème
Les produits ajoutés dans Firebase ne s'affichent pas dans la page d'accueil.

## Solutions à tester

### 1. Vérifier dans la console du navigateur

Ouvrez la console du navigateur (F12) et regardez les messages :
- Y a-t-il des erreurs rouges ?
- Que dit le console.log "Chargement des produits, condition:" ?
- Que dit le console.log "Produits chargés:" ?

### 2. Cliquer sur le bouton 🔄 (Debug)

Un bouton bleu avec 🔄 a été ajouté en haut à droite de la page d'accueil.
Cliquez dessus et regardez la console pour voir :
- `isAuthenticated`: doit être `true`
- `productCondition`: doit être 'neuve', 'occasion' ou 'services'
- `realProducts`: doit contenir vos produits
- `loadingProducts`: état de chargement

### 3. Vérifier dans Firebase Console

1. Allez sur : https://console.firebase.google.com/project/banho-zando-online-3ljs41/firestore
2. Vérifiez que la collection `products` existe
3. Vérifiez que vos produits ont bien le champ `condition` avec la valeur 'neuve', 'occasion' ou 'services'
4. Vérifiez que le champ `createdAt` existe

### 4. Tester avec le fichier test-firestore.html

1. Ouvrez le fichier `test-firestore.html` dans votre navigateur
2. Cliquez sur "Charger les produits"
3. Regardez les résultats affichés

### 5. Vérifier les index Firestore

Si vous voyez une erreur mentionnant "index" ou "failed-precondition" :

1. Allez sur : https://console.firebase.google.com/project/banho-zando-online-3ljs41/firestore/indexes
2. Vérifiez si un index est en cours de création (statut "Building")
3. Attendez que l'index soit créé (peut prendre 5-10 minutes)

### 6. Vérifier les règles Firestore

Les règles permettent-elles la lecture publique des produits ?

```bash
firebase firestore:rules:get
```

La règle pour `products` devrait être :
```
allow read: if true;
```

## Code de debug ajouté

### Dans App.tsx

1. **Console.log dans loadProducts** :
   - Affiche la condition de recherche
   - Affiche le nombre de produits chargés
   - Affiche les erreurs détaillées

2. **Bouton de debug 🔄** :
   - Affiche l'état complet dans la console
   - Force le rechargement des produits

3. **Gestion d'erreur améliorée** :
   - Détecte les erreurs d'index manquant
   - Affiche un message clair à l'utilisateur

### Dans productService.ts

1. **Fallback sans orderBy** :
   - Si l'index n'existe pas, essaie sans tri
   - Trie manuellement les résultats côté client

## Erreurs courantes

### Erreur: "The query requires an index"

**Solution** : Attendez que Firebase crée l'index automatiquement (5-10 min) ou créez-le manuellement :

1. Copiez le lien dans l'erreur de la console
2. Ouvrez-le dans votre navigateur
3. Cliquez sur "Create Index"
4. Attendez la création

### Erreur: "Permission denied"

**Solution** : Vérifiez que vous êtes connecté et que les règles Firestore sont déployées :

```bash
firebase deploy --only firestore:rules
```

### Aucune erreur mais pas de produits

**Vérifications** :
1. Êtes-vous connecté ? (vérifiez en haut à droite)
2. Avez-vous sélectionné la bonne condition (Neuve/Occasion/Services) ?
3. Les produits ont-ils le bon champ `condition` dans Firestore ?

## Commandes utiles

```bash
# Voir les règles actuelles
firebase firestore:rules:get

# Redéployer les règles
firebase deploy --only firestore:rules

# Voir les index
firebase firestore:indexes:list

# Déployer les index
firebase deploy --only firestore:indexes
```

## Prochaines étapes

1. ✅ Ouvrir la console du navigateur
2. ✅ Cliquer sur le bouton 🔄
3. ✅ Noter les messages dans la console
4. ✅ Vérifier Firebase Console
5. ✅ Tester avec test-firestore.html

## Contact

Si le problème persiste après ces vérifications, notez :
- Les messages de la console
- Les captures d'écran de Firebase Console
- Le résultat du test-firestore.html
