# Firebase - Configuration Active ✅

## Services Firebase activés

Votre projet Firebase **banho-zando-online-3ljs41** est déjà configuré avec :

### ✅ Authentication
- **Email/Password** : Activé
- Les utilisateurs peuvent s'inscrire et se connecter
- Réinitialisation de mot de passe par email fonctionnelle

### ✅ Firestore Database
- Base de données NoSQL en temps réel
- Collections prêtes à être utilisées :
  - `users` - Profils utilisateurs
  - `products` - Catalogue de produits
  - `orders` - Commandes

### ✅ Storage
- Stockage de fichiers (images de produits, photos de profil)
- Prêt à recevoir les uploads

## Fonctionnalités implémentées dans l'app

### 🔐 Authentification
- ✅ Inscription avec email/mot de passe
- ✅ Connexion
- ✅ Déconnexion
- ✅ Mot de passe oublié (réinitialisation par email)
- ✅ Persistance de session
- ✅ Observer d'état d'authentification

### 👤 Profil utilisateur
- ✅ Affichage des informations de l'utilisateur connecté
- ✅ Nom, email, date de création
- ✅ ID Firebase (UID)
- ✅ Photo de profil (si disponible)

### 📦 Services disponibles

#### `services/authService.ts`
```typescript
- signUp(email, password, displayName)
- signIn(email, password)
- logOut()
- onAuthChange(callback)
- getUserProfile(uid)
```

#### `services/productService.ts`
```typescript
- addProduct(product)
- getAllProducts()
- getProductsByCategory(category)
- updateProduct(id, updates)
- deleteProduct(id)
```

#### `services/orderService.ts`
```typescript
- createOrder(order)
- getUserOrders(userId)
- updateOrderStatus(orderId, status)
```

## Test de l'authentification

### Pour tester l'inscription :
1. Ouvrir l'app
2. Passer l'onboarding (ou cliquer "Plus tard")
3. Cliquer sur "S'inscrire"
4. Remplir le formulaire
5. Créer un compte

### Pour tester la connexion :
1. Utiliser un compte existant
2. Entrer email et mot de passe
3. Se connecter

### Pour tester la réinitialisation :
1. Cliquer sur "Mot de passe oublié ?"
2. Entrer votre email
3. Vérifier votre boîte mail
4. Suivre le lien de réinitialisation

## Prochaines étapes recommandées

### 1. Charger les produits depuis Firestore
Actuellement, les produits sont en dur dans le code. Pour les charger depuis Firestore :

```typescript
import { getAllProducts } from './services/productService';

// Dans HomeView
useEffect(() => {
  const loadProducts = async () => {
    const productsFromDB = await getAllProducts();
    setProducts(productsFromDB);
  };
  loadProducts();
}, []);
```

### 2. Sauvegarder les favoris et le panier
```typescript
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

// Sauvegarder les favoris
const saveFavorites = async (userId: string, favorites: string[]) => {
  await updateDoc(doc(db, 'users', userId), { favorites });
};

// Sauvegarder le panier
const saveCart = async (userId: string, cart: any[]) => {
  await updateDoc(doc(db, 'users', userId), { cart });
};
```

### 3. Créer des commandes
```typescript
import { createOrder } from './services/orderService';

const handleCheckout = async () => {
  const order = {
    userId: currentUser.uid,
    items: cart,
    total: calculateTotal(cart),
    status: 'En cours',
    deliveryAddress: '...',
    paymentMethod: 'BanhoPay'
  };
  
  await createOrder(order);
  setCart([]);
};
```

### 4. Upload d'images
```typescript
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

const uploadImage = async (file: File) => {
  const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return url;
};
```

## Règles de sécurité Firestore (recommandées)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Products
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Orders
    match /orders/{orderId} {
      allow read: if request.auth != null && 
                     resource.data.userId == request.auth.uid;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
                       resource.data.userId == request.auth.uid;
    }
  }
}
```

## Règles de sécurité Storage (recommandées)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /products/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /profiles/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth.uid == userId;
    }
  }
}
```

## Support

L'authentification est maintenant complètement fonctionnelle ! Vous pouvez :
- Créer de nouveaux comptes
- Vous connecter avec des comptes existants
- Réinitialiser les mots de passe
- Gérer les sessions utilisateur

Tous les services Firebase sont prêts à être utilisés ! 🚀
