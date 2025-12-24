# Configuration Firebase - Banho App

## Connexion établie ✅

L'application est maintenant connectée à Firebase avec le projet **banho-zando-online-3ljs41**.

## Services disponibles

### 1. Authentication (`services/authService.ts`)
- `signUp(email, password, displayName)` - Inscription d'un nouvel utilisateur
- `signIn(email, password)` - Connexion
- `logOut()` - Déconnexion
- `onAuthChange(callback)` - Observer l'état de connexion
- `getUserProfile(uid)` - Récupérer le profil utilisateur

### 2. Products (`services/productService.ts`)
- `addProduct(product)` - Ajouter un produit
- `getAllProducts()` - Récupérer tous les produits
- `getProductsByCategory(category)` - Filtrer par catégorie
- `updateProduct(id, updates)` - Mettre à jour un produit
- `deleteProduct(id)` - Supprimer un produit

### 3. Orders (`services/orderService.ts`)
- `createOrder(order)` - Créer une commande
- `getUserOrders(userId)` - Récupérer les commandes d'un utilisateur
- `updateOrderStatus(orderId, status)` - Mettre à jour le statut

## Structure Firestore

### Collections créées :

#### `users`
```
{
  uid: string
  email: string
  displayName: string
  photoURL?: string
  phone?: string
  balance: number
  favorites: string[]
  cart: any[]
  createdAt: Date
}
```

#### `products`
```
{
  name: string
  price: number
  image: string
  images: string[]
  rating: number
  category: string
  description: string
  seller: string
  stock: number
  reviews: number
  createdAt: Timestamp
}
```

#### `orders`
```
{
  userId: string
  items: any[]
  total: number
  status: 'En cours' | 'Livrée' | 'Annulée'
  deliveryAddress?: string
  paymentMethod?: string
  createdAt: Timestamp
}
```

## Utilisation dans l'app

```typescript
import { auth, db, storage } from './firebase';
import { signUp, signIn, logOut } from './services/authService';
import { getAllProducts, addProduct } from './services/productService';
import { createOrder, getUserOrders } from './services/orderService';
```

## Prochaines étapes

1. Activer l'authentification Email/Password dans la console Firebase
2. Configurer les règles de sécurité Firestore
3. Activer Storage pour les images de produits
4. Implémenter l'authentification dans l'UI
5. Charger les produits depuis Firestore au lieu des données statiques
