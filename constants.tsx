
import { Product, Transaction, ChatSession } from './types';

export const COLORS = {
  primary: '#064e3b', // Deep Emerald
  accent: '#f97316',  // Vibrant Orange
  background: '#ffffff',
  text: '#111827'
};

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'MacBook Air M2',
    price: 1200,
    currency: '$',
    category: 'Électronique',
    image: 'https://picsum.photos/seed/macbook/600/600',
    description: 'Le tout nouveau MacBook Air M2 avec une autonomie exceptionnelle.',
    seller: { name: 'Kenza Tech', verified: true, rating: 4.8 }
  },
  {
    id: '2',
    name: 'iPhone 15 Pro',
    price: 999,
    currency: '$',
    category: 'Électronique',
    image: 'https://picsum.photos/seed/iphone/600/600',
    description: 'Le dernier né de chez Apple avec un cadre en titane.',
    seller: { name: 'Mobile Hub', verified: true, rating: 4.9 }
  },
  {
    id: '3',
    name: 'Chaussures Jordan Retro',
    price: 250,
    currency: '$',
    category: 'Mode',
    image: 'https://picsum.photos/seed/shoes/600/600',
    description: 'Style iconique pour les amateurs de sneakers.',
    seller: { name: 'Sneaker City', verified: false, rating: 4.2 }
  },
  {
    id: '4',
    name: 'Cafetière Espresso',
    price: 180,
    currency: '$',
    category: 'Maison',
    image: 'https://picsum.photos/seed/coffee/600/600',
    description: 'Préparez votre café comme un pro chaque matin.',
    seller: { name: 'Home Goods', verified: true, rating: 4.5 }
  }
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', type: 'recharge', amount: 500, currency: '$', date: '2023-10-25', method: 'M-Pesa', status: 'completed' },
  { id: 't2', type: 'payment', amount: -250, currency: '$', date: '2023-10-24', method: 'Wallet', status: 'completed' },
  { id: 't3', type: 'transfer', amount: 100, currency: '$', date: '2023-10-22', method: 'Orange Money', status: 'completed' }
];

export const MOCK_CHATS: ChatSession[] = [
  { id: 'c1', participantName: 'Kenza Tech', lastMessage: 'Votre colis est en route.', unreadCount: 1, avatar: 'https://picsum.photos/seed/user1/100/100' },
  { id: 'c2', participantName: 'Jean Dupont', lastMessage: 'Est-ce que le prix est négociable ?', unreadCount: 0, avatar: 'https://picsum.photos/seed/user2/100/100' }
];
