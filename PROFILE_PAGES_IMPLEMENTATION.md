# 📋 Implémentation des pages de profil

En raison de la taille du fichier App.tsx, je vais vous donner le code à ajouter par sections.

## Code à ajouter dans App.tsx

### 1. Fonction pour upload de photo de profil

Ajoutez cette fonction après `toggleFavoriteProduct` :

```typescript
// Fonction pour changer la photo de profil
const handleProfilePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file || !currentUser) return;

  // Vérifier la taille (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    showError('Fichier trop volumineux', 'La photo ne doit pas dépasser 2 MB.');
    return;
  }

  setUploadingPhoto(true);
  try {
    const photoURL = await uploadProfilePhoto(file, currentUser.uid);
    
    // Mettre à jour l'état local
    setCurrentUser({ ...currentUser, photoURL });
    
    showError('Photo mise à jour !', 'Votre photo de profil a été mise à jour avec succès.');
  } catch (error: any) {
    console.error('Erreur lors de l\'upload:', error);
    showError('Erreur', 'Une erreur est survenue lors de l\'upload de la photo.');
  } finally {
    setUploadingPhoto(false);
  }
};
```

### 2. Remplacer le ProfileView

Remplacez tout le `ProfileView` par ce code :

```typescript
const ProfileView = () => {
  // Si une page est active, l'afficher
  if (activeProfilePage) {
    return renderProfilePage();
  }

  // Sinon afficher la page principale du profil
  return (
    <div className="p-6 md:p-8 pb-24 md:pb-32">
      {/* Header Profil */}
      <div className="text-center mb-8">
        <div className="relative inline-block">
          <div className="w-32 h-32 bg-emerald-900 rounded-[2.5rem] flex items-center justify-center mb-4 shadow-2xl shadow-emerald-900/20 overflow-hidden">
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-16 h-16 text-white" />
            )}
          </div>
          
          {/* Bouton pour changer la photo */}
          <label className="absolute bottom-4 right-0 w-10 h-10 bg-orange-500 rounded-2xl border-4 border-white flex items-center justify-center shadow-lg cursor-pointer active:scale-90 transition-transform">
            <input
              type="file"
              accept="image/*"
              onChange={handleProfilePhotoChange}
              className="hidden"
              disabled={uploadingPhoto}
            />
            {uploadingPhoto ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Camera className="w-5 h-5 text-white" />
            )}
          </label>
        </div>
        <h2 className="text-2xl font-black text-gray-900">{currentUser?.displayName || 'Utilisateur'}</h2>
        <p className="text-sm text-gray-500 font-medium">Membre Premium Vérifié</p>
        <div className="flex items-center justify-center gap-1 mt-2">
          {[1,2,3,4,5].map(i => (
            <svg key={i} className="w-4 h-4 text-orange-400 fill-orange-400" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
          ))}
          <span className="text-xs text-gray-500 ml-1">(4.9)</span>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-emerald-900 p-4 rounded-2xl text-white text-center">
          <p className="text-2xl font-black">{userOrders.length}</p>
          <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Achats</p>
        </div>
        <div className="bg-orange-500 p-4 rounded-2xl text-white text-center">
          <p className="text-2xl font-black">{userSales.length}</p>
          <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Ventes</p>
        </div>
        <div className="bg-blue-500 p-4 rounded-2xl text-white text-center">
          <p className="text-2xl font-black">${userBalance.toFixed(0)}</p>
          <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Dépenses</p>
        </div>
      </div>

      {/* Informations personnelles */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6">
        <h3 className="text-lg font-black text-gray-900 mb-4">Informations personnelles</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Email</span>
            <span className="text-sm font-bold">{currentUser?.email || 'Non renseigné'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Téléphone</span>
            <span className="text-sm font-bold">{currentUser?.phoneNumber || '+243 900 123 456'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Membre depuis</span>
            <span className="text-sm font-bold">
              {currentUser?.metadata?.creationTime 
                ? new Date(currentUser.metadata.creationTime).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
                : 'Janvier 2023'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">ID Firestore</span>
            <span className="text-xs font-mono text-emerald-600">{currentUser?.uid?.substring(0, 20) || 'usr_ak_2024_001_banho'}...</span>
          </div>
        </div>
      </div>

      {/* Menu des paramètres */}
      <div className="space-y-3">
        {[
          { icon: ShoppingBag, label: 'Mes commandes', color: 'text-emerald-900', bg: 'bg-emerald-50', page: 'orders', badge: userOrders.length > 0 ? userOrders.length.toString() : null },
          { icon: Wallet, label: 'BanhoPay & Paiements', color: 'text-orange-500', bg: 'bg-orange-50', page: 'wallet' },
          { icon: UserIcon, label: 'Modifier le profil', color: 'text-blue-500', bg: 'bg-blue-50', page: 'edit-profile' },
          { icon: Heart, label: 'Mes favoris', color: 'text-purple-500', bg: 'bg-purple-50', page: 'favorites', badge: userFavorites.length > 0 ? userFavorites.length.toString() : null },
          { icon: Bell, label: 'Notifications', color: 'text-yellow-600', bg: 'bg-yellow-50', page: 'notifications' },
          { icon: Shield, label: 'Sécurité & Confidentialité', color: 'text-red-500', bg: 'bg-red-50', page: 'security' },
          { icon: HelpCircle, label: 'Aide & Support', color: 'text-gray-600', bg: 'bg-gray-50', page: 'support' },
          { icon: Settings, label: 'Paramètres généraux', color: 'text-gray-700', bg: 'bg-gray-50', page: 'settings' }
        ].map((item, i) => (
          <div 
            key={i} 
            onClick={() => setActiveProfilePage(item.page)}
            className="bg-white p-4 rounded-2xl flex items-center justify-between border border-gray-100 shadow-sm active:bg-gray-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.bg} ${item.color}`}>
                <item.icon className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-gray-800">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              {item.badge && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {item.badge}
                </span>
              )}
              <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Bouton déconnexion */}
      <button 
        onClick={async () => {
          try {
            await logOut();
            setActiveTab('home');
          } catch (error) {
            console.error('Erreur de déconnexion:', error);
            alert('Erreur lors de la déconnexion');
          }
        }}
        className="w-full mt-8 py-4 text-red-500 font-black text-sm bg-red-50 rounded-2xl active:bg-red-100 transition-colors uppercase tracking-widest border-2 border-red-100"
      >
        Déconnexion
      </button>
    </div>
  );
};
```

### 3. Ajouter la fonction renderProfilePage

Ajoutez cette fonction juste avant le `renderContent` :

```typescript
const renderProfilePage = () => {
  // Header commun pour toutes les pages
  const PageHeader = ({ title }: { title: string }) => (
    <div className="sticky top-0 bg-white/90 backdrop-blur-xl z-50 px-6 py-4 flex items-center gap-4 border-b border-gray-100 mb-6">
      <button 
        onClick={() => setActiveProfilePage(null)}
        className="p-2 bg-gray-100 rounded-xl active:scale-90 transition-transform"
      >
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h2 className="text-lg font-black text-gray-900">{title}</h2>
    </div>
  );

  switch (activeProfilePage) {
    case 'orders':
      return (
        <div className="min-h-screen bg-gray-50 pb-24">
          <PageHeader title="Mes commandes" />
          <div className="px-6">
            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button className="flex-1 py-3 bg-emerald-900 text-white rounded-xl font-bold text-sm">
                Achats ({userOrders.length})
              </button>
              <button 
                onClick={() => setActiveProfilePage('sales')}
                className="flex-1 py-3 bg-white border-2 border-gray-200 text-gray-600 rounded-xl font-bold text-sm"
              >
                Ventes ({userSales.length})
              </button>
            </div>
            
            {/* Liste des commandes */}
            {userOrders.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-bold">Aucun achat</p>
              </div>
            ) : (
              <div className="space-y-4">
                {userOrders.map(order => (
                  <div key={order.id} className="bg-white p-5 rounded-2xl border border-gray-100">
                    <div className="flex justify-between mb-3">
                      <div>
                        <p className="font-black text-sm">#{order.id?.substring(0, 8).toUpperCase()}</p>
                        <p className="text-xs text-gray-500">
                          {order.createdAt?.toDate().toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        order.status === 'En cours' ? 'bg-orange-100 text-orange-600' :
                        order.status === 'Livrée' ? 'bg-emerald-100 text-emerald-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">
                      {order.items.map((item: any) => item.productName).join(', ')}
                    </p>
                    <p className="text-lg font-black text-emerald-900">${order.total}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );

    case 'sales':
      return (
        <div className="min-h-screen bg-gray-50 pb-24">
          <PageHeader title="Mes ventes" />
          <div className="px-6">
            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button 
                onClick={() => setActiveProfilePage('orders')}
                className="flex-1 py-3 bg-white border-2 border-gray-200 text-gray-600 rounded-xl font-bold text-sm"
              >
                Achats ({userOrders.length})
              </button>
              <button className="flex-1 py-3 bg-emerald-900 text-white rounded-xl font-bold text-sm">
                Ventes ({userSales.length})
              </button>
            </div>
            
            {/* Liste des ventes */}
            {userSales.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-bold">Aucune vente</p>
              </div>
            ) : (
              <div className="space-y-4">
                {userSales.map(sale => (
                  <div key={sale.id} className="bg-white p-5 rounded-2xl border border-gray-100">
                    <div className="flex justify-between mb-3">
                      <div>
                        <p className="font-black text-sm">#{sale.id?.substring(0, 8).toUpperCase()}</p>
                        <p className="text-xs text-gray-500">
                          {sale.createdAt?.toDate().toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        sale.status === 'En cours' ? 'bg-orange-100 text-orange-600' :
                        sale.status === 'Livrée' ? 'bg-emerald-100 text-emerald-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {sale.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">
                      {sale.items.filter((item: any) => item.sellerId === currentUser?.uid).map((item: any) => item.productName).join(', ')}
                    </p>
                    <p className="text-lg font-black text-emerald-900">
                      ${sale.items.filter((item: any) => item.sellerId === currentUser?.uid).reduce((sum: number, item: any) => sum + item.price, 0)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );

    case 'favorites':
      return (
        <div className="min-h-screen bg-gray-50 pb-24">
          <PageHeader title="Mes favoris" />
          <div className="px-6">
            {loadingFavorites ? (
              <div className="flex justify-center py-12">
                <div className="w-12 h-12 border-4 border-emerald-900 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : userFavorites.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-bold">Aucun favori</p>
                <p className="text-sm text-gray-400 mt-2">Ajoutez des produits à vos favoris</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {realProducts.filter(p => favoriteProductIds.includes(p.id || '')).map(product => (
                  <div key={product.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
                    <div className="relative aspect-[4/5]" onClick={() => setSelectedProduct(product)}>
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover cursor-pointer" />
                      <button 
                        onClick={(e) => {e.stopPropagation(); toggleFavorite(product.id || '');}}
                        className="absolute top-3 left-3 p-2 bg-white/90 backdrop-blur rounded-full shadow-lg active:scale-90 transition-transform"
                      >
                        <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                      </button>
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-bold text-gray-800 line-clamp-1 mb-2">{product.name}</h3>
                      <p className="text-emerald-900 font-black text-lg">${product.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );

    // Ajoutez les autres pages ici (edit-profile, wallet, notifications, security, support, settings)
    // Pour l'instant, retournons une page simple
    default:
      return (
        <div className="min-h-screen bg-gray-50 pb-24">
          <PageHeader title={activeProfilePage || 'Page'} />
          <div className="px-6 text-center py-12">
            <p className="text-gray-500">Page en cours de développement</p>
          </div>
        </div>
      );
  }
};
```

## Déploiement

Après avoir ajouté ce code, déployez les règles :

```bash
firebase deploy --only firestore:rules
```

## Test

1. Lancez l'application : `npm run dev`
2. Connectez-vous
3. Allez dans le profil
4. Testez chaque page
5. Changez votre photo de profil
6. Ajoutez des favoris
7. Vérifiez vos achats et ventes
