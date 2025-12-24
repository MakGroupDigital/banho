# 🔍 Test d'affichage des produits

## Étapes de débogage

### 1. Vérifier dans la console du navigateur
Ouvrez l'application et la console (F12), puis:
- Cliquez sur le bouton 🔄 dans la page d'accueil
- Regardez les logs dans la console:
  ```
  Chargement des produits, condition: neuve
  Produits chargés: X
  ```

### 2. Vérifier dans Firebase Console
1. Allez sur https://console.firebase.google.com
2. Sélectionnez votre projet: `banho-zando-online-3ljs41`
3. Allez dans Firestore Database
4. Vérifiez la collection `products`
5. Vérifiez que vos produits ont bien le champ `condition` avec la valeur `neuve`, `occasion` ou `services`

### 3. Vérifier les index Firestore
Si vous voyez une erreur dans la console mentionnant "index", cliquez sur le lien dans l'erreur pour créer l'index automatiquement.

### 4. Structure attendue d'un produit
```json
{
  "name": "iPhone 15 Pro Max",
  "price": 1200,
  "image": "https://...",
  "images": ["https://...", "https://..."],
  "rating": 4.5,
  "category": "Électronique",
  "description": "Description du produit...",
  "seller": "Nom du vendeur",
  "stock": 1,
  "reviews": 0,
  "condition": "neuve",  // IMPORTANT: doit être "neuve", "occasion" ou "services"
  "location": "Kinshasa, Gombe",
  "userId": "uid_du_vendeur",
  "createdAt": Timestamp
}
```

### 5. Test manuel
Si les produits ne s'affichent toujours pas:
1. Essayez de publier un nouveau produit via l'app
2. Vérifiez qu'il apparaît dans Firebase
3. Cliquez sur 🔄 pour recharger
4. Basculez entre Neuve/Occasion/Services

### 6. Vérifier les règles Firestore
Les règles doivent permettre la lecture:
```javascript
match /products/{productId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
}
```
