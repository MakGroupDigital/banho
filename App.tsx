
import React, { useState, useEffect } from 'react';
import { ShoppingBag, Wallet, MessageSquare, User as UserIcon, Eye, EyeOff, ArrowUpRight, Search, Heart, Bell, Shield, HelpCircle, Settings, Camera } from 'lucide-react';
import { auth, db, storage } from './firebase';
import { signUp, signIn, logOut, onAuthChange } from './services/authService';
import { addProduct, uploadImage, getProductsByCondition } from './services/productService';
import { getUserOrders, getUserSales, createOrder } from './services/orderService';
import { getUserTransactions, getUserBalance, createTransaction } from './services/transactionService';
import { getUserFavorites, addFavorite, removeFavorite, isFavorite } from './services/favoriteService';
import { uploadProfilePhoto, saveUserProfile, getUserProfile } from './services/userService';
import { getUserNotifications, createOrderNotification, createSaleNotification, markAsRead, markAllAsRead } from './services/notificationService';
import { sendPasswordResetEmail } from 'firebase/auth';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [showSplash, setShowSplash] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'signup' | 'forgot'>('login');
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorDialog, setErrorDialog] = useState<{show: boolean, title: string, message: string}>({
    show: false,
    title: '',
    message: ''
  });
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [productCondition, setProductCondition] = useState<'neuve' | 'occasion' | 'services'>('neuve');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [addProductType, setAddProductType] = useState<'neuve' | 'occasion' | 'services'>('neuve');
  
  // États pour le formulaire d'ajout de produit
  const [productTitle, setProductTitle] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productLocation, setProductLocation] = useState('');
  const [productImages, setProductImages] = useState<File[]>([]);
  const [productImagePreviews, setProductImagePreviews] = useState<string[]>([]);
  const [uploadingProduct, setUploadingProduct] = useState(false);
  
  // États pour les données réelles
  const [realProducts, setRealProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [userTransactions, setUserTransactions] = useState<any[]>([]);
  const [userBalance, setUserBalance] = useState(0);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  
  // États pour les favoris
  const [userFavorites, setUserFavorites] = useState<any[]>([]);
  const [favoriteProductIds, setFavoriteProductIds] = useState<string[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  
  // États pour les ventes
  const [userSales, setUserSales] = useState<any[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);
  
  // États pour les pages de profil
  const [activeProfilePage, setActiveProfilePage] = useState<string | null>(null);
  
  // États pour la modification du profil
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileLocation, setProfileLocation] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // États pour les notifications
  const [userNotifications, setUserNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // États pour la page de caisse (checkout)
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutProduct, setCheckoutProduct] = useState<any>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  const showError = (title: string, message: string) => {
    setErrorDialog({ show: true, title, message });
  };

  const hideError = () => {
    setErrorDialog({ show: false, title: '', message: '' });
  };

  // Gérer la sélection d'images
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files).slice(0, 3 - productImages.length);
    
    // Créer les previews
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    setProductImages(prev => [...prev, ...newFiles]);
    
    // Réinitialiser l'input pour permettre de sélectionner le même fichier
    e.target.value = '';
  };

  // Supprimer une image
  const removeImage = (index: number) => {
    setProductImages(prev => prev.filter((_, i) => i !== index));
    setProductImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Réinitialiser le formulaire
  const resetProductForm = () => {
    setProductTitle('');
    setProductCategory('');
    setProductPrice('');
    setProductDescription('');
    setProductLocation('');
    setProductImages([]);
    setProductImagePreviews([]);
    setAddProductType('neuve');
  };

  // Publier le produit
  const handlePublishProduct = async () => {
    // Validation
    if (!productTitle.trim()) {
      showError('Titre manquant', 'Veuillez entrer un titre pour votre produit.');
      return;
    }
    if (!productCategory) {
      showError('Catégorie manquante', 'Veuillez sélectionner une catégorie.');
      return;
    }
    if (!productPrice || parseFloat(productPrice) <= 0) {
      showError('Prix invalide', 'Veuillez entrer un prix valide.');
      return;
    }
    if (!productDescription.trim()) {
      showError('Description manquante', 'Veuillez décrire votre produit ou service.');
      return;
    }
    if (!productLocation.trim()) {
      showError('Localisation manquante', 'Veuillez indiquer votre localisation.');
      return;
    }
    if (productImages.length === 0) {
      showError('Photos manquantes', 'Veuillez ajouter au moins une photo de votre produit.');
      return;
    }

    if (!currentUser) {
      showError('Non connecté', 'Vous devez être connecté pour publier un produit.');
      return;
    }

    setUploadingProduct(true);

    try {
      // Upload des images
      const imageUrls: string[] = [];
      for (const file of productImages) {
        const url = await uploadImage(file, currentUser.uid);
        imageUrls.push(url);
      }

      // Créer le produit
      const newProduct = {
        name: productTitle,
        price: parseFloat(productPrice),
        image: imageUrls[0],
        images: imageUrls,
        rating: 0,
        category: productCategory,
        description: productDescription,
        seller: currentUser.displayName || 'Vendeur',
        stock: addProductType === 'services' ? 999 : 1,
        reviews: 0,
        condition: addProductType,
        location: productLocation,
        userId: currentUser.uid
      };

      await addProduct(newProduct);

      // Succès
      showError('Produit publié !', 'Votre produit a été publié avec succès et est maintenant visible par tous les utilisateurs.');
      
      // Recharger les produits
      await loadProducts();
      
      // Réinitialiser et fermer
      resetProductForm();
      setShowAddProduct(false);
      setActiveTab('home');

    } catch (error: any) {
      console.error('Erreur lors de la publication:', error);
      showError('Erreur de publication', error.message || 'Une erreur est survenue lors de la publication de votre produit. Veuillez réessayer.');
    } finally {
      setUploadingProduct(false);
    }
  };

  const toggleFavorite = (productId: string) => {
    toggleFavoriteProduct(productId);
  };

  const addToCart = async (product: any) => {
    if (!currentUser) {
      showError('Non connecté', 'Vous devez être connecté pour ajouter au panier.');
      return;
    }

    try {
      // Créer une commande
      const order = {
        userId: currentUser.uid,
        items: [
          {
            productId: product.id,
            productName: product.name,
            productImage: product.image,
            price: product.price,
            quantity: 1,
            sellerId: product.userId,
            sellerName: product.seller
          }
        ],
        total: product.price,
        status: 'En cours' as const,
        deliveryAddress: product.location || 'À définir',
        paymentMethod: 'BanhoPay'
      };

      const createdOrder = await createOrder(order);

      // Créer une transaction
      await createTransaction({
        userId: currentUser.uid,
        type: 'Achat',
        amount: product.price,
        description: `Achat: ${product.name}`,
        location: product.location
      });

      // Créer une notification pour l'acheteur
      await createOrderNotification(currentUser.uid, createdOrder.id || '', product.price);

      // Créer une notification pour le vendeur
      if (product.userId && product.userId !== currentUser.uid) {
        await createSaleNotification(product.userId, product.name, product.price);
      }

      // Recharger les commandes, transactions et notifications
      await loadUserOrders(currentUser.uid);
      await loadUserTransactions(currentUser.uid);
      await loadUserNotifications(currentUser.uid);

      showError('Commande créée !', `${product.name} a été ajouté au panier et la commande a été créée.`);
      setActiveTab('orders');
    } catch (error) {
      console.error('Erreur lors de l\'ajout au panier:', error);
      showError('Erreur', 'Une erreur est survenue lors de l\'ajout au panier.');
    }
  };

  // Timer pour le splash screen
  useEffect(() => {
    if (showSplash) {
      const timer = setTimeout(() => setShowSplash(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSplash]);

  // Observer l'état d'authentification Firebase
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        setShowOnboarding(false);
        // Fermer le dialogue d'erreur si l'utilisateur se connecte avec succès
        hideError();
        
        // Charger les données de l'utilisateur
        loadUserOrders(user.uid);
        loadUserTransactions(user.uid);
        loadUserFavorites(user.uid);
        loadUserSales(user.uid);
        loadUserNotifications(user.uid);
        
        // Charger le profil
        setProfileName(user.displayName || '');
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
        setUserOrders([]);
        setUserTransactions([]);
        setUserBalance(0);
        setUserFavorites([]);
        setFavoriteProductIds([]);
        setUserSales([]);
      }
      setIsInitialLoad(false);
    });

    return () => unsubscribe();
  }, []);

  // Charger les produits selon la condition sélectionnée
  useEffect(() => {
    if (isAuthenticated) {
      loadProducts();
    }
  }, [productCondition, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fonction pour charger les produits
  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      console.log('Chargement des produits, condition:', productCondition);
      const products = await getProductsByCondition(productCondition);
      console.log('Produits chargés:', products.length);
      setRealProducts(products);
    } catch (error: any) {
      console.error('Erreur lors du chargement des produits:', error);
      
      // Si l'erreur est liée à un index manquant, afficher un message
      if (error.code === 'failed-precondition' || error.message?.includes('index')) {
        showError(
          'Index en cours de création',
          'Firebase crée les index nécessaires. Cela peut prendre quelques minutes. Veuillez réessayer dans un instant.'
        );
      }
    } finally {
      setLoadingProducts(false);
    }
  };

  // Fonction pour charger les commandes de l'utilisateur
  const loadUserOrders = async (userId: string) => {
    setLoadingOrders(true);
    try {
      const orders = await getUserOrders(userId);
      setUserOrders(orders);
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Fonction pour charger les transactions de l'utilisateur
  const loadUserTransactions = async (userId: string) => {
    setLoadingTransactions(true);
    try {
      const transactions = await getUserTransactions(userId);
      setUserTransactions(transactions);
      
      const balance = await getUserBalance(userId);
      setUserBalance(balance);
    } catch (error) {
      console.error('Erreur lors du chargement des transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Fonction pour charger les favoris de l'utilisateur
  const loadUserFavorites = async (userId: string) => {
    setLoadingFavorites(true);
    try {
      const favorites = await getUserFavorites(userId);
      setUserFavorites(favorites);
      setFavoriteProductIds(favorites.map(f => f.productId));
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error);
    } finally {
      setLoadingFavorites(false);
    }
  };

  // Fonction pour charger les ventes de l'utilisateur
  const loadUserSales = async (userId: string) => {
    setLoadingSales(true);
    try {
      const sales = await getUserSales(userId);
      setUserSales(sales);
    } catch (error) {
      console.error('Erreur lors du chargement des ventes:', error);
    } finally {
      setLoadingSales(false);
    }
  };

  // Fonction pour charger les notifications de l'utilisateur
  const loadUserNotifications = async (userId: string) => {
    setLoadingNotifications(true);
    try {
      const notifications = await getUserNotifications(userId);
      setUserNotifications(notifications);
      const unread = notifications.filter(n => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Fonction pour gérer les favoris
  const toggleFavoriteProduct = async (productId: string) => {
    if (!currentUser) {
      showError('Non connecté', 'Vous devez être connecté pour ajouter aux favoris.');
      return;
    }

    try {
      const favoriteId = await isFavorite(currentUser.uid, productId);
      
      if (favoriteId) {
        // Supprimer des favoris
        await removeFavorite(favoriteId);
        setFavoriteProductIds(prev => prev.filter(id => id !== productId));
      } else {
        // Ajouter aux favoris
        await addFavorite(currentUser.uid, productId);
        setFavoriteProductIds(prev => [...prev, productId]);
      }
      
      // Recharger les favoris
      await loadUserFavorites(currentUser.uid);
    } catch (error) {
      console.error('Erreur lors de la gestion du favori:', error);
      showError('Erreur', 'Une erreur est survenue lors de la gestion du favori.');
    }
  };

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

  // Composant de dialogue d'erreur moderne
  const ErrorDialog = () => {
    if (!errorDialog.show) return null;

    return (
      <div 
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        style={{ animation: 'fadeIn 0.2s ease-out' }}
      >
        <div 
          className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6"
          style={{ animation: 'slideInFromBottom4 0.3s ease-out' }}
        >
          {/* Icône d'erreur */}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          {/* Titre */}
          <h3 className="text-xl font-black text-gray-900 text-center mb-2">
            {errorDialog.title}
          </h3>

          {/* Message */}
          <p className="text-sm text-gray-600 text-center mb-6 leading-relaxed">
            {errorDialog.message}
          </p>

          {/* Bouton */}
          <button
            onClick={hideError}
            className="w-full bg-emerald-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-wider active:scale-95 transition-transform shadow-lg"
          >
            Compris
          </button>
        </div>
      </div>
    );
  };

  // Pages d'onboarding
  const OnboardingView = () => {
    const onboardingData = [
      {
        title: "Achetez en toute sécurité",
        description: "Découvrez des milliers de produits de qualité avec BanhoPay, votre portefeuille sécurisé intégré.",
        icon: (
          <div className="relative w-full h-64 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-orange-500/20 rounded-[3rem]"></div>
            <div className="relative">
              <div className="w-32 h-32 bg-emerald-900 rounded-[2rem] flex items-center justify-center shadow-2xl">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center shadow-xl">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
        )
      },
      {
        title: "BanhoPay intégré",
        description: "Gérez votre argent facilement avec notre portefeuille digital. Dépôt, retrait, envoi et paiement en un clic.",
        icon: (
          <div className="relative w-full h-64 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-emerald-500/20 rounded-[3rem]"></div>
            <div className="relative">
              <div className="w-48 h-32 bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-900 rounded-2xl shadow-2xl p-4 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 bg-white rounded-full overflow-hidden">
                    <img src="/logo-banho.png" alt="Banho" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 bg-orange-500 rounded-full border-2 border-white"></div>
                    <div className="w-6 h-6 bg-emerald-500 rounded-full border-2 border-white"></div>
                  </div>
                </div>
                <div>
                  <p className="text-white/60 text-xs font-bold">SOLDE</p>
                  <p className="text-white text-xl font-black">$2,450</p>
                </div>
              </div>
            </div>
          </div>
        )
      },
      {
        title: "Commandez rapidement",
        description: "Parcourez les catégories, ajoutez au panier et commandez en quelques secondes. Suivez vos commandes en temps réel.",
        icon: (
          <div className="relative w-full h-64 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-orange-500/20 rounded-[3rem]"></div>
            <div className="relative grid grid-cols-2 gap-4">
              <div className="w-24 h-32 bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="w-full h-20 bg-gradient-to-br from-emerald-200 to-emerald-300"></div>
                <div className="p-2">
                  <div className="w-full h-2 bg-gray-200 rounded mb-1"></div>
                  <div className="w-2/3 h-2 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="w-24 h-32 bg-white rounded-2xl shadow-xl overflow-hidden mt-8">
                <div className="w-full h-20 bg-gradient-to-br from-orange-200 to-orange-300"></div>
                <div className="p-2">
                  <div className="w-full h-2 bg-gray-200 rounded mb-1"></div>
                  <div className="w-2/3 h-2 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-emerald-900 rounded-full flex items-center justify-center shadow-2xl">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>
        )
      }
    ];

    const currentData = onboardingData[onboardingStep];

    const handleNext = () => {
      if (onboardingStep < onboardingData.length - 1) {
        setOnboardingStep(onboardingStep + 1);
      } else {
        setShowOnboarding(false);
      }
    };

    const handlePrevious = () => {
      if (onboardingStep > 0) {
        setOnboardingStep(onboardingStep - 1);
      }
    };

    const handleSkip = () => {
      setShowOnboarding(false);
      setIsAuthenticated(true);
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col p-6 relative">
        {/* Bouton Plus tard en haut */}
        <div className="flex justify-end mb-8">
          <button
            onClick={handleSkip}
            className="text-sm font-bold text-gray-500 hover:text-gray-700 px-4 py-2"
          >
            Plus tard
          </button>
        </div>

        {/* Contenu principal */}
        <div className="flex-1 flex flex-col justify-center items-center">
          {/* Illustration */}
          <div className="w-full max-w-sm mb-12">
            {currentData.icon}
          </div>

          {/* Indicateurs de pagination */}
          <div className="flex gap-2 mb-8">
            {onboardingData.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === onboardingStep
                    ? 'w-8 bg-emerald-900'
                    : 'w-2 bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Texte */}
          <div className="text-center mb-12 px-4">
            <h2 className="text-3xl font-black text-gray-900 mb-4">
              {currentData.title}
            </h2>
            <p className="text-gray-600 text-base leading-relaxed">
              {currentData.description}
            </p>
          </div>

          {/* Navigation avec flèches */}
          <div className="flex items-center gap-4 mb-8">
            {onboardingStep > 0 && (
              <button
                onClick={handlePrevious}
                className="w-12 h-12 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center active:scale-90 transition-transform shadow-sm"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            <button
              onClick={handleNext}
              className="flex-1 max-w-xs bg-emerald-900 text-white py-4 px-8 rounded-2xl font-black text-sm uppercase tracking-wider active:scale-95 transition-transform shadow-lg flex items-center justify-center gap-2"
            >
              {onboardingStep === onboardingData.length - 1 ? 'Commencer' : 'Suivant'}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Lien Se connecter */}
          <button
            onClick={() => {
              setShowOnboarding(false);
              setAuthView('login');
            }}
            className="text-sm font-bold text-emerald-900 hover:text-emerald-700"
          >
            Vous avez déjà un compte ? <span className="underline">Se connecter</span>
          </button>
        </div>
      </div>
    );
  };

  // Page de connexion
  const LoginView = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
      if (!email || !password) {
        showError('Champs manquants', 'Veuillez remplir tous les champs pour vous connecter.');
        return;
      }

      setLoading(true);

      try {
        await signIn(email, password);
        // L'état sera mis à jour automatiquement par onAuthChange
      } catch (err: any) {
        console.error('Erreur de connexion:', err);
        if (err.code === 'auth/user-not-found') {
          showError('Compte introuvable', 'Aucun compte n\'existe avec cet email. Veuillez vérifier ou créer un nouveau compte.');
        } else if (err.code === 'auth/wrong-password') {
          showError('Mot de passe incorrect', 'Le mot de passe que vous avez entré est incorrect. Veuillez réessayer ou cliquer sur "Mot de passe oublié".');
        } else if (err.code === 'auth/invalid-email') {
          showError('Email invalide', 'L\'adresse email que vous avez entrée n\'est pas valide. Veuillez vérifier et réessayer.');
        } else if (err.code === 'auth/invalid-credential') {
          showError('Identifiants incorrects', 'L\'email ou le mot de passe est incorrect. Veuillez vérifier vos informations et réessayer.');
        } else if (err.code === 'auth/too-many-requests') {
          showError('Trop de tentatives', 'Vous avez fait trop de tentatives de connexion. Veuillez attendre quelques minutes avant de réessayer.');
        } else if (err.code === 'auth/operation-not-allowed') {
          showError('Service indisponible', 'L\'authentification Email/Password n\'est pas activée. Veuillez contacter le support.');
        } else {
          showError('Erreur de connexion', err.message || 'Une erreur est survenue lors de la connexion. Veuillez réessayer.');
        }
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col p-6 justify-center">
        {/* Bouton de déconnexion si déjà connecté (pour debug) */}
        {currentUser && (
          <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl">
            <p className="text-sm font-bold text-blue-600 mb-2">Vous êtes déjà connecté en tant que {currentUser.email}</p>
            <button
              onClick={async () => {
                await logOut();
              }}
              className="text-sm font-bold text-blue-600 underline"
            >
              Se déconnecter pour tester
            </button>
          </div>
        )}

        {/* Logo */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-emerald-900 rounded-[2rem] overflow-hidden mx-auto mb-4 shadow-2xl">
            <img src="/logo-banho.png" alt="Banho" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-black text-emerald-900 mb-2">Banho</h1>
          <p className="text-orange-500 font-semibold text-sm uppercase tracking-[0.3em]">Zando na tshombo</p>
        </div>

        {/* Formulaire */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              className="w-full px-4 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:border-emerald-900 focus:outline-none text-sm font-medium"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Mot de passe</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:border-emerald-900 focus:outline-none text-sm font-medium pr-12"
                disabled={loading}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                type="button"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            onClick={() => setAuthView('forgot')}
            className="text-sm font-bold text-orange-500 hover:text-orange-600"
            type="button"
          >
            Mot de passe oublié ?
          </button>
        </div>

        {/* Bouton de connexion */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-emerald-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-wider active:scale-95 transition-transform shadow-lg mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>

        {/* Lien inscription */}
        <p className="text-center text-sm text-gray-600">
          Pas encore de compte ?{' '}
          <button
            onClick={() => setAuthView('signup')}
            className="font-bold text-emerald-900 hover:text-emerald-700"
            type="button"
          >
            S'inscrire
          </button>
        </p>
      </div>
    );
  };

  // Page d'inscription
  const SignupView = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSignup = async () => {
      if (!name || !email || !phone || !password || !confirmPassword) {
        showError('Champs manquants', 'Veuillez remplir tous les champs pour créer votre compte.');
        return;
      }
      if (password !== confirmPassword) {
        showError('Mots de passe différents', 'Les mots de passe que vous avez entrés ne correspondent pas. Veuillez vérifier et réessayer.');
        return;
      }
      if (password.length < 6) {
        showError('Mot de passe trop court', 'Votre mot de passe doit contenir au moins 6 caractères pour assurer la sécurité de votre compte.');
        return;
      }

      setLoading(true);

      try {
        await signUp(email, password, name);
        // L'état sera mis à jour automatiquement par onAuthChange
      } catch (err: any) {
        console.error('Erreur d\'inscription:', err);
        if (err.code === 'auth/email-already-in-use') {
          showError('Email déjà utilisé', 'Un compte existe déjà avec cet email. Veuillez vous connecter ou utiliser un autre email.');
        } else if (err.code === 'auth/invalid-email') {
          showError('Email invalide', 'L\'adresse email que vous avez entrée n\'est pas valide. Veuillez vérifier et réessayer.');
        } else if (err.code === 'auth/weak-password') {
          showError('Mot de passe faible', 'Votre mot de passe est trop faible. Utilisez au moins 6 caractères avec des lettres et des chiffres.');
        } else if (err.code === 'auth/operation-not-allowed') {
          showError('Service indisponible', 'L\'authentification Email/Password n\'est pas activée. Veuillez contacter le support.');
        } else {
          showError('Erreur d\'inscription', err.message || 'Une erreur est survenue lors de la création de votre compte. Veuillez réessayer.');
        }
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col p-6 pt-12 pb-12">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => setAuthView('login')}
            className="p-2 bg-white rounded-xl shadow-sm active:scale-90 transition-transform"
            disabled={loading}
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-2xl font-black text-emerald-900 ml-4">Créer un compte</h2>
        </div>

        {/* Formulaire */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Nom complet</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Votre nom"
              className="w-full px-4 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:border-emerald-900 focus:outline-none text-sm font-medium"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              className="w-full px-4 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:border-emerald-900 focus:outline-none text-sm font-medium"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Téléphone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+243 900 000 000"
              className="w-full px-4 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:border-emerald-900 focus:outline-none text-sm font-medium"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Mot de passe</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:border-emerald-900 focus:outline-none text-sm font-medium pr-12"
                disabled={loading}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                type="button"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Confirmer le mot de passe</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:border-emerald-900 focus:outline-none text-sm font-medium"
              disabled={loading}
            />
          </div>
        </div>

        {/* Bouton d'inscription */}
        <button
          onClick={handleSignup}
          disabled={loading}
          className="w-full bg-emerald-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-wider active:scale-95 transition-transform shadow-lg mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Inscription...' : 'S\'inscrire'}
        </button>

        {/* Lien connexion */}
        <p className="text-center text-sm text-gray-600">
          Déjà un compte ?{' '}
          <button
            onClick={() => setAuthView('login')}
            className="font-bold text-emerald-900 hover:text-emerald-700"
            type="button"
          >
            Se connecter
          </button>
        </p>
      </div>
    );
  };

  // Page mot de passe oublié
  const ForgotPasswordView = () => {
    const [email, setEmail] = useState('');
    const [success, setSuccess] = useState(false);

    const handleReset = async () => {
      if (!email) {
        showError('Email manquant', 'Veuillez entrer votre adresse email pour recevoir le lien de réinitialisation.');
        return;
      }

      setLoading(true);

      try {
        await sendPasswordResetEmail(auth, email);
        setSuccess(true);
      } catch (err: any) {
        console.error('Erreur de réinitialisation:', err);
        if (err.code === 'auth/user-not-found') {
          showError('Compte introuvable', 'Aucun compte n\'existe avec cet email. Veuillez vérifier ou créer un nouveau compte.');
        } else if (err.code === 'auth/invalid-email') {
          showError('Email invalide', 'L\'adresse email que vous avez entrée n\'est pas valide. Veuillez vérifier et réessayer.');
        } else {
          showError('Erreur d\'envoi', err.message || 'Une erreur est survenue lors de l\'envoi de l\'email. Veuillez réessayer.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (success) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col p-6 justify-center">
          {/* Icône de succès */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Email envoyé !</h2>
            <p className="text-sm text-gray-600 mb-8">
              Un email de réinitialisation a été envoyé à <span className="font-bold">{email}</span>. Vérifiez votre boîte de réception.
            </p>
          </div>

          {/* Bouton retour */}
          <button
            onClick={() => setAuthView('login')}
            className="w-full bg-emerald-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-wider active:scale-95 transition-transform shadow-lg"
          >
            Retour à la connexion
          </button>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col p-6 justify-center">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => setAuthView('login')}
            className="p-2 bg-white rounded-xl shadow-sm active:scale-90 transition-transform"
            disabled={loading}
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Icône */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Mot de passe oublié ?</h2>
          <p className="text-sm text-gray-600">
            Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>
        </div>

        {/* Formulaire */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              className="w-full px-4 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:border-emerald-900 focus:outline-none text-sm font-medium"
              disabled={loading}
              onKeyPress={(e) => e.key === 'Enter' && handleReset()}
            />
          </div>
        </div>

        {/* Bouton */}
        <button
          onClick={handleReset}
          disabled={loading}
          className="w-full bg-emerald-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-wider active:scale-95 transition-transform shadow-lg mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Envoi...' : 'Envoyer le lien'}
        </button>

        {/* Lien retour */}
        <button
          onClick={() => setAuthView('login')}
          className="w-full text-center text-sm font-bold text-gray-600 hover:text-gray-800"
          type="button"
        >
          Retour à la connexion
        </button>
      </div>
    );
  };

  const HomeView = () => {
    // Catégories de produits
    const productCategories = [
      { 
        name: 'Tous', 
        icon: (
          <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        )
      },
      { 
        name: 'Électronique', 
        icon: (
          <div className="w-5 h-5 relative">
            <div className="w-full h-3 bg-emerald-600 rounded-sm"></div>
            <div className="w-2 h-1 bg-emerald-600 mx-auto mt-0.5 rounded-sm"></div>
          </div>
        )
      },
      { 
        name: 'Mode', 
        icon: (
          <div className="w-5 h-5 relative">
            <div className="w-full h-2 bg-orange-500 rounded-t-lg"></div>
            <div className="w-full h-3 bg-emerald-600 rounded-b-sm"></div>
          </div>
        )
      },
      { 
        name: 'Automobile', 
        icon: (
          <div className="w-5 h-5 relative">
            <div className="w-full h-2 bg-emerald-600 rounded-t-lg"></div>
            <div className="flex gap-1 mt-1">
              <div className="w-1.5 h-1.5 bg-gray-600 rounded-full"></div>
              <div className="flex-1"></div>
              <div className="w-1.5 h-1.5 bg-gray-600 rounded-full"></div>
            </div>
          </div>
        )
      },
      { 
        name: 'Immobilier', 
        icon: (
          <div className="w-5 h-5 relative">
            <div className="w-3 h-2 bg-orange-500 mx-auto" style={{clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}}></div>
            <div className="w-full h-2 bg-emerald-600 mt-0.5"></div>
            <div className="w-1 h-1 bg-orange-400 mx-auto"></div>
          </div>
        )
      },
      { 
        name: 'Mobilier', 
        icon: (
          <div className="w-5 h-5 relative">
            <div className="w-full h-1 bg-emerald-600 rounded"></div>
            <div className="w-1 h-3 bg-emerald-600 mx-auto"></div>
            <div className="w-3 h-1 bg-emerald-600 mx-auto rounded"></div>
          </div>
        )
      },
      { 
        name: 'Alimentation', 
        icon: (
          <div className="w-5 h-5 relative">
            <div className="w-3 h-3 bg-orange-500 rounded-full mx-auto"></div>
            <div className="w-1 h-2 bg-emerald-600 mx-auto -mt-1"></div>
          </div>
        )
      },
      { 
        name: 'Sport', 
        icon: (
          <div className="w-5 h-5 relative flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-emerald-600 rounded-full"></div>
          </div>
        )
      },
      { 
        name: 'Livres', 
        icon: (
          <div className="w-5 h-5 relative">
            <div className="w-4 h-5 bg-emerald-600 mx-auto rounded-r"></div>
            <div className="w-3 h-4 bg-orange-500 absolute top-0.5 left-0.5"></div>
          </div>
        )
      },
      { 
        name: 'Jouets', 
        icon: (
          <div className="w-5 h-5 relative">
            <div className="w-3 h-3 bg-orange-500 rounded-full mx-auto"></div>
            <div className="w-2 h-2 bg-emerald-600 rounded-full absolute bottom-0 left-1/2 -translate-x-1/2"></div>
          </div>
        )
      },
      { 
        name: 'Animaux', 
        icon: (
          <div className="w-5 h-5 relative">
            <div className="w-4 h-3 bg-emerald-600 rounded-t-full mx-auto"></div>
            <div className="flex gap-1 justify-center">
              <div className="w-1 h-2 bg-emerald-600"></div>
              <div className="w-1 h-2 bg-emerald-600"></div>
            </div>
          </div>
        )
      },
      { 
        name: 'Jardin', 
        icon: (
          <div className="w-5 h-5 relative">
            <div className="w-2 h-3 bg-emerald-600 mx-auto rounded-t"></div>
            <div className="w-4 h-1 bg-orange-500 mx-auto"></div>
          </div>
        )
      },
      { 
        name: 'Bricolage', 
        icon: (
          <div className="w-5 h-5 relative flex items-center justify-center">
            <div className="w-4 h-1 bg-gray-600 rotate-45"></div>
            <div className="w-1 h-4 bg-emerald-600 absolute"></div>
          </div>
        )
      },
      { 
        name: 'Bijoux', 
        icon: (
          <div className="w-5 h-5 relative flex items-center justify-center">
            <div className="w-3 h-3 border-2 border-orange-500 rotate-45"></div>
          </div>
        )
      },
      { 
        name: 'Art', 
        icon: (
          <div className="w-5 h-5 relative">
            <div className="w-4 h-4 border-2 border-emerald-600 mx-auto"></div>
            <div className="w-2 h-2 bg-orange-500 absolute top-1 left-1"></div>
          </div>
        )
      },
      { 
        name: 'Musique', 
        icon: (
          <div className="w-5 h-5 relative flex items-center justify-center">
            <div className="w-2 h-4 bg-emerald-600 rounded-full"></div>
            <div className="w-1 h-2 bg-emerald-600 absolute -top-0.5 right-1"></div>
          </div>
        )
      }
    ];

    // Catégories de services
    const serviceCategories = [
      { 
        name: 'Tous', 
        icon: (
          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        )
      },
      { 
        name: 'Réparation', 
        icon: (
          <div className="w-5 h-5 relative flex items-center justify-center">
            <div className="w-4 h-0.5 bg-blue-600 rotate-45"></div>
            <div className="w-2 h-2 border-2 border-blue-600 rounded-full absolute"></div>
          </div>
        )
      },
      { 
        name: 'Beauté', 
        icon: (
          <div className="w-5 h-5 relative">
            <div className="w-2 h-4 bg-orange-500 mx-auto rounded-t-full"></div>
            <div className="w-3 h-1 bg-blue-600 mx-auto -mt-0.5 rounded"></div>
          </div>
        )
      },
      { 
        name: 'Santé', 
        icon: (
          <div className="w-5 h-5 relative flex items-center justify-center">
            <div className="w-1 h-4 bg-blue-600"></div>
            <div className="w-4 h-1 bg-blue-600 absolute"></div>
          </div>
        )
      },
      { 
        name: 'Éducation', 
        icon: (
          <div className="w-5 h-5 relative">
            <div className="w-4 h-3 bg-blue-600 mx-auto rounded-t-lg"></div>
            <div className="w-2 h-1 bg-orange-500 mx-auto"></div>
          </div>
        )
      },
      { 
        name: 'Digital', 
        icon: (
          <div className="w-5 h-5 relative">
            <div className="w-4 h-4 border-2 border-blue-600 rounded mx-auto"></div>
            <div className="w-2 h-2 bg-orange-500 rounded absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
          </div>
        )
      },
      { 
        name: 'Transport', 
        icon: (
          <div className="w-5 h-5 relative">
            <div className="w-4 h-2 bg-blue-600 mx-auto rounded-t-lg"></div>
            <div className="flex gap-1 justify-center">
              <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
            </div>
          </div>
        )
      },
      { 
        name: 'Nettoyage', 
        icon: (
          <div className="w-5 h-5 relative flex items-center justify-center">
            <div className="w-3 h-4 bg-blue-600 rounded-t-full"></div>
            <div className="w-1 h-2 bg-blue-600 absolute bottom-0"></div>
          </div>
        )
      },
      { 
        name: 'Événementiel', 
        icon: (
          <div className="w-5 h-5 relative">
            <div className="w-4 h-3 bg-orange-500 mx-auto rounded-t-lg"></div>
            <div className="w-2 h-2 bg-blue-600 mx-auto"></div>
          </div>
        )
      },
      { 
        name: 'Juridique', 
        icon: (
          <div className="w-5 h-5 relative flex items-center justify-center">
            <div className="w-3 h-4 bg-blue-600 rounded-t"></div>
            <div className="w-4 h-1 bg-blue-600 absolute bottom-0"></div>
          </div>
        )
      },
      { 
        name: 'Finance', 
        icon: (
          <div className="w-5 h-5 relative flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-blue-600 rounded-full"></div>
            <div className="text-[8px] font-black text-blue-600">$</div>
          </div>
        )
      },
      { 
        name: 'Immobilier', 
        icon: (
          <div className="w-5 h-5 relative">
            <div className="w-3 h-2 bg-blue-600 mx-auto" style={{clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}}></div>
            <div className="w-full h-2 bg-blue-600 mt-0.5"></div>
          </div>
        )
      },
      { 
        name: 'Photographie', 
        icon: (
          <div className="w-5 h-5 relative">
            <div className="w-4 h-3 border-2 border-blue-600 rounded mx-auto"></div>
            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full absolute top-1 right-1"></div>
          </div>
        )
      },
      { 
        name: 'Traduction', 
        icon: (
          <div className="w-5 h-5 relative flex items-center justify-center">
            <div className="text-[10px] font-black text-blue-600">A→B</div>
          </div>
        )
      },
      { 
        name: 'Livraison', 
        icon: (
          <div className="w-5 h-5 relative">
            <div className="w-4 h-3 bg-blue-600 rounded mx-auto"></div>
            <div className="w-2 h-1 bg-orange-500 absolute top-1 left-1"></div>
          </div>
        )
      },
      { 
        name: 'Sécurité', 
        icon: (
          <div className="w-5 h-5 relative flex items-center justify-center">
            <div className="w-3 h-4 bg-blue-600 rounded-t-full"></div>
            <div className="w-1 h-2 bg-orange-500 absolute top-1.5"></div>
          </div>
        )
      },
      { 
        name: 'Consulting', 
        icon: (
          <div className="w-5 h-5 relative flex items-center justify-center">
            <div className="w-3 h-3 border-2 border-blue-600 rounded-full"></div>
            <div className="w-1 h-1 bg-orange-500 rounded-full absolute"></div>
          </div>
        )
      },
      { 
        name: 'Marketing', 
        icon: (
          <div className="w-5 h-5 relative">
            <div className="w-1 h-3 bg-blue-600 absolute bottom-0 left-0.5"></div>
            <div className="w-1 h-4 bg-blue-600 absolute bottom-0 left-2"></div>
            <div className="w-1 h-2 bg-orange-500 absolute bottom-0 right-1"></div>
          </div>
        )
      }
    ];

    const categories = productCondition === 'services' ? serviceCategories : productCategories;

    // Utiliser les vrais produits
    const products = realProducts;

    const filteredProducts = products
      .filter(p => selectedCategory === 'Tous' || p.category === selectedCategory);

    const openProductDetails = (product: any) => {
      setSelectedProduct(product);
      setCurrentImageIndex(0);
    };

    return (
      <div className="p-6 md:p-8 pb-24 md:pb-32">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Bienvenue sur</p>
              <h1 className="text-2xl font-black text-emerald-900">Banho-app</h1>
            </div>
            <div className="flex gap-2">
              {/* Bouton debug temporaire */}
              <button 
                onClick={() => {
                  console.log('État actuel:');
                  console.log('- isAuthenticated:', isAuthenticated);
                  console.log('- productCondition:', productCondition);
                  console.log('- realProducts:', realProducts);
                  console.log('- loadingProducts:', loadingProducts);
                  loadProducts();
                }}
                className="p-3 bg-blue-100 rounded-2xl text-xs font-bold"
              >
                🔄
              </button>
              <button 
                onClick={() => setActiveTab('orders')}
                className="p-3 bg-gray-100 rounded-2xl relative"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <input 
              type="text" 
              placeholder="Rechercher un produit..." 
              className="w-full bg-gray-100 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-emerald-900 transition-all text-sm font-medium"
            />
            <svg className="absolute left-4 top-4 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </div>
        </div>

      {/* Sections Neuve / Occasion / Services */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <button
          onClick={() => {
            setProductCondition('neuve');
            setSelectedCategory('Tous');
          }}
          className={`py-3 px-2 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex flex-col items-center gap-2 ${
            productCondition === 'neuve'
              ? 'bg-emerald-900 text-white shadow-lg'
              : 'bg-white border-2 border-gray-200 text-gray-600'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span>Neuve</span>
        </button>
        <button
          onClick={() => {
            setProductCondition('occasion');
            setSelectedCategory('Tous');
          }}
          className={`py-3 px-2 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex flex-col items-center gap-2 ${
            productCondition === 'occasion'
              ? 'bg-orange-500 text-white shadow-lg'
              : 'bg-white border-2 border-gray-200 text-gray-600'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Occasion</span>
        </button>
        <button
          onClick={() => {
            setProductCondition('services');
            setSelectedCategory('Tous');
          }}
          className={`py-3 px-2 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex flex-col items-center gap-2 ${
            productCondition === 'services'
              ? 'bg-blue-500 text-white shadow-lg'
              : 'bg-white border-2 border-gray-200 text-gray-600'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span>Services</span>
        </button>
      </div>

      {/* Categories avec icônes personnalisées */}
      <div className="flex gap-3 overflow-x-auto mb-8 no-scrollbar pb-2">
        {categories.map((cat, index) => (
          <button 
            key={cat.name} 
            onClick={() => setSelectedCategory(cat.name)}
            className={`px-4 py-3 rounded-2xl text-xs font-bold whitespace-nowrap shadow-sm active:scale-95 transition-all flex items-center gap-2 ${
              selectedCategory === cat.name ? 'bg-emerald-900 text-white' : 'bg-white border border-gray-200'
            }`}
          >
            {cat.icon}
            <span className={selectedCategory === cat.name ? 'text-white' : 'text-gray-700'}>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Products Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-black text-gray-900">
          {selectedCategory === 'Tous' ? 'Tous les produits' : selectedCategory}
        </h2>
        <button className="text-orange-500 text-xs font-black uppercase tracking-wider">
          {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''}
        </button>
      </div>

      {/* Loading */}
      {loadingProducts && (
        <div className="flex justify-center items-center py-12">
          <div className="w-12 h-12 border-4 border-emerald-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* No products */}
      {!loadingProducts && filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-600 font-bold mb-2">Aucun produit disponible</p>
          <p className="text-sm text-gray-400">Soyez le premier à publier dans cette catégorie !</p>
        </div>
      )}

      {/* Products Grid */}
      {!loadingProducts && filteredProducts.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 flex flex-col">
            <div className="relative aspect-[4/5]" onClick={() => openProductDetails(product)}>
              <img src={product.image} alt={product.name} className="w-full h-full object-cover cursor-pointer" />
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-full text-[10px] font-bold text-emerald-900">
                New
              </div>
              <button 
                onClick={(e) => {e.stopPropagation(); toggleFavorite(product.id || '');}}
                className="absolute top-3 left-3 p-2 bg-white/90 backdrop-blur rounded-full shadow-lg active:scale-90 transition-transform"
              >
                <Heart className={`w-5 h-5 ${favoriteProductIds.includes(product.id || '') ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
              </button>
              <button 
                onClick={(e) => {e.stopPropagation(); addToCart(product);}}
                className="absolute bottom-3 right-3 p-2.5 bg-emerald-900 text-white rounded-2xl shadow-lg active:scale-90 transition-transform"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <h3 className="text-sm font-bold text-gray-800 line-clamp-1 mb-2">{product.name}</h3>
              <div className="flex items-center justify-between">
                <p className="text-emerald-900 font-black text-lg">${product.price}</p>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-orange-400 fill-orange-400" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                  <span className="text-[10px] font-bold text-gray-600">{product.rating}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  );
  };

  const WalletView = () => {
    const [isCardFlipped, setIsCardFlipped] = useState(false);
    const [showBalance, setShowBalance] = useState(false);
    const [showPin, setShowPin] = useState(false);

    return (
      <div className="p-6 md:p-8 pb-24 md:pb-32">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-gray-900">BanhoPay</h1>
          <button className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="w-6 h-6 text-emerald-900 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          </button>
        </div>
        
        {/* Carte Banho Gold avec animation flip */}
        <div style={{perspective: '1000px'}} className="mb-10">
          <div 
            className={`relative w-full h-56 transition-all duration-700 cursor-pointer`}
            style={{
              transformStyle: 'preserve-3d',
              transform: isCardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
            }}
            onClick={() => setIsCardFlipped(!isCardFlipped)}
          >
            {/* Face avant de la carte - Design original */}
            <div 
              className="absolute inset-0 bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-900 p-6 rounded-[1.5rem] shadow-2xl relative overflow-hidden text-white"
              style={{backfaceVisibility: 'hidden'}}
            >
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px]" />
              
              <div className="flex justify-between items-start z-10 relative mb-6">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                  <img src="/logo-banho.png" alt="Banho" className="w-full h-full object-cover" />
                </div>
                <p className="text-[10px] font-black tracking-[0.3em] text-white/60 uppercase">BANHO GOLD CARD</p>
              </div>
              
              <div className="z-10 relative mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <p className="text-xs text-white/60 font-bold uppercase tracking-widest">SOLDE ACTUEL</p>
                  <button 
                    onClick={(e) => {e.stopPropagation(); setShowBalance(!showBalance);}}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors"
                  >
                    {showBalance ? <EyeOff className="w-4 h-4 text-white/60" /> : <Eye className="w-4 h-4 text-white/60" />}
                  </button>
                </div>
                <p className="text-4xl font-black tracking-tight">
                  {showBalance ? `$${userBalance.toFixed(2)}` : '••••••'}<span className="text-xl text-white/50"></span>
                </p>
              </div>
              
              <div className="flex justify-between items-end z-10 relative">
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-widest mb-1">Titulaire</p>
                  <p className="text-sm font-medium tracking-[0.15em] text-white/70">{currentUser?.displayName?.toUpperCase() || 'UTILISATEUR'}</p>
                </div>
                <div className="relative w-16 h-8 flex items-center justify-center">
                  <div className="absolute left-0 w-8 h-8 bg-orange-500 rounded-full border border-white/20 animate-slide-circles-1" />
                  <div className="absolute right-0 w-8 h-8 bg-emerald-500 rounded-full border border-white/20 animate-slide-circles-2" />
                </div>
              </div>
            </div>

            {/* Face arrière de la carte - Toutes les nouvelles informations */}
            <div 
              className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black p-6 rounded-[1.5rem] shadow-2xl text-white"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)'
              }}
            >
              <div className="h-full flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                      <img src="/logo-banho.png" alt="Banho" className="w-6 h-6 object-contain" />
                    </div>
                    <p className="text-[8px] font-black tracking-[0.2em] text-white/40 uppercase">BANHO FINANCIAL</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-[9px] text-white/50 uppercase tracking-widest mb-1">Numéro de carte</p>
                      <p className="text-base font-mono tracking-[0.2em]">4532 •••• •••• 8901</p>
                    </div>
                    
                    <div className="flex gap-6">
                      <div>
                        <p className="text-[9px] text-white/50 uppercase tracking-widest mb-1">Exp</p>
                        <p className="text-sm font-mono">12/28</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-white/50 uppercase tracking-widest mb-1">CVV</p>
                        <p className="text-sm font-mono">•••</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-[9px] text-white/50 uppercase tracking-widest mb-1">ID Firestore</p>
                      <p className="text-[10px] font-mono text-emerald-400">{currentUser?.uid?.substring(0, 24) || 'usr_ak_2024_001_banho'}</p>
                    </div>

                    <div className="flex gap-6">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-[9px] text-white/50 uppercase tracking-widest">PIN</p>
                          <button 
                            onClick={(e) => {e.stopPropagation(); setShowPin(!showPin);}}
                            className="p-0.5 hover:bg-white/10 rounded transition-colors"
                          >
                            {showPin ? <EyeOff className="w-3 h-3 text-white/60" /> : <Eye className="w-3 h-3 text-white/60" />}
                          </button>
                        </div>
                        <p className="text-sm font-mono tracking-[0.3em]">
                          {showPin ? '1234' : '••••'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] text-white/50 uppercase tracking-widest mb-1">Type</p>
                        <p className="text-xs text-orange-400 font-bold">Premium Gold</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-[9px] text-white/50 uppercase tracking-widest mb-1">Limite quotidienne</p>
                      <p className="text-sm font-bold">$5,000.00</p>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-[7px] text-white/30 uppercase tracking-widest">Banho Digital Wallet • Sécurisé</p>
                  <p className="text-[7px] text-white/20 mt-1">+243 900 000 000</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-4 gap-3 mb-10">
          {[
            { 
              label: 'DÉPÔT', 
              icon: (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 16V3m0 0l-4 4m4-4l4 4" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18v-6H3z" />
                </svg>
              ), 
              color: 'bg-green-50 text-green-600' 
            },
            { 
              label: 'RETRAIT', 
              icon: (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v13m0 0l-4-4m4 4l4-4" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h18v6H3z" />
                </svg>
              ), 
              color: 'bg-red-50 text-red-600' 
            },
            { 
              label: 'ENVOI', 
              icon: (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19V6m0 0l-4 4m4-4l4 4" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 21h14" />
                </svg>
              ), 
              color: 'bg-blue-50 text-blue-600' 
            },
            { 
              label: 'QR CODE', 
              icon: (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="3" width="7" height="7" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="14" y="3" width="7" height="7" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="3" y="14" width="7" height="7" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="5" y="5" width="3" height="3" fill="currentColor"/>
                  <rect x="16" y="5" width="3" height="3" fill="currentColor"/>
                  <rect x="5" y="16" width="3" height="3" fill="currentColor"/>
                  <path strokeWidth={2.5} strokeLinecap="round" d="M14 14h7M14 17h4M14 20h7M18 17v4"/>
                </svg>
              ), 
              color: 'bg-emerald-50 text-emerald-600' 
            }
          ].map((btn, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <button className={`${btn.color} w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm active:scale-90 transition-transform`}>
                {btn.icon}
              </button>
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{btn.label}</span>
            </div>
          ))}
        </div>

        {/* Historique Section */}
        <div className="mb-6">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <div className="w-1 h-5 bg-gray-900 rounded-full"></div>
            Historique
          </h2>
        </div>

        {/* Transaction List */}
        {loadingTransactions && (
          <div className="flex justify-center items-center py-12">
            <div className="w-12 h-12 border-4 border-emerald-900 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {!loadingTransactions && userTransactions.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-600 font-bold mb-2">Aucune transaction</p>
            <p className="text-sm text-gray-400">Vos transactions apparaîtront ici</p>
          </div>
        )}

        {!loadingTransactions && userTransactions.length > 0 && (
          <div className="space-y-4">
            {userTransactions.map((transaction) => {
              const isNegative = transaction.type === 'Retrait' || transaction.type === 'Achat' || transaction.type === 'Transfert';
              const icon = isNegative ? '↗' : '↙';
              const colorClass = isNegative ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600';
              const amountColor = isNegative ? 'text-gray-900' : 'text-green-600';
              
              return (
                <div key={transaction.id} className="bg-white p-5 rounded-2xl flex items-center justify-between border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl ${colorClass} flex items-center justify-center text-lg font-bold`}>
                      {icon}
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900">{transaction.description}</p>
                      <p className="text-xs text-gray-400 font-medium">
                        {transaction.createdAt?.toDate().toLocaleDateString('fr-FR')} • {transaction.location || 'WALLET'}
                      </p>
                    </div>
                  </div>
                  <p className={`text-sm font-black ${amountColor}`}>
                    {isNegative ? '-' : '+'}{transaction.amount}$
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const OrdersView = () => {
    const [filterStatus, setFilterStatus] = useState('Toutes');
    
    const filteredOrders = filterStatus === 'Toutes' 
      ? userOrders 
      : userOrders.filter(order => order.status === filterStatus);

    return (
      <div className="p-6 md:p-8 pb-24 md:pb-32">
      <h1 className="text-3xl font-black text-gray-900 mb-8">Mes Commandes</h1>
      
      {/* Filtres de commandes */}
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
        {['Toutes', 'En cours', 'Livrée', 'Annulée'].map((filter) => (
          <button 
            key={filter}
            onClick={() => setFilterStatus(filter)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterStatus === filter ? 'bg-emerald-900 text-white' : 'bg-white border border-gray-200 text-gray-600'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loadingOrders && (
        <div className="flex justify-center items-center py-12">
          <div className="w-12 h-12 border-4 border-emerald-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* No orders */}
      {!loadingOrders && filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-gray-600 font-bold mb-2">Aucune commande</p>
          <p className="text-sm text-gray-400">Vos commandes apparaîtront ici</p>
        </div>
      )}

      {/* Orders list */}
      {!loadingOrders && filteredOrders.length > 0 && (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const statusColors = {
              'En cours': 'bg-orange-100 text-orange-600',
              'Livrée': 'bg-emerald-100 text-emerald-600',
              'Annulée': 'bg-red-100 text-red-600'
            };

            return (
              <div key={order.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm font-black text-gray-900">#{order.id?.substring(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-gray-500">
                      {order.createdAt?.toDate().toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[order.status]}`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  {order.items.map((item: any) => item.productName).join(', ')}
                </p>
                <div className="flex justify-between items-center">
                  <p className="text-lg font-black text-emerald-900">${order.total}</p>
                  <button className="text-xs font-bold text-emerald-900 bg-emerald-50 px-3 py-1 rounded-lg">
                    Détails
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
  };

  // Fonction pour rendre les pages de profil
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

      case 'wallet':
        return (
          <div className="min-h-screen bg-gray-50 pb-24">
            <PageHeader title="BanhoPay & Paiements" />
            <div className="px-6">
              {/* Solde */}
              <div className="bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-900 p-6 rounded-3xl text-white mb-6 shadow-xl">
                <p className="text-sm font-bold opacity-70 mb-2">Solde disponible</p>
                <p className="text-4xl font-black mb-4">${userBalance.toFixed(2)}</p>
                <div className="flex gap-2">
                  <button className="flex-1 bg-white/20 backdrop-blur py-3 rounded-xl font-bold text-sm">
                    Déposer
                  </button>
                  <button className="flex-1 bg-white/20 backdrop-blur py-3 rounded-xl font-bold text-sm">
                    Retirer
                  </button>
                  <button className="flex-1 bg-orange-500 py-3 rounded-xl font-bold text-sm">
                    Envoyer
                  </button>
                </div>
              </div>

              {/* Historique des transactions */}
              <h3 className="text-lg font-black text-gray-900 mb-4">Historique</h3>
              {loadingTransactions ? (
                <div className="flex justify-center py-12">
                  <div className="w-12 h-12 border-4 border-emerald-900 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : userTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-bold">Aucune transaction</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userTransactions.map(transaction => (
                    <div key={transaction.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          transaction.type === 'Dépôt' || transaction.type === 'Vente' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          <ArrowUpRight className={`w-6 h-6 ${
                            transaction.type === 'Dépôt' || transaction.type === 'Vente' ? 'text-green-600 rotate-180' : 'text-red-600'
                          }`} />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{transaction.description}</p>
                          <p className="text-xs text-gray-500">
                            {transaction.createdAt?.toDate().toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <p className={`font-black ${
                        transaction.type === 'Dépôt' || transaction.type === 'Vente' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'Dépôt' || transaction.type === 'Vente' ? '+' : '-'}${transaction.amount}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'edit-profile':
        return (
          <div className="min-h-screen bg-gray-50 pb-24">
            <PageHeader title="Modifier le profil" />
            <div className="px-6">
              {/* Photo de profil */}
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <div className="w-32 h-32 bg-emerald-900 rounded-[2.5rem] flex items-center justify-center mb-4 shadow-xl overflow-hidden">
                    {currentUser?.photoURL ? (
                      <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-16 h-16 text-white" />
                    )}
                  </div>
                  <label className="absolute bottom-4 right-0 w-10 h-10 bg-orange-500 rounded-2xl border-4 border-white flex items-center justify-center shadow-lg cursor-pointer">
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
              </div>

              {/* Formulaire */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nom complet</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Votre nom"
                    className="w-full px-4 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:border-emerald-900 focus:outline-none text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={currentUser?.email || ''}
                    disabled
                    className="w-full px-4 py-4 bg-gray-100 border-2 border-gray-200 rounded-2xl text-sm font-medium text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Téléphone</label>
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="+243 900 000 000"
                    className="w-full px-4 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:border-emerald-900 focus:outline-none text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Localisation</label>
                  <input
                    type="text"
                    value={profileLocation}
                    onChange={(e) => setProfileLocation(e.target.value)}
                    placeholder="Kinshasa, Gombe"
                    className="w-full px-4 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:border-emerald-900 focus:outline-none text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Bio</label>
                  <textarea
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value)}
                    rows={4}
                    placeholder="Parlez-nous de vous..."
                    className="w-full px-4 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:border-emerald-900 focus:outline-none text-sm font-medium resize-none"
                  />
                </div>

                <button 
                  onClick={async () => {
                    if (!currentUser) return;
                    try {
                      await saveUserProfile(currentUser.uid, {
                        displayName: profileName,
                        phoneNumber: profilePhone,
                        location: profileLocation,
                        bio: profileBio,
                        email: currentUser.email || ''
                      });
                      showError('Profil mis à jour !', 'Vos informations ont été enregistrées avec succès.');
                    } catch (error) {
                      showError('Erreur', 'Une erreur est survenue lors de la mise à jour.');
                    }
                  }}
                  className="w-full bg-emerald-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-wider active:scale-95 transition-transform shadow-lg"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="min-h-screen bg-gray-50 pb-24">
            <PageHeader title="Notifications" />
            <div className="px-6">
              {/* Bouton marquer tout comme lu */}
              {unreadCount > 0 && (
                <button
                  onClick={async () => {
                    if (!currentUser) return;
                    try {
                      await markAllAsRead(currentUser.uid);
                      await loadUserNotifications(currentUser.uid);
                    } catch (error) {
                      console.error('Erreur:', error);
                    }
                  }}
                  className="w-full mb-4 py-3 bg-emerald-900 text-white rounded-xl font-bold text-sm"
                >
                  Marquer tout comme lu ({unreadCount})
                </button>
              )}

              {loadingNotifications ? (
                <div className="flex justify-center py-12">
                  <div className="w-12 h-12 border-4 border-emerald-900 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : userNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-bold">Aucune notification</p>
                  <p className="text-sm text-gray-400 mt-2">Vous serez notifié ici de vos commandes et paiements</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userNotifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      onClick={async () => {
                        if (!notif.read && notif.id) {
                          try {
                            await markAsRead(notif.id);
                            await loadUserNotifications(currentUser?.uid || '');
                          } catch (error) {
                            console.error('Erreur:', error);
                          }
                        }
                      }}
                      className={`bg-white p-4 rounded-2xl border cursor-pointer ${
                        !notif.read ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-100'
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="text-3xl">{notif.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-1">
                            <p className="font-black text-sm">{notif.title}</p>
                            {!notif.read && (
                              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{notif.message}</p>
                          <p className="text-xs text-gray-400">
                            {notif.createdAt?.toDate().toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="min-h-screen bg-gray-50 pb-24">
            <PageHeader title="Sécurité & Confidentialité" />
            <div className="px-6">
              <div className="space-y-4">
                {[
                  { icon: Shield, label: 'Changer le mot de passe', color: 'text-blue-500', bg: 'bg-blue-50' },
                  { icon: Bell, label: 'Authentification à deux facteurs', color: 'text-green-500', bg: 'bg-green-50', badge: 'Activé' },
                  { icon: Eye, label: 'Appareils connectés', color: 'text-purple-500', bg: 'bg-purple-50' },
                  { icon: Shield, label: 'Confidentialité du compte', color: 'text-orange-500', bg: 'bg-orange-50' },
                  { icon: Settings, label: 'Données personnelles', color: 'text-gray-600', bg: 'bg-gray-50' }
                ].map((item, i) => (
                  <div key={i} className="bg-white p-4 rounded-2xl flex items-center justify-between border border-gray-100 shadow-sm active:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.bg} ${item.color}`}>
                        <item.icon className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-bold text-gray-800">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.badge && (
                        <span className="bg-green-100 text-green-600 text-xs font-bold px-2 py-1 rounded-full">
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
            </div>
          </div>
        );

      case 'support':
        return (
          <div className="min-h-screen bg-gray-50 pb-24">
            <PageHeader title="Aide & Support" />
            <div className="px-6">
              {/* Contact rapide */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button className="bg-emerald-900 text-white p-4 rounded-2xl flex flex-col items-center gap-2">
                  <MessageSquare className="w-8 h-8" />
                  <span className="text-xs font-bold">Chat en direct</span>
                </button>
                <button className="bg-orange-500 text-white p-4 rounded-2xl flex flex-col items-center gap-2">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs font-bold">Email</span>
                </button>
              </div>

              {/* FAQ */}
              <h3 className="text-lg font-black text-gray-900 mb-4">Questions fréquentes</h3>
              <div className="space-y-3">
                {[
                  { q: 'Comment passer une commande ?', a: 'Parcourez les produits, ajoutez au panier et validez votre commande.' },
                  { q: 'Comment utiliser BanhoPay ?', a: 'BanhoPay est votre portefeuille intégré pour payer en toute sécurité.' },
                  { q: 'Délai de livraison ?', a: 'Les livraisons prennent généralement 2-5 jours ouvrables.' },
                  { q: 'Comment vendre sur Banho ?', a: 'Cliquez sur + dans la barre de navigation et ajoutez votre produit.' }
                ].map((faq, i) => (
                  <details key={i} className="bg-white p-4 rounded-2xl border border-gray-100">
                    <summary className="font-bold text-sm cursor-pointer">{faq.q}</summary>
                    <p className="text-sm text-gray-600 mt-2">{faq.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="min-h-screen bg-gray-50 pb-24">
            <PageHeader title="Paramètres généraux" />
            <div className="px-6">
              <div className="space-y-6">
                {/* Langue */}
                <div>
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Langue</h3>
                  <select className="w-full px-4 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:border-emerald-900 focus:outline-none text-sm font-medium">
                    <option>Français</option>
                    <option>English</option>
                    <option>Lingala</option>
                  </select>
                </div>

                {/* Devise */}
                <div>
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Devise</h3>
                  <select className="w-full px-4 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:border-emerald-900 focus:outline-none text-sm font-medium">
                    <option>USD ($)</option>
                    <option>CDF (FC)</option>
                    <option>EUR (€)</option>
                  </select>
                </div>

                {/* Notifications */}
                <div>
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Notifications</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Notifications push', checked: true },
                      { label: 'Notifications email', checked: true },
                      { label: 'Promotions et offres', checked: false }
                    ].map((item, i) => (
                      <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                        <span className="text-sm font-bold">{item.label}</span>
                        <div className={`w-12 h-6 rounded-full transition-colors ${item.checked ? 'bg-emerald-900' : 'bg-gray-300'} relative cursor-pointer`}>
                          <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${item.checked ? 'right-0.5' : 'left-0.5'}`}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* À propos */}
                <div>
                  <h3 className="text-sm font-bold text-gray-700 mb-3">À propos</h3>
                  <div className="bg-white p-4 rounded-2xl border border-gray-100">
                    <p className="text-sm text-gray-600 mb-2">Version de l'application</p>
                    <p className="text-sm font-bold">Banho v1.0.0</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      // Pages en développement
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
            <div className="w-32 h-32 bg-emerald-900 rounded-[2.5rem] flex items-center justify-center mb-4 shadow-2xl shadow-emerald-900/20">
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="Profile" className="w-full h-full rounded-[2.5rem] object-cover" />
              ) : (
                <UserIcon className="w-16 h-16 text-white" />
              )}
            </div>
            <div className="absolute bottom-4 right-0 w-10 h-10 bg-orange-500 rounded-2xl border-4 border-white flex items-center justify-center shadow-lg cursor-pointer">
              <label className="w-full h-full flex items-center justify-center cursor-pointer">
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
            <p className="text-2xl font-black">${Math.abs(userBalance).toFixed(0)}</p>
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

  const renderContent = () => {
    // Si la page de caisse est ouverte
    if (showCheckout && checkoutProduct) {
      const canUseBanhoPay = userBalance >= checkoutProduct.price;
      
      const handlePayment = async () => {
        if (!selectedPaymentMethod) {
          showError('Méthode de paiement', 'Veuillez sélectionner un moyen de paiement.');
          return;
        }
        if (!deliveryAddress.trim()) {
          showError('Adresse manquante', 'Veuillez entrer votre adresse de livraison.');
          return;
        }
        if (!deliveryCity.trim()) {
          showError('Ville manquante', 'Veuillez entrer votre ville.');
          return;
        }
        if (!deliveryPhone.trim()) {
          showError('Téléphone manquant', 'Veuillez entrer votre numéro de téléphone.');
          return;
        }
        
        // Vérifier le solde BanhoPay
        if (selectedPaymentMethod === 'banhopay' && !canUseBanhoPay) {
          showError('Solde insuffisant', `Votre solde BanhoPay ($${userBalance.toFixed(2)}) est insuffisant pour cet achat ($${checkoutProduct.price}).`);
          return;
        }

        setProcessingPayment(true);

        try {
          // Créer la commande
          const order = {
            userId: currentUser.uid,
            items: [
              {
                productId: checkoutProduct.id,
                productName: checkoutProduct.name,
                productImage: checkoutProduct.image,
                price: checkoutProduct.price,
                quantity: 1,
                sellerId: checkoutProduct.userId,
                sellerName: checkoutProduct.seller
              }
            ],
            total: checkoutProduct.price,
            status: 'En cours' as const,
            deliveryAddress: `${deliveryAddress}, ${deliveryCity}`,
            deliveryPhone: deliveryPhone,
            deliveryNotes: deliveryNotes,
            paymentMethod: selectedPaymentMethod
          };

          await createOrder(order);

          // Créer une transaction
          await createTransaction({
            userId: currentUser.uid,
            type: 'Achat',
            amount: checkoutProduct.price,
            description: `Achat: ${checkoutProduct.name}`,
            location: deliveryCity
          });

          // Recharger les données
          await loadUserOrders(currentUser.uid);
          await loadUserTransactions(currentUser.uid);

          // Réinitialiser et fermer
          setShowCheckout(false);
          setCheckoutProduct(null);
          setSelectedPaymentMethod('');
          setDeliveryAddress('');
          setDeliveryCity('');
          setDeliveryPhone('');
          setDeliveryNotes('');
          setSelectedProduct(null);

          showError('Commande confirmée ! 🎉', `Votre commande a été passée avec succès. Vous pouvez suivre son statut dans "Mes commandes".`);
          setActiveTab('orders');

        } catch (error: any) {
          console.error('Erreur lors du paiement:', error);
          showError('Erreur de paiement', error.message || 'Une erreur est survenue lors du paiement. Veuillez réessayer.');
        } finally {
          setProcessingPayment(false);
        }
      };

      return (
        <div className="min-h-screen bg-gray-50 pb-32">
          {/* Header */}
          <div className="sticky top-0 bg-white/90 backdrop-blur-xl z-50 px-6 py-4 flex items-center gap-4 border-b border-gray-100">
            <button 
              onClick={() => {
                setShowCheckout(false);
                setCheckoutProduct(null);
              }}
              className="p-2 bg-gray-100 rounded-xl active:scale-90 transition-transform"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-black text-gray-900">Passer à la caisse</h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Résumé du produit */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 flex gap-4">
              <img 
                src={checkoutProduct.image} 
                alt={checkoutProduct.name} 
                className="w-24 h-24 rounded-xl object-cover"
              />
              <div className="flex-1">
                <h3 className="font-black text-gray-900 mb-1">{checkoutProduct.name}</h3>
                <p className="text-sm text-gray-500 mb-2">Vendu par {checkoutProduct.seller}</p>
                <p className="text-xl font-black text-emerald-900">${checkoutProduct.price}</p>
              </div>
            </div>

            {/* Moyens de paiement */}
            <div>
              <h3 className="text-lg font-black text-gray-900 mb-4">Moyen de paiement</h3>
              <div className="space-y-3">
                {/* BanhoPay */}
                <button
                  onClick={() => setSelectedPaymentMethod('banhopay')}
                  disabled={!canUseBanhoPay}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${
                    selectedPaymentMethod === 'banhopay' 
                      ? 'border-emerald-900 bg-emerald-50' 
                      : !canUseBanhoPay 
                        ? 'border-gray-200 bg-gray-100 opacity-60' 
                        : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="w-12 h-12 bg-emerald-900 rounded-xl flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-black text-gray-900">BanhoPay</p>
                    <p className="text-sm text-gray-500">
                      Solde: ${userBalance.toFixed(2)}
                      {!canUseBanhoPay && <span className="text-red-500 ml-2">(Insuffisant)</span>}
                    </p>
                  </div>
                  {selectedPaymentMethod === 'banhopay' && (
                    <div className="w-6 h-6 bg-emerald-900 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>

                {/* Mobile Money */}
                <button
                  onClick={() => setSelectedPaymentMethod('mobile_money')}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${
                    selectedPaymentMethod === 'mobile_money' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-black text-gray-900">Mobile Money</p>
                    <p className="text-sm text-gray-500">M-Pesa, Orange Money, Airtel Money</p>
                  </div>
                  {selectedPaymentMethod === 'mobile_money' && (
                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>

                {/* Carte de crédit */}
                <button
                  onClick={() => setSelectedPaymentMethod('card')}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${
                    selectedPaymentMethod === 'card' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-black text-gray-900">Carte de crédit</p>
                    <p className="text-sm text-gray-500">Visa, Mastercard, Amex</p>
                  </div>
                  {selectedPaymentMethod === 'card' && (
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>

                {/* PayPal */}
                <button
                  onClick={() => setSelectedPaymentMethod('paypal')}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${
                    selectedPaymentMethod === 'paypal' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center">
                    <span className="text-white font-black text-lg">P</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-black text-gray-900">PayPal</p>
                    <p className="text-sm text-gray-500">Paiement sécurisé PayPal</p>
                  </div>
                  {selectedPaymentMethod === 'paypal' && (
                    <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>

                {/* Espèces */}
                <button
                  onClick={() => setSelectedPaymentMethod('cash')}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${
                    selectedPaymentMethod === 'cash' ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-black text-gray-900">Espèces</p>
                    <p className="text-sm text-gray-500">Paiement à la livraison</p>
                  </div>
                  {selectedPaymentMethod === 'cash' && (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Adresse de livraison */}
            <div>
              <h3 className="text-lg font-black text-gray-900 mb-4">Adresse de livraison</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Adresse *</label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="123 Avenue de la Paix"
                    className="w-full px-4 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:border-emerald-900 focus:outline-none text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Ville *</label>
                  <input
                    type="text"
                    value={deliveryCity}
                    onChange={(e) => setDeliveryCity(e.target.value)}
                    placeholder="Kinshasa, Gombe"
                    className="w-full px-4 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:border-emerald-900 focus:outline-none text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Téléphone *</label>
                  <input
                    type="tel"
                    value={deliveryPhone}
                    onChange={(e) => setDeliveryPhone(e.target.value)}
                    placeholder="+243 900 000 000"
                    className="w-full px-4 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:border-emerald-900 focus:outline-none text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Instructions de livraison (optionnel)</label>
                  <textarea
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    rows={3}
                    placeholder="Ex: Appeler avant de livrer, code portail: 1234..."
                    className="w-full px-4 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:border-emerald-900 focus:outline-none text-sm font-medium resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Récapitulatif */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100">
              <h3 className="font-black text-gray-900 mb-4">Récapitulatif</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Sous-total</span>
                  <span className="font-bold">${checkoutProduct.price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Livraison</span>
                  <span className="font-bold text-green-600">Gratuite</span>
                </div>
                <div className="border-t border-gray-100 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-black text-gray-900">Total</span>
                    <span className="font-black text-emerald-900 text-xl">${checkoutProduct.price}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bouton de paiement */}
            <button
              onClick={handlePayment}
              disabled={processingPayment}
              className="w-full bg-emerald-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-wider active:scale-95 transition-transform shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processingPayment ? 'Traitement en cours...' : `Payer $${checkoutProduct.price}`}
            </button>
          </div>
        </div>
      );
    }

    // Si la page d'ajout est ouverte
    if (showAddProduct) {
      // Catégories de produits
      const productCategories = [
        'Électronique', 
        'Mode', 
        'Automobile', 
        'Immobilier', 
        'Mobilier',
        'Alimentation',
        'Sport',
        'Livres',
        'Jouets',
        'Animaux',
        'Jardin',
        'Bricolage',
        'Bijoux',
        'Art',
        'Musique'
      ];
      
      // Catégories de services
      const serviceCategories = [
        'Réparation', 
        'Beauté', 
        'Santé', 
        'Éducation', 
        'Digital', 
        'Transport',
        'Nettoyage',
        'Événementiel',
        'Juridique',
        'Finance',
        'Immobilier',
        'Photographie',
        'Traduction',
        'Livraison',
        'Sécurité',
        'Consulting',
        'Marketing'
      ];
      
      // Sélectionner les catégories appropriées selon le type
      const availableCategories = addProductType === 'services' ? serviceCategories : productCategories;

      return (
        <div className="min-h-screen bg-gray-50 pb-32">
          {/* Header */}
          <div className="sticky top-0 bg-white/90 backdrop-blur-xl z-50 px-6 py-4 flex items-center justify-between border-b border-gray-100">
            <button 
              onClick={() => {
                setShowAddProduct(false);
                resetProductForm();
              }}
              className="p-2 bg-gray-100 rounded-xl active:scale-90 transition-transform"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-lg font-black text-gray-900">Ajouter</h2>
            <div className="w-10"></div>
          </div>

          {/* Formulaire */}
          <div className="p-6 space-y-6">
            {/* Type */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">Type</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    setAddProductType('neuve');
                    setProductCategory('');
                  }}
                  type="button"
                  className={`py-3 px-2 rounded-2xl font-bold text-xs uppercase transition-all flex flex-col items-center gap-2 ${
                    addProductType === 'neuve'
                      ? 'bg-emerald-900 text-white shadow-lg'
                      : 'bg-white border-2 border-gray-200 text-gray-600'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span>Neuve</span>
                </button>
                <button
                  onClick={() => {
                    setAddProductType('occasion');
                    setProductCategory('');
                  }}
                  type="button"
                  className={`py-3 px-2 rounded-2xl font-bold text-xs uppercase transition-all flex flex-col items-center gap-2 ${
                    addProductType === 'occasion'
                      ? 'bg-orange-500 text-white shadow-lg'
                      : 'bg-white border-2 border-gray-200 text-gray-600'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Occasion</span>
                </button>
                <button
                  onClick={() => {
                    setAddProductType('services');
                    setProductCategory('');
                  }}
                  type="button"
                  className={`py-3 px-2 rounded-2xl font-bold text-xs uppercase transition-all flex flex-col items-center gap-2 ${
                    addProductType === 'services'
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-white border-2 border-gray-200 text-gray-600'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Services</span>
                </button>
              </div>
            </div>

            {/* Photos */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Photos ({productImages.length}/3)
              </label>
              <div className="grid grid-cols-3 gap-3">
                {productImagePreviews.map((preview, index) => (
                  <div key={index} className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden">
                    <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(index)}
                      type="button"
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                {productImages.length < 3 && (
                  <label className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-300 cursor-pointer hover:border-emerald-900 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </label>
                )}
              </div>
            </div>

            {/* Titre */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Titre</label>
              <input
                type="text"
                value={productTitle}
                onChange={(e) => setProductTitle(e.target.value)}
                placeholder={addProductType === 'services' ? 'Ex: Réparation iPhone' : 'Ex: iPhone 15 Pro Max'}
                className="w-full px-4 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:border-emerald-900 focus:outline-none text-sm font-medium"
              />
            </div>

            {/* Catégorie */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Catégorie</label>
              <select 
                value={productCategory}
                onChange={(e) => setProductCategory(e.target.value)}
                className="w-full px-4 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:border-emerald-900 focus:outline-none text-sm font-medium"
              >
                <option value="">Sélectionner une catégorie</option>
                {availableCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Prix */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Prix ($)</label>
              <input
                type="number"
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full px-4 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:border-emerald-900 focus:outline-none text-sm font-medium"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
              <textarea
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                rows={4}
                placeholder={addProductType === 'services' ? 'Décrivez votre service...' : 'Décrivez votre produit...'}
                className="w-full px-4 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:border-emerald-900 focus:outline-none text-sm font-medium resize-none"
              />
            </div>

            {/* Localisation */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Localisation</label>
              <input
                type="text"
                value={productLocation}
                onChange={(e) => setProductLocation(e.target.value)}
                placeholder="Ex: Kinshasa, Gombe"
                className="w-full px-4 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:border-emerald-900 focus:outline-none text-sm font-medium"
              />
            </div>

            {/* Bouton Publier */}
            <button 
              onClick={handlePublishProduct}
              disabled={uploadingProduct}
              className="w-full bg-emerald-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-wider active:scale-95 transition-transform shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadingProduct ? 'Publication en cours...' : 'Publier'}
            </button>
          </div>
        </div>
      );
    }

    // Si un produit est sélectionné, afficher la page de détails
    if (selectedProduct) {
      return (
        <div className="min-h-screen bg-gray-50">
          {/* Header avec bouton retour */}
          <div className="sticky top-0 bg-white/90 backdrop-blur-xl z-50 px-6 py-4 flex items-center justify-between border-b border-gray-100">
            <button 
              onClick={() => setSelectedProduct(null)}
              className="p-2 bg-gray-100 rounded-xl active:scale-90 transition-transform"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-black text-gray-900">Détails</h2>
            <button 
              onClick={() => toggleFavorite(selectedProduct.id)}
              className="p-2 bg-gray-100 rounded-xl active:scale-90 transition-transform"
            >
              <svg className={`w-6 h-6 ${favorites.includes(selectedProduct.id.toString()) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>

          {/* Carrousel d'images */}
          <div className="relative">
            <div className="overflow-x-auto no-scrollbar snap-x snap-mandatory flex">
              {selectedProduct.images.map((img: string, index: number) => (
                <div 
                  key={index} 
                  className="w-full flex-shrink-0 snap-center"
                  onClick={() => setCurrentImageIndex(index)}
                >
                  <img 
                    src={img} 
                    alt={`${selectedProduct.name} ${index + 1}`} 
                    className="w-full h-96 object-cover"
                  />
                </div>
              ))}
            </div>
            
            {/* Indicateurs de pagination */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              {selectedProduct.images.map((_: any, index: number) => (
                <div 
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === currentImageIndex 
                      ? 'w-8 bg-white' 
                      : 'w-2 bg-white/50'
                  }`}
                />
              ))}
            </div>

            {/* Boutons de navigation */}
            {currentImageIndex > 0 && (
              <button 
                onClick={() => setCurrentImageIndex(prev => Math.max(0, prev - 1))}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur rounded-full shadow-lg active:scale-90 transition-transform"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {currentImageIndex < selectedProduct.images.length - 1 && (
              <button 
                onClick={() => setCurrentImageIndex(prev => Math.min(selectedProduct.images.length - 1, prev + 1))}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur rounded-full shadow-lg active:scale-90 transition-transform"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>

          {/* Contenu des détails */}
          <div className="p-6 pb-32 md:pb-40">
            {/* Prix et nom */}
            <div className="mb-6">
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-2xl font-black text-gray-900 flex-1">{selectedProduct.name}</h1>
                <div className="flex items-center gap-1 bg-orange-50 px-3 py-1 rounded-full">
                  <svg className="w-4 h-4 text-orange-400 fill-orange-400" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                  <span className="text-sm font-bold text-orange-600">{selectedProduct.rating}</span>
                  <span className="text-xs text-gray-500">({selectedProduct.reviews})</span>
                </div>
              </div>
              <p className="text-3xl font-black text-emerald-900">${selectedProduct.price}</p>
            </div>

            {/* Vendeur et stock */}
            <div className="flex items-center justify-between mb-6 p-4 bg-white rounded-2xl border border-gray-100">
              <div>
                <p className="text-xs text-gray-500 mb-1">Vendu par</p>
                <p className="text-sm font-bold text-gray-900">{selectedProduct.seller}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">Stock</p>
                <p className={`text-sm font-bold ${selectedProduct.stock > 10 ? 'text-green-600' : 'text-orange-600'}`}>
                  {selectedProduct.stock} disponible{selectedProduct.stock > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-black text-gray-900 mb-3">Description</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{selectedProduct.description}</p>
            </div>

            {/* Catégorie */}
            <div className="mb-8">
              <h3 className="text-lg font-black text-gray-900 mb-3">Catégorie</h3>
              <span className="inline-block px-4 py-2 bg-emerald-50 text-emerald-900 rounded-xl text-sm font-bold">
                {selectedProduct.category}
              </span>
            </div>

            {/* Boutons d'action - Juste après la catégorie pour être plus visibles */}
            <div className="flex gap-3 mb-6">
              <button 
                onClick={() => {
                  addToCart(selectedProduct);
                }}
                className="flex-1 bg-white border-2 border-emerald-900 text-emerald-900 py-4 rounded-2xl font-black text-sm uppercase tracking-wider active:scale-95 transition-transform shadow-md"
              >
                + Panier
              </button>
              <button 
                onClick={() => {
                  setCheckoutProduct(selectedProduct);
                  setShowCheckout(true);
                }}
                className="flex-1 bg-emerald-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-wider active:scale-95 transition-transform shadow-lg"
              >
                Acheter
              </button>
              <button 
                onClick={() => {
                  alert('Partager ce produit');
                }}
                className="w-14 h-14 bg-orange-500 text-white rounded-2xl font-black active:scale-95 transition-transform shadow-lg flex items-center justify-center"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'home': return <HomeView />;
      case 'wallet': return <WalletView />;
      case 'orders': return <OrdersView />;
      case 'profile': return <ProfileView />;
      default: return <HomeView />;
    }
  };

  if (showSplash) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-0 md:p-4">
        {/* iPhone Frame Container - Only on desktop */}
        <div className="w-full h-full md:w-[430px] md:h-[900px] bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 md:rounded-[4rem] md:border-[8px] md:border-black relative overflow-hidden md:shadow-[0_50px_100px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center">
          
          {/* iPhone Notch - Only on desktop */}
          <div className="hidden md:flex absolute top-0 inset-x-0 h-12 bg-black/20 backdrop-blur-sm justify-center items-center z-[110] pointer-events-none">
            <div className="w-32 h-6 bg-black rounded-full mb-1"></div>
          </div>

          {/* Splash Content */}
          <div className="relative mb-8">
            {/* Logo Banho */}
            <div className="w-32 h-32 bg-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-900/50 animate-pulse">
              <img src="/logo-banho.png" alt="Banho" className="w-20 h-20 object-contain" />
            </div>
            
            {/* Cercles de chargement animés */}
            <div className="absolute -inset-4 flex items-center justify-center">
              <div className="w-40 h-40 border-4 border-orange-500/30 rounded-full animate-spin border-t-orange-500"></div>
            </div>
            <div className="absolute -inset-2 flex items-center justify-center">
              <div className="w-36 h-36 border-2 border-white/20 rounded-full animate-spin animate-reverse border-t-white/60" style={{animationDuration: '2s'}}></div>
            </div>
          </div>

          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Banho</h1>
          <p className="text-orange-400 font-semibold text-sm uppercase tracking-[0.3em] mb-8">Zando na tshombo</p>
          
          {/* Barre de progression */}
          <div className="w-64 h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-orange-500 to-white rounded-full animate-pulse" style={{width: '100%', animation: 'loading 3s ease-in-out'}}></div>
          </div>
          <p className="text-white/60 text-xs mt-4 animate-pulse">Chargement en cours...</p>

          {/* iPhone Home Indicator - Only on desktop */}
          <div className="hidden md:block absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-white/10 rounded-full z-[120] pointer-events-none"></div>
        </div>
      </div>
    );
  }

  // Si onboarding non terminé, afficher l'onboarding
  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-0 md:p-4">
        {/* iPhone Frame Container - Only on desktop */}
        <div className="w-full h-full md:w-[430px] md:h-[900px] bg-gradient-to-br from-gray-50 to-gray-100 md:rounded-[4rem] md:border-[8px] md:border-black relative overflow-hidden md:shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
          
          {/* iPhone Notch/Status Bar - Only on desktop */}
          <div className="hidden md:flex absolute top-0 inset-x-0 h-12 bg-white/10 backdrop-blur-sm justify-between items-center px-10 z-[110] pointer-events-none">
            <span className="text-[11px] font-black text-black/40">9:41</span>
            <div className="w-32 h-6 bg-black rounded-full mb-1"></div>
            <div className="flex gap-1.5 items-center">
              <div className="w-3.5 h-3.5 bg-black/40 rounded-sm"></div>
              <div className="w-4 h-2.5 bg-black/40 rounded-full"></div>
            </div>
          </div>

          {/* Content Area */}
          <div className="h-full w-full overflow-y-auto overflow-x-hidden no-scrollbar bg-gradient-to-br from-gray-50 to-gray-100 md:pt-12">
            <OnboardingView />
          </div>

          {/* iPhone Home Indicator - Only on desktop */}
          <div className="hidden md:block absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-black/10 rounded-full z-[120] pointer-events-none"></div>
        </div>
      </div>
    );
  }

  // Si non authentifié, afficher les pages d'authentification
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-0 md:p-4">
        {/* iPhone Frame Container - Only on desktop */}
        <div className="w-full h-full md:w-[430px] md:h-[900px] bg-gray-50 md:rounded-[4rem] md:border-[8px] md:border-black relative overflow-hidden md:shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
          
          {/* iPhone Notch/Status Bar - Only on desktop */}
          <div className="hidden md:flex absolute top-0 inset-x-0 h-12 bg-white/10 backdrop-blur-sm justify-between items-center px-10 z-[110] pointer-events-none">
            <span className="text-[11px] font-black text-black/40">9:41</span>
            <div className="w-32 h-6 bg-black rounded-full mb-1"></div>
            <div className="flex gap-1.5 items-center">
              <div className="w-3.5 h-3.5 bg-black/40 rounded-sm"></div>
              <div className="w-4 h-2.5 bg-black/40 rounded-full"></div>
            </div>
          </div>

          {/* Content Area */}
          <div className="h-full w-full overflow-y-auto overflow-x-hidden no-scrollbar bg-gray-50 md:pt-12">
            {authView === 'login' && <LoginView />}
            {authView === 'signup' && <SignupView />}
            {authView === 'forgot' && <ForgotPasswordView />}
          </div>

          {/* iPhone Home Indicator - Only on desktop */}
          <div className="hidden md:block absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-black/10 rounded-full z-[120] pointer-events-none"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-0 md:p-4">
      {/* Dialogue d'erreur */}
      <ErrorDialog />
      
      {/* iPhone Frame Container - Only on desktop */}
      <div className="w-full h-full md:w-[430px] md:h-[900px] bg-gray-50 md:rounded-[4rem] md:border-[8px] md:border-black relative overflow-hidden md:shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
        
        {/* iPhone Notch/Status Bar - Only on desktop */}
        <div className="hidden md:flex absolute top-0 inset-x-0 h-12 bg-white/10 backdrop-blur-sm justify-between items-center px-10 z-[110] pointer-events-none">
          <span className="text-[11px] font-black text-black/40">9:41</span>
          <div className="w-32 h-6 bg-black rounded-full mb-1"></div>
          <div className="flex gap-1.5 items-center">
            <div className="w-3.5 h-3.5 bg-black/40 rounded-sm"></div>
            <div className="w-4 h-2.5 bg-black/40 rounded-full"></div>
          </div>
        </div>

        {/* Mobile Status Bar - Only on mobile */}
        <div className="md:hidden h-12 bg-white flex justify-between items-center px-6 text-sm font-bold text-gray-400 border-b border-gray-100">
          <span>9:41</span>
          <span className="text-emerald-900 font-black">Banho</span>
          <div className="flex items-center gap-1">
            <span className="text-xs">100%</span>
            <div className="w-6 h-3 border border-gray-400 rounded-sm">
              <div className="w-full h-full bg-green-500 rounded-sm"></div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="h-full w-full overflow-y-auto overflow-x-hidden no-scrollbar bg-gray-50 md:pt-12">
          {renderContent()}
          
          {/* Bottom Navigation */}
          <nav className="fixed md:absolute bottom-0 left-0 right-0 md:inset-x-0 bg-white/90 backdrop-blur-2xl border-t border-gray-100 px-4 md:px-6 py-4 md:py-6 md:pb-10 z-[80]">
            <div className="flex justify-around items-center max-w-md mx-auto md:max-w-none relative">
              {/* Store */}
              <button
                onClick={() => {
                  setActiveTab('home');
                  setSelectedProduct(null);
                  setActiveProfilePage(null);
                  setShowAddProduct(false);
                  setShowCheckout(false);
                }}
                className={`flex flex-col items-center gap-1 p-2 transition-all ${
                  activeTab === 'home' ? 'text-emerald-900 scale-110' : 'text-gray-400'
                }`}
              >
                <ShoppingBag className="w-6 h-6" />
                <span className="text-xs font-bold">Store</span>
              </button>

              {/* BanhoPay */}
              <button
                onClick={() => {
                  setActiveTab('wallet');
                  setSelectedProduct(null);
                  setActiveProfilePage(null);
                  setShowAddProduct(false);
                  setShowCheckout(false);
                }}
                className={`flex flex-col items-center gap-1 p-2 transition-all ${
                  activeTab === 'wallet' ? 'text-emerald-900 scale-110' : 'text-gray-400'
                }`}
              >
                <Wallet className="w-6 h-6" />
                <span className="text-xs font-bold">BanhoPay</span>
              </button>

              {/* Bouton Ajouter au centre */}
              <button
                onClick={() => setShowAddProduct(true)}
                className="relative -top-8 w-16 h-16 bg-gradient-to-br from-emerald-900 to-emerald-700 rounded-2xl shadow-2xl flex items-center justify-center active:scale-95 transition-transform"
              >
                {/* Symbole Plus */}
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                
                {/* Petit panier accroché en haut à droite */}
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-lg shadow-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
              </button>

              {/* Commandes */}
              <button
                onClick={() => {
                  setActiveTab('orders');
                  setSelectedProduct(null);
                  setActiveProfilePage(null);
                  setShowAddProduct(false);
                  setShowCheckout(false);
                }}
                className={`flex flex-col items-center gap-1 p-2 transition-all ${
                  activeTab === 'orders' ? 'text-emerald-900 scale-110' : 'text-gray-400'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6" />
                </svg>
                <span className="text-xs font-bold">Commandes</span>
              </button>

              {/* Profile */}
              <button
                onClick={() => {
                  setActiveTab('profile');
                  setSelectedProduct(null);
                  setActiveProfilePage(null);
                  setShowAddProduct(false);
                  setShowCheckout(false);
                }}
                className={`flex flex-col items-center gap-1 p-2 transition-all relative ${
                  activeTab === 'profile' ? 'text-emerald-900 scale-110' : 'text-gray-400'
                }`}
              >
                <UserIcon className="w-6 h-6" />
                <span className="text-xs font-bold">Profile</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </div>
          </nav>
        </div>

        {/* iPhone Home Indicator - Only on desktop */}
        <div className="hidden md:block absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-black/10 rounded-full z-[120] pointer-events-none"></div>
      </div>
    </div>
  );
}
