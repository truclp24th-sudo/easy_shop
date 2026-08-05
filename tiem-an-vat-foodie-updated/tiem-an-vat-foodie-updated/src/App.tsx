import React, { useState, useEffect } from 'react';
import { 
  getProducts, getReviews, getOrders, getContactMessages, saveLocalData 
} from './data';
import { db } from './firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Product, CartItem, Order, Review, ContactMessage, AppUser, TelegramConfig } from './types';
import Header from './components/Header';
import Hero from './components/Hero';
import ProductCard from './components/ProductCard';
import ProductDetailModal from './components/ProductDetailModal';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import ContactSection from './components/ContactSection';
import AdminPortal from './components/AdminPortal';
import AdminLogin from './components/AdminLogin';
import UserAuthModal from './components/UserAuthModal';
import { motion, AnimatePresence } from 'motion/react';

import { MessageSquare, Star, ArrowRight, Sparkles, Award, Heart, CheckCircle, ShieldCheck, BookOpen, Cpu, Clock, ArrowUpRight, ChevronRight, Newspaper, X } from 'lucide-react';
import zaloQR from "./assets/images/zaloQR.jpg";

// ================= Cấu hình tự động xử lý đơn hàng =================
// Đơn hàng sẽ tự động chuyển qua 4 bước (Chờ xác nhận -> Chờ lấy hàng -> Chờ giao hàng -> Hoàn thành)
// theo thời gian, không cần nhân viên bấm tay. Admin vẫn có thể bấm nút để xử lý thủ công/ghi đè bất cứ lúc nào.
// ĐANG ĐỂ CHẾ ĐỘ DEMO: mỗi bước cách nhau 10 giây. Khi triển khai thật, đổi số mili-giây bên dưới
// (vd: 10 * 60 * 1000 cho 10 phút/bước, hoặc vài giờ/bước tuỳ tốc độ chuẩn bị - vận chuyển thực tế).
const AUTO_STEP_INTERVAL_MS = 10 * 1000; // 10 giây / bước (demo)
const ORDER_STATUS_FLOW: Order['orderStatus'][] = ['RECEIVED', 'PREPARING', 'DELIVERING', 'COMPLETED'];

// Thời gian dự kiến giao hàng hiển thị cho khách (tính từ lúc đặt đơn).
// Mặc định: 1 ngày sau khi đặt hàng. Có thể đổi thành số giờ/ngày khác tuỳ nhu cầu thực tế của shop.
const ESTIMATED_DELIVERY_MS = 24 * 60 * 60 * 1000; // 24 giờ

export default function App() {
  // Master state
  const [currentView, setCurrentView] = useState<'client' | 'admin'>('client');
  const [activeSection, setActiveSection] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState('');
  const [selectedNewsArticle, setSelectedNewsArticle] = useState<any | null>(null);
  const [showZaloQR, setShowZaloQR] = useState(false);

  // Admin and Routing states
  const [isAdminPath, setIsAdminPath] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return localStorage.getItem('isAdminAuthenticated') === 'true';
  });

  // User Accounts & Membership states
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem('aura_current_user') || sessionStorage.getItem('aura_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [users, setUsers] = useState<AppUser[]>(() => {
    const saved = localStorage.getItem('aura_users_list');
    return saved ? JSON.parse(saved) : [];
  });

  const handleUserLogin = (email: string, password: string, remember: boolean = true): boolean => {
    const found = users.find(
      u => (u.email || '').trim().toLowerCase() === email.trim().toLowerCase() && u.password === password
    );
    if (found) {
      setCurrentUser(found);
      if (remember) {
        localStorage.setItem('aura_current_user', JSON.stringify(found));
        sessionStorage.removeItem('aura_current_user');
      } else {
        sessionStorage.setItem('aura_current_user', JSON.stringify(found));
        localStorage.removeItem('aura_current_user');
      }
      return true;
    }
    return false;
  };

  const handleUserRegister = (name: string, email: string, phone: string, password: string, isMember: boolean): AppUser => {
    const memberCardNo = isMember ? `AURA-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}` : undefined;
    const newUser: AppUser = {
      name,
      email,
      password,
      phone,
      address: '',
      isMember,
      memberCardNo,
      memberPoints: isMember ? 100 : 0, // 100 welcome bonus points
      createdAt: new Date().toISOString()
    };

    const updatedUsers = [...users.filter(u => u.phone !== phone), newUser];
    setUsers(updatedUsers);
    localStorage.setItem('aura_users_list', JSON.stringify(updatedUsers));

    setCurrentUser(newUser);
    localStorage.setItem('aura_current_user', JSON.stringify(newUser));
    sessionStorage.removeItem('aura_current_user');
    return newUser;
  };

  const handleUserLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('aura_current_user');
    sessionStorage.removeItem('aura_current_user');
  };

  // Custom route navigator helper
  const navigate = (toPath: string) => {
    window.history.pushState({}, '', toPath);
    window.dispatchEvent(new Event('popstate'));
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdminAuthenticated');
    setIsAdminAuthenticated(false);
    navigate('/');
  };

  const handleViewChange = (view: 'client' | 'admin') => {
    if (view === 'client') {
      navigate('/');
    } else {
      navigate('/admin');
    }
  };
  
  // Data State loaded from localStorage
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => {
  const path = window.location.pathname;

  if (path.startsWith("/review/")) {
    const orderId = path.split("/")[2];

    console.log("Đơn cần đánh giá:", orderId);

    // Chút nữa mình sẽ hiển thị form đánh giá ở đây
  }
}, []);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>(() => {
    const saved = localStorage.getItem('esy_telegram_config');
    return saved ? JSON.parse(saved) : { botToken: '', chatId: '', enabled: false };
  });

  const handleUpdateTelegramConfig = (newConfig: TelegramConfig) => {
    setTelegramConfig(newConfig);
    localStorage.setItem('esy_telegram_config', JSON.stringify(newConfig));
  };

  // Cart & UI Controls
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const reviewProductId = new URLSearchParams(window.location.search).get("product");
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Load database on mount and listen to custom admin routing
  useEffect(() => {
    const hasRebranded = localStorage.getItem('perfume_rebrand_v1');
    if (!hasRebranded) {
      // Clear old snack-related mock data to load new perfume datasets
      localStorage.removeItem('foodie_snack_products');
      localStorage.removeItem('foodie_snack_reviews');
      localStorage.removeItem('foodie_snack_orders');
      localStorage.removeItem('foodie_snack_contact_messages');
      localStorage.setItem('perfume_rebrand_v1', 'true');
    }

    const hasResetRating = localStorage.getItem('esyshop_reset_rating_v4');
    if (!hasResetRating) {
      localStorage.removeItem('esyshop_products');
      localStorage.removeItem('esyshop_reviews');
      localStorage.setItem('esyshop_reset_rating_v4', 'true');
    }

    const loadedProducts = getProducts();

setProducts(loadedProducts);

const productId = new URLSearchParams(window.location.search).get("product");

if (productId) {

  const product = loadedProducts.find(p => p.id === productId);

  if (product) {
    setSelectedProduct(product);
  }

}

setReviews(getReviews());
setOrders(getOrders());
    setReviews(getReviews());
    setOrders(getOrders());
    setContactMessages(getContactMessages());

    const checkPath = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      const isAdmin = path.includes('/admin') || hash === '#admin';
      setIsAdminPath(isAdmin);
      if (isAdmin) {
        setCurrentView('admin');
      } else {
        setCurrentView('client');
      }
    };

    checkPath();

    window.addEventListener('popstate', checkPath);
    window.addEventListener('hashchange', checkPath);

    return () => {
      window.removeEventListener('popstate', checkPath);
      window.removeEventListener('hashchange', checkPath);
    };
  }, []);

  // ================= Đồng bộ đơn hàng real-time qua Firestore =================
  // Lắng nghe collection "orders" trên Firebase - bất kỳ khách nào đặt hàng
  // (ở bất kỳ thiết bị nào) sẽ tự động cập nhật ngay trên trang Admin.
  useEffect(() => {
    const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const firestoreOrders = snapshot.docs.map((d) => d.data() as Order);
        setOrders(firestoreOrders);
        saveLocalData('orders', firestoreOrders); // giữ bản cache local phòng khi mất mạng
      },
      (error) => {
        console.error('Lỗi lắng nghe đơn hàng từ Firestore:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  // ================= Đồng bộ sản phẩm real-time qua Firestore =================
  // (bao gồm cả soldCount - số lượng đã bán - để mọi khách đều thấy số mới nhất)
  useEffect(() => {
    let seeded = false;
    const unsubscribe = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        if (snapshot.empty) {
          // Lần đầu tiên chạy, Firestore chưa có dữ liệu -> seed bằng danh sách sản phẩm hiện có
          if (!seeded) {
            seeded = true;
            products.forEach((p) => {
              setDoc(doc(db, 'products', p.id), p).catch((err) =>
                console.error('Lỗi khởi tạo sản phẩm lên Firestore:', err)
              );
            });
          }
          return;
        }
        const firestoreProducts = snapshot.docs.map((d) => d.data() as Product);
        setProducts(firestoreProducts);
        saveLocalData('products', firestoreProducts);
      },
      (error) => {
        console.error('Lỗi lắng nghe sản phẩm từ Firestore:', error);
      }
    );

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ================= Đồng bộ đánh giá real-time qua Firestore =================
  useEffect(() => {
    const reviewsQuery = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      reviewsQuery,
      (snapshot) => {
        const firestoreReviews = snapshot.docs.map((d) => d.data() as Review);
        setReviews(firestoreReviews);
        saveLocalData('reviews', firestoreReviews);
      },
      (error) => {
        console.error('Lỗi lắng nghe đánh giá từ Firestore:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Sync state changes with local storage + Firestore
  const syncProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    saveLocalData('products', newProducts);

    newProducts.forEach((product) => {
      setDoc(doc(db, 'products', product.id), product, { merge: true }).catch((err) => {
        console.error('Lỗi đồng bộ sản phẩm lên Firestore:', err);
      });
    });
  };

  const syncReviews = (newReviews: Review[]) => {
    setReviews(newReviews);
    saveLocalData('reviews', newReviews);

    newReviews.forEach((review) => {
      setDoc(doc(db, 'reviews', review.id), review, { merge: true }).catch((err) => {
        console.error('Lỗi đồng bộ đánh giá lên Firestore:', err);
      });
    });
  };

  const syncOrders = (newOrders: Order[]) => {
    setOrders(newOrders);
    saveLocalData('orders', newOrders);

    // Ghi từng đơn hàng lên Firestore để đồng bộ real-time giữa mọi thiết bị.
    // (onSnapshot ở trên sẽ tự động cập nhật lại state khi ghi thành công)
    newOrders.forEach((order) => {
      setDoc(doc(db, 'orders', order.id), order, { merge: true }).catch((err) => {
        console.error('Lỗi đồng bộ đơn hàng lên Firestore:', err);
      });
    });
  };

  const syncContactMessages = (newContactMessages: ContactMessage[]) => {
    setContactMessages(newContactMessages);
    saveLocalData('contact_messages', newContactMessages);
  };

  const handleAddContactMessage = (name: string, email: string, message: string) => {
    const newMessage: ContactMessage = {
      id: `msg-${Date.now()}`,
      name,
      email,
      message,
      createdAt: new Date().toISOString(),
      status: 'PENDING'
    };
    syncContactMessages([...contactMessages, newMessage]);
  };

  const handleUpdateContactStatus = (contactId: string, status: 'PENDING' | 'READ') => {
    const updated = contactMessages.map(msg => 
      msg.id === contactId ? { ...msg, status } : msg
    );
    syncContactMessages(updated);
  };

  const handleDeleteContactMessage = (contactId: string) => {
    const updated = contactMessages.filter(msg => msg.id !== contactId);
    syncContactMessages(updated);
  };

  // Cart Management
  const handleAddToCart = (product: Product, quantity: number = 1) => {
    if (!currentUser) {
      setAuthModalMessage('Vui lòng đăng nhập hoặc đăng ký tài khoản thành viên để thêm sản phẩm vào giỏ hàng.');
      setIsAuthModalOpen(true);
      return;
    }
    setCartItems(prev => {
      const existingIdx = prev.findIndex(item => item.product.id === product.id);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += quantity;
        return updated;
      }
      return [...prev, { product, quantity }];
    });
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    setCartItems(prev => prev.map(item => 
      item.product.id === productId ? { ...item, quantity } : item
    ));
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const sendTelegramNotification = async (order: Order) => {
    if (!telegramConfig.enabled || !telegramConfig.botToken || !telegramConfig.chatId) {
      return;
    }

    try {
      const itemsList = order.items
        .map(item => `• ${item.productName} x ${item.quantity} - <b>${(item.price * item.quantity).toLocaleString('vi-VN')}đ</b>`)
        .join('\n');

      const text = `🔔 <b>CÓ ĐƠN HÀNG MỚI - ESYSHOP</b>\n\n` +
        `📦 <b>Mã đơn:</b> <code>${order.id}</code>\n` +
        `👤 <b>Khách hàng:</b> ${order.customerName}\n` +
        `📞 <b>Số điện thoại:</b> <code>${order.customerPhone}</code>\n` +
        `📍 <b>Địa chỉ:</b> ${order.customerAddress}\n` +
        `📝 <b>Ghi chú:</b> ${order.customerNotes || 'Không có ghi chú'}\n` +
        `💳 <b>Phương thức:</b> ${order.paymentMethod === 'COD' ? 'Thanh toán COD' : 'Chuyển khoản ONLINE'}\n` +
        `💵 <b>Trạng thái:</b> ${order.paymentStatus === 'PENDING' ? 'Chờ thanh toán' : 'Đã thanh toán'}\n\n` +
        `🛒 <b>Danh sách sản phẩm:</b>\n${itemsList}\n\n` +
        `💰 <b>Tổng giá trị đơn:</b> <b>${order.total.toLocaleString('vi-VN')}đ</b>`;

      await fetch(`https://api.telegram.org/bot${telegramConfig.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: telegramConfig.chatId,
          text: text,
          parse_mode: 'HTML',
        }),
      });
    } catch (error) {
      console.error('Lỗi khi gửi thông báo đến Telegram:', error);
    }
  };

  // Quick Order Functionality
  const handleQuickOrder = (product: Product, quantity = 1) => {
    if (!currentUser) {
      setAuthModalMessage('Vui lòng đăng nhập hoặc đăng ký tài khoản thành viên để tiến hành đặt hàng nhanh.');
      setIsAuthModalOpen(true);
      return;
    }
    // Clear cart or add item & proceed instantly
    setCartItems([{ product, quantity }]);
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  // Placement of Orders
  const handlePlaceOrder = (customerData: {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  customerNotes: string;
  paymentMethod: 'COD' | 'ONLINE';
  paymentStatus: 'PENDING' | 'PAID';
  isMemberRegistrationRequested?: boolean;
}) => {
    const orderSubtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const orderTotal = orderSubtotal + (orderSubtotal > 150000 ? 0 : 15000);

    const newOrder: Order = {
  id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
  customerName: customerData.customerName,
  customerPhone: customerData.customerPhone,
  customerEmail: customerData.customerEmail,
  customerAddress: customerData.customerAddress,
  customerNotes: customerData.customerNotes,
  items: cartItems.map(item => ({
    productId: item.product.id,
    productName: item.product.name,
    price: item.product.price,
    quantity: item.quantity,
    image: item.product.image
  })),
  total: orderTotal,
  paymentMethod: customerData.paymentMethod,
  paymentStatus: customerData.paymentStatus,
  orderStatus: 'RECEIVED',
  createdAt: new Date().toISOString(),
  estimatedDeliveryAt: new Date(Date.now() + ESTIMATED_DELIVERY_MS).toISOString()
};

// Gửi đơn hàng sang NodeJS để gửi email
fetch("/api/order", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(newOrder),
})
.then(async (res) => {
  const data = await res.json();
  console.log("Server:", data);
})
.catch((err) => {
  console.error("Lỗi gửi server:", err);
});

// Sau đó mới lưu đơn hàng
const updatedOrders = [newOrder, ...orders];
syncOrders(updatedOrders);

    // Lưu ý: soldCount (số lượng đã bán) KHÔNG tăng ở đây nữa.
    // Nó chỉ tăng khi admin cập nhật trạng thái đơn hàng thành "Đã giao thành công"
    // (xem handleUpdateOrderStatus) để phản ánh đúng số lượng đã bán thực tế.

    // Points earned: 1 point per 10,000 VND
    const pointsEarned = Math.floor(orderTotal / 10000);

    let targetUser = currentUser;
    if (customerData.isMemberRegistrationRequested && customerData.customerPhone) {
      const existing = users.find(u => u.phone === customerData.customerPhone);
      if (existing) {
        targetUser = {
          ...existing,
          name: customerData.customerName,
          email: existing.email || customerData.customerEmail,
          address: customerData.customerAddress,
          isMember: true,
          memberCardNo: existing.memberCardNo || `AURA-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
          memberPoints: existing.memberPoints + pointsEarned
        };
      } else {
        targetUser = {
          name: customerData.customerName,
          email: customerData.customerEmail,
          phone: customerData.customerPhone,
          address: customerData.customerAddress,
          isMember: true,
          memberCardNo: `AURA-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
          memberPoints: 100 + pointsEarned, // 100 welcome points + order points
          createdAt: new Date().toISOString()
        };
      }
    } else if (currentUser && currentUser.phone === customerData.customerPhone) {
      targetUser = {
        ...currentUser,
        memberPoints: currentUser.memberPoints + pointsEarned
      };
    }

    if (targetUser) {
      setCurrentUser(targetUser);
      localStorage.setItem('aura_current_user', JSON.stringify(targetUser));

      const updatedUsers = [...users.filter(u => u.phone !== targetUser.phone), targetUser];
      setUsers(updatedUsers);
      localStorage.setItem('aura_users_list', JSON.stringify(updatedUsers));
    }

    // Clear cart
    setCartItems([]);
  };

  // Reviews Adding
  const handleAddReview = (productId: string, userName: string, rating: number, comment: string) => {
    const newReview: Review = {
      id: `REV-${Math.floor(100000 + Math.random() * 900000)}`,
      productId,
      userName,
      rating,
      comment,
      createdAt: new Date().toISOString(),
      status: 'PENDING'
    };

    const updatedReviews = [newReview, ...reviews];
    syncReviews(updatedReviews);

    // Recalculate average rating of target product (all except HIDDEN)
    const productReviews = updatedReviews.filter(r => r.productId === productId && r.status !== 'HIDDEN');
    const avgRating = productReviews.length > 0 
      ? Number((productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length).toFixed(1))
      : 0;

    const updatedProducts = products.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          rating: avgRating,
          reviewsCount: productReviews.length
        };
      }
      return p;
    });
    syncProducts(updatedProducts);

    // Update current selected product state to refresh detail view instantly
    if (selectedProduct && selectedProduct.id === productId) {
      setSelectedProduct(prev => prev ? {
        ...prev,
        rating: avgRating,
        reviewsCount: productReviews.length
      } : null);
    }
  };

  const handleUpdateReviewStatus = (reviewId: string, status: 'PENDING' | 'APPROVED' | 'HIDDEN') => {
    const updatedReviews = reviews.map(r => {
      if (r.id === reviewId) {
        return { ...r, status };
      }
      return r;
    });
    syncReviews(updatedReviews);

    // Recalculate average rating of target product
    const targetReview = reviews.find(r => r.id === reviewId);
    if (targetReview) {
      const pid = targetReview.productId;
      const productReviews = updatedReviews.filter(r => r.productId === pid && r.status !== 'HIDDEN');
      const avgRating = productReviews.length > 0 
        ? Number((productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length).toFixed(1))
        : 0;

      const updatedProducts = products.map(p => {
        if (p.id === pid) {
          return {
            ...p,
            rating: avgRating,
            reviewsCount: productReviews.length
          };
        }
        return p;
      });
      syncProducts(updatedProducts);

      // Update current selected product state to refresh detail view instantly
      if (selectedProduct && selectedProduct.id === pid) {
        setSelectedProduct(prev => prev ? {
          ...prev,
          rating: avgRating,
          reviewsCount: productReviews.length
        } : null);
      }
    }
  };

  // Admin Actions
  const handleAddProduct = (newProduct: Omit<Product, 'id' | 'rating' | 'reviewsCount' | 'soldCount'>) => {
    const addedProduct: Product = {
      ...newProduct,
      id: `snack-${products.length + 1}`,
      rating: 5.0,
      reviewsCount: 0,
      soldCount: 0
    };
    syncProducts([...products, addedProduct]);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    syncProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const handleDeleteProduct = (productId: string) => {
    syncProducts(products.filter(p => p.id !== productId));
    deleteDoc(doc(db, 'products', productId)).catch((err) => {
      console.error('Lỗi xóa sản phẩm trên Firestore:', err);
    });
  };

const handleUpdateOrderStatus = (
  orderId: string,
  status: Order['orderStatus'],
  paymentStatus?: Order['paymentStatus']
) => {

  const previousOrder = orders.find(o => o.id === orderId);

  const updatedOrders = orders.map(o => {
    if (o.id === orderId) {
      return {
        ...o,
        orderStatus: status,
        paymentStatus: paymentStatus || o.paymentStatus
      };
    }
    return o;
  });

  syncOrders(updatedOrders);

  // ================= Cập nhật soldCount (số lượng đã bán) =================
  // Chỉ tính là "đã bán" khi đơn được xác nhận GIAO HÀNG THÀNH CÔNG.
  // Nếu admin lỡ đổi từ COMPLETED sang trạng thái khác, số đã bán sẽ giảm lại tương ứng.
  if (previousOrder && previousOrder.orderStatus !== status) {
    const wasCompleted = previousOrder.orderStatus === 'COMPLETED';
    const isNowCompleted = status === 'COMPLETED';

    if (!wasCompleted && isNowCompleted) {
      const updatedProducts = products.map(p => {
        const orderItem = previousOrder.items.find(item => item.productId === p.id);
        if (orderItem) {
          return { ...p, soldCount: p.soldCount + orderItem.quantity };
        }
        return p;
      });
      syncProducts(updatedProducts);
    } else if (wasCompleted && !isNowCompleted) {
      const updatedProducts = products.map(p => {
        const orderItem = previousOrder.items.find(item => item.productId === p.id);
        if (orderItem) {
          return { ...p, soldCount: Math.max(0, p.soldCount - orderItem.quantity) };
        }
        return p;
      });
      syncProducts(updatedProducts);
    }
  }

  const order = updatedOrders.find(o => o.id === orderId);

  if (!order) return;

  // Gửi email khi xác nhận đơn
  if (status === "PREPARING") {

    fetch("/api/order/confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(order),
    })
    .then(res => res.json())
    .then(data => console.log("Confirm:", data))
    .catch(err => console.log(err));

  }

  // Gửi email khi chuyển sang chờ giao hàng
  if (status === "DELIVERING") {

    fetch("/api/order/delivering", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(order),
    })
    .then(res => res.json())
    .then(data => console.log("Delivering:", data))
    .catch(err => console.log(err));

  }

  // Gửi email khi giao hàng thành công
  if (status === "COMPLETED") {

    fetch("/api/order/completed", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(order),
    })
    .then(res => res.json())
    .then(data => console.log("Completed:", data))
    .catch(err => console.log(err));

  }

};

// ================= Tự động xử lý đơn hàng theo thời gian =================
// Thay vì nhân viên phải bấm tay từng bước (Xác nhận -> Giao vận chuyển -> Hoàn thành),
// hệ thống tự kiểm tra định kỳ và tự chuyển trạng thái đơn hàng theo mốc thời gian kể từ
// lúc đặt hàng. Trang "Đơn hàng" của khách (UserAuthModal) đang lắng nghe cùng dữ liệu
// `orders` real-time qua Firestore, nên sẽ tự cập nhật ngay khi trạng thái thay đổi ở đây -
// không cần khách bấm F5. Nút bấm thủ công trong AdminPortal vẫn hoạt động bình thường,
// nhân viên có thể xử lý tay hoặc ghi đè bất cứ lúc nào (ví dụ giao gấp, xử lý ngoại lệ...).
useEffect(() => {
  const timer = setInterval(() => {
    orders.forEach((order) => {
      // Bỏ qua đơn đã huỷ hoặc đã hoàn thành - không có gì để tự động thêm nữa
      if (order.orderStatus === 'CANCELLED' || order.orderStatus === 'COMPLETED') return;

      const elapsedMs = Date.now() - new Date(order.createdAt).getTime();
      const expectedStepIdx = Math.min(
        ORDER_STATUS_FLOW.length - 1,
        Math.floor(elapsedMs / AUTO_STEP_INTERVAL_MS)
      );
      const currentStepIdx = ORDER_STATUS_FLOW.indexOf(order.orderStatus);
      const expectedStatus = ORDER_STATUS_FLOW[expectedStepIdx];

      // Chỉ tự động ĐI TỚI (không bao giờ lùi lại) - nếu nhân viên đã xử lý
      // nhanh hơn hoặc đơn đã ở bước sau, hệ thống sẽ không đụng vào.
      if (expectedStepIdx > currentStepIdx) {
        handleUpdateOrderStatus(
          order.id,
          expectedStatus,
          expectedStatus === 'COMPLETED' ? 'PAID' : undefined
        );
      }
    });
  }, 2000); // kiểm tra mỗi 2 giây

  return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [orders]);

// ================= Xóa đơn hàng =================
const handleDeleteOrder = (orderId: string) => {

  const confirmDelete = window.confirm(
    "Bạn có chắc muốn xóa đơn hàng này không?"
  );

  if (!confirmDelete) return;

  const orderToDelete = orders.find(o => o.id === orderId);

  const updatedOrders = orders.filter(o => o.id !== orderId);

  syncOrders(updatedOrders);

  // Nếu đơn bị xóa đã từng được tính "Đã giao thành công" thì trừ lại soldCount tương ứng
  if (orderToDelete && orderToDelete.orderStatus === 'COMPLETED') {
    const updatedProducts = products.map(p => {
      const orderItem = orderToDelete.items.find(item => item.productId === p.id);
      if (orderItem) {
        return { ...p, soldCount: Math.max(0, p.soldCount - orderItem.quantity) };
      }
      return p;
    });
    syncProducts(updatedProducts);
  }

  // Xóa luôn đơn hàng này khỏi Firestore để không bị "hồi sinh" qua real-time sync
  deleteDoc(doc(db, 'orders', orderId)).catch((err) => {
    console.error('Lỗi xóa đơn hàng trên Firestore:', err);
  });

  // thêm đoạn này
 if (status === "PREPARING") {

  const order = updatedOrders.find(o => o.id === orderId);

  if (order) {
    fetch("/api/order/confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(order),
    })
    .then(res => res.json())
    .then(data => console.log(data))
    .catch(err => console.log(err));
  }

  }
  if (status === "DELIVERING") {

  const order = updatedOrders.find(o => o.id === orderId);

  if (order) {

    fetch("/api/order/delivering", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(order),
    })
    .then(res => res.json())
    .then(data => console.log("Đã gửi email đang giao:", data))
    .catch(console.error);

  }

  }
  if (status === "DELIVERING") {

  const order = updatedOrders.find(o => o.id === orderId);

  if (order) {

    fetch("/api/order/delivering", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(order),
    })
    .then(res => res.json())
    .then(data => console.log("Đã gửi email đang giao:", data))
    .catch(console.error);

  }

}
if (status === "COMPLETED") {

  const order = updatedOrders.find(o => o.id === orderId);

  if (order) {

    fetch("/api/order/completed", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(order),
    })
    .then(res => res.json())
    .then(data => console.log("Đã gửi email giao hàng:", data))
    .catch(console.error);

  }

}
};

  const handleAddReviewReply = (reviewId: string, replyText: string) => {
    const updatedReviews = reviews.map(r => {
      if (r.id === reviewId) {
        return {
          ...r,
          reply: replyText,
          status: 'APPROVED' as const // Tự động phê duyệt hiển thị ngay lập tức khi gửi phản hồi
        };
      }
      return r;
    });
    syncReviews(updatedReviews);

    // Tìm review để lấy productId và đồng bộ rating/reviewsCount cho sản phẩm tương ứng
    const targetReview = reviews.find(r => r.id === reviewId);
    if (targetReview) {
      const pid = targetReview.productId;
      const productReviews = updatedReviews.filter(r => r.productId === pid && r.status !== 'HIDDEN');
      const avgRating = productReviews.length > 0 
        ? Number((productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length).toFixed(1))
        : 0;

      const updatedProducts = products.map(p => {
        if (p.id === pid) {
          return {
            ...p,
            rating: avgRating,
            reviewsCount: productReviews.length
          };
        }
        return p;
      });
      syncProducts(updatedProducts);

      // Cập nhật state selectedProduct để trang sản phẩm hiện tại nhận diện được thay đổi ngay tức khắc
      if (selectedProduct && selectedProduct.id === pid) {
        setSelectedProduct(prev => prev ? {
          ...prev,
          rating: avgRating,
          reviewsCount: productReviews.length
        } : null);
      }
    }
  };

  // Client Filter logic
  const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const filteredProducts = products.filter((p) => {
  const keyword = normalize(searchQuery);

  const matchesSearch =
    normalize(p.name).includes(keyword) ||
    normalize(p.description).includes(keyword) ||
    normalize(p.category).includes(keyword);

  const matchesCategory =
    selectedCategory === "all" || p.category === selectedCategory;

  return matchesSearch && matchesCategory;
});

  const cartSubtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const cartShippingFee = cartSubtotal > 150000 || cartItems.length === 0 ? 0 : 15000;

  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 flex flex-col font-sans selection:bg-gray-950 selection:text-white">
      
      {/* Dynamic Header */}
      <Header
        currentView={currentView}
        onViewChange={handleViewChange}
        cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
        onCartClick={() => setCartOpen(true)}
        activeSection={activeSection}
        onSectionClick={(id) => setActiveSection(id)}
        currentUser={currentUser}
        onAuthClick={() => {
          setAuthModalMessage('');
          setIsAuthModalOpen(true);
        }}
      />

      <AnimatePresence mode="wait">
        {currentView === 'client' ? (
          
          /* CLIENT STOREFRONT VIEW */
          <motion.main
            key="client-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1"
          >
            {/* Hero / Filter Section */}
            <div id="home" className="scroll-mt-20">
              <Hero
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
              />
            </div>

            {/* Product Grid Section */}
            <section id="products" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-10">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
                <div className="space-y-2">
                  <h2 className="text-3xl font-serif font-black text-gray-950 tracking-tight flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-gray-950" />
                    Thiết Bị Số & Sổ Giấy Cao Cấp
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 font-semibold">
                    Máy in nhiệt, máy scan, máy chiếu mini hiện đại kết hợp với sổ tay và phụ kiện văn phòng thông minh.
                  </p>
                </div>
              </div>

              {/* Grid Layout */}
              {filteredProducts.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-250 p-8 max-w-md mx-auto space-y-4">
                  <p className="text-3xl">✨</p>
                  <p className="text-sm font-extrabold text-gray-800">Không tìm thấy sản phẩm bạn đang tìm kiếm!</p>
                  <p className="text-xs text-gray-400">Vui lòng thử tìm bằng từ khóa khác hoặc chọn danh mục khác.</p>
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                    className="py-2.5 px-6 rounded-xl bg-gray-950 text-white font-bold text-xs uppercase cursor-pointer"
                  >
                    Xem tất cả sản phẩm
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={(p) => handleAddToCart(p, 1)}
                      onQuickOrder={handleQuickOrder}
                      onOpenDetails={setSelectedProduct}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Social Proof / Overall Ratings Highlights */}
            <section id="reviews" className="py-20 bg-gradient-to-b from-white to-gray-50 border-t border-gray-200 scroll-mt-10">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Section title */}
                <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-widest bg-gray-100 border border-gray-250 px-2.5 py-1 rounded-full">
                    Được yêu thích bởi hàng nghìn khách hàng
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-serif font-black text-gray-950 tracking-tight">
                    Khách Hàng Nói Gì Về EsyShop?
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 font-semibold">
                    Hơn 99% khách hàng hài lòng tuyệt đối về chất lượng in ấn sắc nét, tốc độ quét vượt trội và hình ảnh máy chiếu sống động từ EsyShop.
                  </p>
                </div>

                {/* Reviews grids highlights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Review 1 */}
                  <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-2xs space-y-4 relative">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-100 text-gray-900 border border-gray-200 flex items-center justify-center font-bold text-sm">
                        AH
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-gray-900">Anh Hoàng</h4>
                        <span className="text-[10px] text-gray-400 font-medium">Khách hàng lâu năm</span>
                      </div>
                    </div>
                    <div className="flex text-gray-950">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-current" />
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 font-medium leading-relaxed">
                      "Máy in nhiệt A6 của shop quá đỉnh, in đơn hàng hỏa tốc siêu nhanh, chữ sắc nét rõ ràng, không dùng mực cực kỳ tiết kiệm. Đóng gói rất kỹ càng. Sẽ tiếp tục ủng hộ EsyShop!"
                    </p>
                  </div>

                  {/* Review 2 */}
                  <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-2xs space-y-4 relative">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-100 text-gray-900 border border-gray-200 flex items-center justify-center font-bold text-sm">
                        TL
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-gray-900">Thanh Lâm</h4>
                        <span className="text-[10px] text-gray-400 font-medium">Khách hàng cá nhân</span>
                      </div>
                    </div>
                    <div className="flex text-gray-950">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-current" />
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 font-medium leading-relaxed">
                      "Cuốn Sổ tay Bullet Journal B5 của EsyShop chất lượng giấy siêu dày dặn, viết bút marker không hề bị thấm sang mặt sau. Bìa da PU sờ rất mịn, khâu chỉ chắc chắn, đóng gói siêu sang trọng."
                    </p>
                  </div>

                  {/* Review 3 */}
                  <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-2xs space-y-4 relative">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-100 text-gray-900 border border-gray-200 flex items-center justify-center font-bold text-sm">
                        MN
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-gray-900">Mai Nhung</h4>
                        <span className="text-[10px] text-gray-400 font-medium">Văn phòng quận 1</span>
                      </div>
                    </div>
                    <div className="flex text-gray-950">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-current" />
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 font-medium leading-relaxed">
                      "Máy chiếu mini Full HD EsyProject của shop hình ảnh cực kỳ sắc nét kể cả chiếu ban ngày. Có loa kép nghe cực đã, kết nối wifi điện thoại nhanh chóng. Nhân viên hỗ trợ UltraView cài đặt nhiệt tình vô cùng."
                    </p>
                  </div>

                </div>

              </div>
            </section>

            {/* TIN TỨC & CẨM NANG SECTION */}
            <section id="news" className="py-20 bg-white border-t border-gray-200 scroll-mt-10">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Section title */}
                <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-widest bg-gray-100 border border-gray-250 px-2.5 py-1 rounded-full">
                    Tin tức mới nhất từ hệ thống
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-serif font-black text-gray-950 tracking-tight">
                    Tin Tức & Cẩm Nang Sử Dụng
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 font-semibold">
                    Cập nhật các chương trình khuyến mãi, cẩm nang sử dụng thiết bị số và bí quyết ghi chép sổ tay sáng tạo.
                  </p>
                </div>

                {/* News Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    {
                      id: 'driver-guide',
                      title: 'Hướng Dẫn Cài Đặt Driver Máy In Nhiệt EsyPrint P10',
                      category: 'Hỗ Trợ Kỹ Thuật',
                      date: '28 Th06, 2026',
                      icon: Cpu,
                      summary: 'Chi tiết các bước cài đặt driver kết nối máy in nhiệt mini EsyPrint P10 trên máy tính Windows, macOS và ứng dụng in đơn hàng di động qua Bluetooth.',
                      content: `EsyPrint P10 là dòng máy in nhiệt mini cao cấp hỗ trợ in hóa đơn, in nhãn dán, nhãn mã vạch không cần dùng mực. Để máy hoạt động chính xác và sắc nét nhất, bạn cần cài đặt đúng Driver tương thích.\n\n### Các bước cài đặt trên máy tính (Windows / macOS)\n1. Kết nối máy in với nguồn điện và cắm cáp USB vào máy tính.\n2. Bật nguồn máy in (nút nguồn phía trước).\n3. Tải driver tương ứng từ hòm thư hỗ trợ kỹ thuật (support@esyshop.vn) hoặc liên hệ nhân viên qua Zalo để nhận file cài đặt nhanh.\n4. Chạy tệp cài đặt và làm theo hướng dẫn trên màn hình. Khi chọn cổng kết nối, hãy chọn cổng USB001 hoặc USB002.\n\n### Kết nối trên Điện thoại (iOS / Android)\n1. Bật Bluetooth trên điện thoại di động của bạn.\n2. Mở ứng dụng quản lý đơn hàng (như GHTK, GHN, Viettel Post hoặc ứng dụng in chuyên dụng).\n3. Vào mục Cài đặt máy in -> Chọn thiết bị bluetooth tên P10-Printer -> Nhập mật khẩu kết nối mặc định là 0000 hoặc 1234.\n4. Tiến hành in thử hóa đơn khổ 80mm hoặc 58mm cực kỳ dễ dàng.`
                    },
                    {
                      id: 'shopee-shipping',
                      title: 'Tại Sao Nên Dùng Giấy In Nhiệt Vận Đơn Dán Cho Shopee & TikTok Shop?',
                      category: 'Kinh Nghiệm Kinh Doanh',
                      date: '25 Th06, 2026',
                      icon: Newspaper,
                      summary: 'Xu hướng đóng gói hiện đại giúp tiết kiệm 70% thời gian đóng hàng, hạn chế thất lạc đơn hàng và nâng cao điểm đánh giá tích cực của shop.',
                      content: `Thời gian đóng gói một đơn hàng truyền thống (in giấy thường, cắt nhỏ, dán băng keo trong) mất từ 1 - 2 phút. Trong khi đó, sử dụng máy in nhiệt và giấy in nhiệt tự dán chỉ mất đúng 3 giây:\n- In đơn hàng lập tức chỉ trong 1 giây.\n- Bóc lớp keo phía sau và dán trực tiếp lên hộp/túi gói hàng.\n\n### Tiết kiệm chi phí vận hành\nGiấy in cảm nhiệt trực tiếp tích hợp sẵn keo dán cao cấp giúp chủ shop tiết kiệm được 2 khoản chi phí lớn:\n- Không dùng mực: Đầu in nhiệt tác động nhiệt trực tiếp lên giấy để tạo chữ đen sắc nét.\n- Không dùng băng dính: Không cần tốn thêm băng dính cuộn để dán đè lên nhãn đơn hàng, hạn chế rác thải nhựa bảo vệ môi trường.\n\n### Chuyên nghiệp và chống thấm nước hoàn hảo\nGiấy in nhiệt cao cấp của EsyShop có lớp phủ màng chống xước, chống cồn, chống nước tuyệt đối. Đơn hàng di chuyển dưới trời mưa hoặc va đập vẫn giữ nguyên thông tin mã vạch quét mã vận đơn, tránh thất lạc hàng hóa tối đa.`
                    },
                    {
                      id: 'bullet-journal',
                      title: 'Cẩm Nang Làm Bullet Journal Quản Lý Công Việc & Đời Sống',
                      category: 'Khám Phá Sáng Tạo',
                      date: '20 Th06, 2026',
                      icon: BookOpen,
                      summary: 'Bí quyết ghi chép khoa học kết hợp giữa sổ giấy truyền thống và phương pháp quản lý thời gian hiện đại để đạt năng suất làm việc gấp đôi.',
                      content: `Bullet Journal (BuJo) là phương pháp quản lý cá nhân do Ryder Carroll thiết kế, giúp bạn ghi lại quá khứ, sắp xếp hiện tại và lập kế hoạch cho tương lai chỉ trong một cuốn sổ tay duy nhất.\n\n### Các trang cơ bản cần có trong một cuốn BuJo\n- Index (Mục lục): Để tra cứu nhanh các phần ghi chép.\n- Future Log (Kế hoạch tương lai): Ghi chú sự kiện lớn trong các tháng tới.\n- Monthly Log (Kế hoạch tháng): Danh sách việc cần làm và lịch trình tháng hiện tại.\n- Daily Log (Nhật ký ngày): Nhiệm vụ cụ thể từng ngày kèm theo các ký hiệu (Bullet) đặc trưng.\n\n### Lựa chọn sổ tay hoàn hảo từ EsyShop\nDòng sổ tay bìa da PU cao cấp định lượng giấy 120gsm của EsyShop chống lem tuyệt đối đối với tất cả các dòng bút mực nước, bút brush viết Calligraphy, giúp trang sổ của bạn luôn tinh tế, sạch sẽ và đầy cảm hứng sáng tạo.`
                    }
                  ].map((article) => {
                    const IconComponent = article.icon;
                    return (
                      <div 
                        key={article.id} 
                        className="bg-gray-50 border border-gray-150 rounded-3xl p-6 hover:shadow-md transition-all duration-300 flex flex-col justify-between h-full"
                      >
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-500 uppercase bg-white border border-gray-200/60 px-2.5 py-1 rounded-full">
                              {article.category}
                            </span>
                            <div className="flex items-center gap-1.5 text-gray-400 font-mono text-[10px] font-bold">
                              <Clock className="h-3 w-3" />
                              <span>{article.date}</span>
                            </div>
                          </div>

                          <div className="h-12 w-12 rounded-2xl bg-gray-950 text-white flex items-center justify-center shadow-md">
                            <IconComponent className="h-5.5 w-5.5 text-white" />
                          </div>

                          <div className="space-y-2">
                            <h3 className="text-base font-serif font-black text-gray-950 tracking-tight leading-snug hover:text-gray-800 transition-colors cursor-pointer" onClick={() => setSelectedNewsArticle(article)}>
                              {article.title}
                            </h3>
                            <p className="text-xs text-gray-500 font-medium leading-relaxed">
                              {article.summary}
                            </p>
                          </div>
                        </div>

                        <div className="pt-6 border-t border-gray-200/50 mt-6 flex justify-end">
                          <button 
                            onClick={() => setSelectedNewsArticle(article)}
                            className="flex items-center gap-1 text-xs font-bold text-gray-950 hover:text-gray-800 transition-colors uppercase tracking-wider cursor-pointer group"
                          >
                            <span>Xem chi tiết</span>
                            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            </section>

            {/* Dynamic Contact Section */}
            <ContactSection onSubmitContact={handleAddContactMessage} />

            {/* News Detail Popup Modal */}
            <AnimatePresence>
              {selectedNewsArticle && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectedNewsArticle(null)}
                    className="fixed inset-0 bg-black/60 backdrop-blur-xs"
                  />
                  
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    transition={{ type: 'spring', duration: 0.5 }}
                    className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 space-y-6 scrollbar-thin border border-gray-100 shadow-2xl z-10"
                  >
                    {/* Close button */}
                    <button
                      onClick={() => setSelectedNewsArticle(null)}
                      className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors cursor-pointer"
                    >
                      <X className="h-5 w-5" />
                    </button>

                    {/* Category & Date */}
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-gray-500 uppercase bg-gray-100 border border-gray-200/50 px-2.5 py-1 rounded-full">
                        {selectedNewsArticle.category}
                      </span>
                      <div className="flex items-center gap-1.5 text-gray-400 font-mono text-[10px] font-bold">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{selectedNewsArticle.date}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <div className="space-y-3">
                      <h3 className="text-xl sm:text-2xl font-serif font-black text-gray-950 tracking-tight leading-snug">
                        {selectedNewsArticle.title}
                      </h3>
                      <p className="text-xs text-gray-400 font-bold border-l-2 border-gray-950 pl-3 leading-relaxed">
                        {selectedNewsArticle.summary}
                      </p>
                    </div>

                    <div className="border-t border-gray-100 pt-6 prose prose-xs max-w-none">
                      {selectedNewsArticle.content.split('\n').map((para: string, i: number) => {
                        if (para.startsWith('### ')) {
                          return <h4 key={i} className="text-sm font-black text-gray-950 mt-6 mb-3 tracking-tight uppercase">{para.replace('### ', '')}</h4>;
                        }
                        if (para.trim() === '') return null;
                        return <p key={i} className="text-xs text-gray-600 font-semibold leading-relaxed mb-4">{para}</p>;
                      })}
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex justify-end">
                      <button
                        onClick={() => setSelectedNewsArticle(null)}
                        className="px-6 py-2.5 rounded-xl bg-gray-950 hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                      >
                        Đóng Bài Viết
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

          </motion.main>
        ) : (
          
          /* ADMIN DASHBOARD PORTAL VIEW */
          <motion.main
            key="admin-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 bg-slate-50"
          >
            {isAdminAuthenticated ? (
              <AdminPortal
                products={products}
                orders={orders}
                reviews={reviews}
                contactMessages={contactMessages}
                telegramConfig={telegramConfig}
                onUpdateTelegramConfig={handleUpdateTelegramConfig}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onAddReviewReply={handleAddReviewReply}
                onUpdateReviewStatus={handleUpdateReviewStatus}
                onUpdateContactStatus={handleUpdateContactStatus}
                onDeleteContactMessage={handleDeleteContactMessage}
                onLogout={handleLogout}
                onDeleteOrder={handleDeleteOrder}
              />
            ) : (
              <AdminLogin
                onLoginSuccess={() => setIsAdminAuthenticated(true)}
                onBackToStore={() => navigate('/')}
              />
            )}
          </motion.main>
        )}
      </AnimatePresence>

      {/* Floating Widget Support info */}
      {currentView === 'client' && (
        <div className="fixed bottom-6 right-6 z-30 flex flex-col gap-3 items-center">
          <button
  onClick={() => setShowZaloQR(true)}
  className="h-12 w-12 rounded-full bg-[#0068FF] hover:bg-[#0052cc] text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all group relative border border-blue-400"
  title="Chat qua Zalo"
  id="btn-zalo-floating"
>
  <span className="absolute right-14 bg-gray-900 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
    💬 Chat qua Zalo: 0378.274.136
  </span>

  <span className="font-black text-[11px] tracking-tighter uppercase">
    Zalo
  </span>
</button>

          {/* Messenger Button */}
          <a 
            href="https://m.me/esy.shop.printer" 
            target="_blank"
            rel="noopener noreferrer"
            className="h-12 w-12 rounded-full bg-gradient-to-tr from-[#0066ff] via-[#a100ff] to-[#ff0077] hover:brightness-110 text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all group relative border border-pink-400/30"
            title="Chat qua Messenger"
            id="btn-messenger-floating"
          >
            <span className="absolute right-14 bg-gray-900 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              💬 Chat qua Messenger
            </span>
            <svg className="h-6 w-6 fill-white" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.145 2 11.264c0 2.914 1.455 5.513 3.734 7.152.196.142.308.373.303.616l-.025 1.905c-.006.417.433.7.811.521l2.128-.999c.19-.089.412-.082.597.022A10.15 10.15 0 0012 20.528c5.523 0 10-4.145 10-9.264S17.523 2 12 2zm1.096 11.956l-2.47-2.632-4.814 2.632 5.289-5.61 2.49 2.632 4.794-2.632-5.289 5.61z" />
            </svg>
          </a>

          {/* Phone Button */}
          <a 
            href="tel:0987654321" 
            className="h-12 w-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all group relative border border-emerald-500"
            title="Gọi điện tư vấn hỏa tốc"
            id="btn-phone-floating"
          >
            <span className="absolute right-14 bg-gray-900 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              📞 Hotline: 0987.654.321
            </span>
            <span className="animate-ping absolute inset-0 rounded-full bg-emerald-600/20 pointer-events-none" />
            <svg className="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </a>
        </div>
      )}

      {/* Footer layout */}
      <footer className="bg-gray-900 text-gray-400 text-xs py-14 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
            
            {/* Branding */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gray-950 flex items-center justify-center text-white font-black text-sm shadow-md border border-gray-800">
                  ✨
                </div>
                <span className="text-lg font-black tracking-tight text-white">EsyShop</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed font-medium">
                Cung cấp các dòng máy in nhiệt trực tiếp chất lượng cao, máy scan tốc độ chuẩn xác và máy chiếu văn phòng, giải trí thông minh. Cam kết chính hãng 100%, bảo hành lâu dài và giao hàng hỏa tốc toàn quốc.
              </p>
              <div className="flex gap-4">
                <span className="text-gray-500 font-semibold flex items-center gap-1">
                  <Award className="h-4 w-4 text-gray-400" />
                  Chính Hãng 100%
                </span>
                <span className="text-gray-500 font-semibold flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Bảo Hành Chính Hãng 12 Tháng
                </span>
              </div>
            </div>

            {/* Links */}
            <div className="md:col-span-3 space-y-4">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Danh Mục Sản Phẩm</h4>
              <ul className="space-y-2 text-xs font-semibold">
                <li><button onClick={() => { setSelectedCategory('printer'); }} className="hover:text-white text-left transition-colors">Máy In Nhiệt</button></li>
                <li><button onClick={() => { setSelectedCategory('scanner'); }} className="hover:text-white text-left transition-colors">Máy Scan</button></li>
                <li><button onClick={() => { setSelectedCategory('projector'); }} className="hover:text-white text-left transition-colors">Máy Chiếu</button></li>
              </ul>
            </div>

            {/* Newsletter simulated */}
            <div className="md:col-span-4 space-y-4">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Bản Tin Khuyến Mãi EsyShop</h4>
              <p className="text-xs text-gray-400">Đăng ký nhận mã voucher giảm giá và thông tin phần mềm driver trực tiếp qua email.</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Nhập email của bạn..."
                  className="flex-1 py-2 px-3.5 bg-gray-800 text-white text-xs border border-gray-700 rounded-lg focus:outline-hidden"
                />
                <button 
                  onClick={() => alert('Đăng ký nhận voucher thành công!')}
                  className="py-2 px-4 rounded-lg bg-gray-950 hover:bg-black text-white font-bold text-xs uppercase"
                >
                  Đăng Ký
                </button>
              </div>
            </div>

          </div>

          <div className="border-t border-gray-800/80 pt-8 mt-10 text-center text-[11px] text-gray-500 font-medium flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="flex items-center gap-1 justify-center sm:justify-start">
              © 2026 EsyShop - Thiết Bị Số & Thiết Bị Văn Phòng Chính Hãng. All rights reserved. Mọi quyền được bảo lưu.
              <button
                onClick={() => navigate('/admin')}
                className="opacity-10 hover:opacity-100 text-gray-600 hover:text-white transition-opacity ml-1 cursor-pointer"
                title="Hệ thống quản trị"
                aria-label="Admin Access"
              >
                🔑
              </button>
            </p>
            <p className="flex items-center gap-1 justify-center">
              Made with <Heart className="h-3.5 w-3.5 text-red-500 fill-current animate-pulse" /> for digital workspace solutions.
            </p>
          </div>
        </div>
      </footer>

      {/* GLOBAL MODALS & SLIDE-OVERS */}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onCheckout={(code, amt) => {
          if (!currentUser) {
            setCartOpen(false);
            setAuthModalMessage('Vui lòng đăng nhập hoặc đăng ký tài khoản thành viên để tiến hành thanh toán đặt hàng.');
            setIsAuthModalOpen(true);
            return;
          }
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cartItems={cartItems}
        subtotal={cartSubtotal}
        shippingFee={cartShippingFee}
        discountAmount={cartItems.length > 0 ? (cartSubtotal > 150000 ? 15000 : 0) : 0}
        discountCode={cartSubtotal > 150000 ? 'FREESHIP' : ''}
        onPlaceOrder={handlePlaceOrder}
        currentUser={currentUser}
        users={users}
        onLogin={handleUserLogin}
        onRegister={handleUserRegister}
      />

      {/* User Auth Modal */}
      <UserAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        users={users}
        currentUser={currentUser}
        orders={orders}
        onLogin={handleUserLogin}
        onRegister={handleUserRegister}
        onLogout={handleUserLogout}
        message={authModalMessage}
      />

      {/* Product Details popup */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductDetailModal
            product={selectedProduct}
            isOpen={selectedProduct !== null}
            onClose={() => setSelectedProduct(null)}
            reviews={reviews}
            onAddReview={handleAddReview}
            onAddToCart={(p, qty) => handleAddToCart(p, qty)}
            onQuickOrder={(p, qty) => handleQuickOrder(p, qty)}
          />
        )}
      </AnimatePresence>
      {showZaloQR && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
    <div className="bg-white rounded-2xl p-6 relative">

      <button
        onClick={() => setShowZaloQR(false)}
        className="absolute top-2 right-3 text-xl"
      >
        ✕
      </button>

      <h2 className="text-xl font-bold text-center mb-4">
        Quét mã QR để chat Zalo
      </h2>

      <img
        src={zaloQR}
        alt="QR Zalo"
        className="w-64 mx-auto"
      />

    </div>
  </div>
)}

    </div>
  );
}

