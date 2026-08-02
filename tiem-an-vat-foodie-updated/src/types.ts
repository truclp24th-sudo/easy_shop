export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  priceMax?: number;
  originalPrice?: number;
  image: string;
  images?: string[]; // Danh sách nhiều hình ảnh của sản phẩm
  category: string;
  rating: number;
  reviewsCount: number;
  isAvailable: boolean;
  soldCount: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  reply?: string;
  createdAt: string;
  status?: 'PENDING' | 'APPROVED' | 'HIDDEN';
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  customerNotes?: string;
  items: {
    productId: string;
    productName: string;
    price: number;
    quantity: number;
    image: string;
  }[];
  total: number;
  paymentMethod: 'COD' | 'ONLINE';
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  orderStatus: 'RECEIVED' | 'PREPARING' | 'DELIVERING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  status: 'PENDING' | 'READ';
}

export interface AppUser {
  phone: string;
  email?: string;
  password?: string;
  name: string;
  address: string;
  isMember: boolean;
  memberCardNo?: string;
  memberPoints: number;
  createdAt: string;
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
}

