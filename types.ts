
export interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  category: string;
  image: string;
  description: string;
  seller: {
    name: string;
    verified: boolean;
    rating: number;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  balance: number;
}

export interface Transaction {
  id: string;
  type: 'recharge' | 'withdrawal' | 'payment' | 'transfer';
  amount: number;
  currency: string;
  date: string;
  method: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  participantName: string;
  lastMessage: string;
  unreadCount: number;
  avatar: string;
}
