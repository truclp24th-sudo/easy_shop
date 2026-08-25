import React, { useState, useEffect } from 'react';
import { 
  getProducts, getReviews, getOrders, getContactMessages, saveLocalData, CATEGORIES 
} from './data';
import { db } from './firebase';
import { collection, doc, setDoc, deleteDoc, deleteField, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Product, CartItem, Order, Review, ContactMessage, AppUser, TelegramConfig, Coupon, Category, Shipper } from './types';
import Header from './components/Header';
import Hero from './components/Hero';
import ProductCard from './components/ProductCard';
import ProductDetailModal from './components/ProductDetailModal';
import CartDrawer from './components/CartDrawer';
import WishlistDrawer from './components/WishlistDrawer';
import ProductCardSkeleton from './components/ProductCardSkeleton';
import NotFoundView from './components/NotFoundView';
import ShipperPortal from './components/ShipperPortal';
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
// LƯU Ý: chỉ tự động chuyển tới 'PREPARING' (đang chuẩn bị hàng trong kho).
// Từ 'PREPARING' -> 'DELIVERING' bắt buộc phải có SHIPPER THẬT tự nhận đơn qua Cổng Shipper,
// và từ 'DELIVERING' -> 'COMPLETED' bắt buộc shipper xác nhận đã giao thành công.
// Điều này đảm bảo trạng thái đơn hàng phản ánh đúng thực tế, không còn "giả lập" toàn bộ quy trình.
const ORDER_STATUS_FLOW: Order['orderStatus'][] = ['RECEIVED', 'PREPARING'];

// Thời gian dự kiến giao hàng hiển thị cho khách (tính từ lúc đặt đơn).
// Mặc định: 1 ngày sau khi đặt hàng. Có thể đổi thành số giờ/ngày khác tuỳ nhu cầu thực tế của shop.
const ESTIMATED_DELIVERY_MS = 24 * 60 * 60 * 1000; // 24 giờ

export default function App() {
  // Master state
  const [currentView, setCurrentView] = useState<'client' | 'admin' | 'shipper'>('client');
  const [activeSection, setActiveSection] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'under100k' | '100k-300k' | 'over300k'>('all');
  const [sortOrder, setSortOrder] = useState<'default' | 'price-asc' | 'price-desc' | 'best-selling'>('default');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState('');
  const [selectedNewsArticle, setSelectedNewsArticle] = useState<any | null>(null);
  const [showZaloQR, setShowZaloQR] = useState(false);

  // Admin and Routing states
  const [isAdminPath, setIsAdminPath] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return localStorage.getItem('isAdminAuthenticated') === 'true';
  });

  // ================= Đồng bộ tài khoản khách hàng real-time qua Firestore =================
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem('aura_current_user') || sessionStorage.getItem('aura_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [users, setUsers] = useState<AppUser[]>(() => {
    const saved = localStorage.getItem('aura_users_list');
    return saved ? JSON.parse(saved) : [];
  });

  // Cờ đánh dấu đã chạy xong bước "di dời dữ liệu cũ" (users từng chỉ lưu trên máy khách,
  // nay chuyển hẳn sang lưu tập trung trên Firestore) - chỉ chạy 1 lần lúc tải trang.
  const hasMigratedLocalUsers = React.useRef(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const firestoreUsers = snapshot.docs.map((d) => d.data() as AppUser);

        // Di dời 1 lần: nếu máy này có tài khoản cũ lưu trong localStorage mà CHƯA có trên
        // Firestore (VD: khách đăng ký trước khi có tính năng lưu tập trung), tự động đẩy
        // các tài khoản đó lên Firestore để không bị mất, rồi không cần lặp lại lần sau.
        if (!hasMigratedLocalUsers.current) {
          hasMigratedLocalUsers.current = true;
          const localSaved = localStorage.getItem('aura_users_list');
          const localUsers: AppUser[] = localSaved ? JSON.parse(localSaved) : [];
          const firestorePhones = new Set(firestoreUsers.map(u => u.phone));
          const missingUsers = localUsers.filter(u => u.phone && !firestorePhones.has(u.phone));
          if (missingUsers.length > 0) {
            missingUsers.forEach((u) => {
              setDoc(doc(db, 'users', u.phone), u, { merge: true }).catch((err) => {
                console.error('Lỗi di dời tài khoản khách hàng lên Firestore:', err);
              });
            });
            // Không cần setUsers ở đây - onSnapshot sẽ tự bắn lại sự kiện với dữ liệu đầy đủ
            // ngay sau khi các setDoc phía trên hoàn tất.
            return;
          }
        }

        setUsers(firestoreUsers);
        localStorage.setItem('aura_users_list', JSON.stringify(firestoreUsers));
      },
      (error) => {
        console.error('Lỗi lắng nghe tài khoản khách hàng từ Firestore:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  const syncUsers = (updater: AppUser[] | ((prev: AppUser[]) => AppUser[])) => {
    setUsers(prev => {
      const newUsers = typeof updater === 'function'
        ? (updater as (u: AppUser[]) => AppUser[])(prev)
        : updater;

      localStorage.setItem('aura_users_list', JSON.stringify(newUsers));
      newUsers.forEach((user) => {
        // Dùng số điện thoại làm ID tài liệu (đã là khóa duy nhất sẵn có trong toàn bộ logic
        // đăng ký/đăng nhập hiện tại, không cần đổi cấu trúc dữ liệu gì thêm).
        if (!user.phone) return;
        setDoc(doc(db, 'users', user.phone), user, { merge: true }).catch((err) => {
          console.error('Lỗi đồng bộ tài khoản khách hàng lên Firestore:', err);
        });
      });

      return newUsers;
    });
  };

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

    syncUsers(prev => [...prev.filter(u => u.phone !== phone), newUser]);

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

  // ================= Yêu thích (Wishlist) =================
  // Chỉ khách đã đăng nhập mới dùng được, danh sách lưu theo từng tài khoản (localStorage).
  const handleToggleWishlist = (productId: string) => {
    if (!currentUser) {
      setAuthModalMessage('Vui lòng đăng nhập để lưu sản phẩm vào danh sách yêu thích.');
      setIsAuthModalOpen(true);
      return;
    }

    const currentWishlist = currentUser.wishlist || [];
    const isWishlisted = currentWishlist.includes(productId);
    const newWishlist = isWishlisted
      ? currentWishlist.filter(id => id !== productId)
      : [...currentWishlist, productId];

    const updatedUser: AppUser = { ...currentUser, wishlist: newWishlist };
    setCurrentUser(updatedUser);

    if (localStorage.getItem('aura_current_user')) {
      localStorage.setItem('aura_current_user', JSON.stringify(updatedUser));
    } else {
      sessionStorage.setItem('aura_current_user', JSON.stringify(updatedUser));
    }

    syncUsers(prev => [...prev.filter(u => u.phone !== updatedUser.phone), updatedUser]);
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

  // ================= Đồng bộ ý kiến liên hệ real-time qua Firestore =================
  // TRƯỚC ĐÂY: contactMessages chỉ lưu trên máy khách (giống lỗi tài khoản khách hàng đã sửa
  // trước đó) - admin xem trên thiết bị khác sẽ KHÔNG thấy được ý kiến liên hệ của khách.
  // Nay chuyển sang lưu tập trung, đồng bộ real-time giống products/orders/reviews.
  useEffect(() => {
    const contactQuery = query(collection(db, 'contactMessages'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      contactQuery,
      (snapshot) => {
        const firestoreMessages = snapshot.docs.map((d) => d.data() as ContactMessage);
        setContactMessages(firestoreMessages);
        saveLocalData('contact_messages', firestoreMessages);
      },
      (error) => {
        console.error('Lỗi lắng nghe ý kiến liên hệ từ Firestore:', error);
      }
    );

    return () => unsubscribe();
  }, []);

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
  const [wishlistOpen, setWishlistOpen] = useState(false);
  // Mã giảm giá khách đã áp dụng trong giỏ hàng (được dùng thật khi đặt hàng)
  const [appliedCouponCode, setAppliedCouponCode] = useState('');
  const [appliedDiscountAmount, setAppliedDiscountAmount] = useState(0);
  const setAppliedCoupon = (code: string, amount: number) => {
    setAppliedCouponCode(code);
    setAppliedDiscountAmount(amount);
  };
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [productNotFound, setProductNotFound] = useState(false);
  // Hiện cảnh báo RÕ RÀNG trên màn hình nếu mất kết nối/lỗi đồng bộ Firestore, thay vì chỉ
  // âm thầm ghi log console (người dùng bình thường không mở DevTools để xem).
  const [firestoreSyncError, setFirestoreSyncError] = useState<string | null>(null);

  // ================= SEO: cập nhật tiêu đề/mô tả trang động theo sản phẩm đang xem =================
  // Vì đây là single-page app (không có URL/route riêng cho từng trang), tiêu đề và mô tả mặc định
  // trong index.html chỉ đúng cho trang chủ. Khi khách mở chi tiết 1 sản phẩm, ta cập nhật lại
  // document.title + meta description để: (1) link chia sẻ lên Zalo/Facebook hiện đúng tên sản phẩm
  // thay vì tên chung chung của cả shop, (2) Google (vốn có thực thi JavaScript khi thu thập dữ liệu)
  // đọc được nội dung sát với sản phẩm hơn. Khi đóng modal, tự trả về tiêu đề/mô tả mặc định ban đầu.
  const DEFAULT_PAGE_TITLE = 'EsyShop - Máy In Nhiệt & Thiết Bị Văn Phòng Chính Hãng';
  const DEFAULT_PAGE_DESCRIPTION = 'EsyShop chuyên bán máy in nhiệt, giấy in nhiệt, máy scan, máy chiếu mini và sổ tay văn phòng chính hãng. Giao hàng nhanh toàn quốc, giá tốt, bảo hành uy tín.';

  useEffect(() => {
    const metaDescriptionTag = document.querySelector('meta[name="description"]');
    const ogTitleTag = document.querySelector('meta[property="og:title"]');
    const ogDescriptionTag = document.querySelector('meta[property="og:description"]');

    if (selectedProduct) {
      const productTitle = `${selectedProduct.name} | EsyShop`;
      const productDescription = (selectedProduct.description || DEFAULT_PAGE_DESCRIPTION).slice(0, 160);

      document.title = productTitle;
      metaDescriptionTag?.setAttribute('content', productDescription);
      ogTitleTag?.setAttribute('content', productTitle);
      ogDescriptionTag?.setAttribute('content', productDescription);

      // Cập nhật URL để đường link có thể chia sẻ trực tiếp tới đúng sản phẩm này (không tải lại trang).
      const url = new URL(window.location.href);
      url.searchParams.set('product', selectedProduct.id);
      window.history.replaceState({}, '', url.toString());
    } else {
      document.title = DEFAULT_PAGE_TITLE;
      metaDescriptionTag?.setAttribute('content', DEFAULT_PAGE_DESCRIPTION);
      ogTitleTag?.setAttribute('content', DEFAULT_PAGE_TITLE);
      ogDescriptionTag?.setAttribute('content', DEFAULT_PAGE_DESCRIPTION);

      // Chỉ xóa param "product" khỏi URL, giữ nguyên các param khác nếu có.
      const url = new URL(window.location.href);
      if (url.searchParams.has('product')) {
        url.searchParams.delete('product');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [selectedProduct]);

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
  } else {
    // Link chia sẻ trỏ tới sản phẩm không tồn tại (đã bị xóa hoặc sai đường dẫn) -> hiện trang báo lỗi.
    setProductNotFound(true);
  }

}

    setReviews(getReviews());
    setOrders(getOrders());
    setContactMessages(getContactMessages());

    // Tắt trạng thái loading ban đầu sau khi đã có dữ liệu để tránh giao diện "giật"
    // (Firestore real-time vẫn tiếp tục đồng bộ ngầm phía sau qua onSnapshot).
    setTimeout(() => setIsInitialLoading(false), 400);

    const checkPath = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      const isAdmin = path.includes('/admin') || hash === '#admin';
      const isShipper = path.includes('/shipper') || hash === '#shipper';
      setIsAdminPath(isAdmin);
      if (isAdmin) {
        setCurrentView('admin');
      } else if (isShipper) {
        setCurrentView('shipper');
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
        setFirestoreSyncError(null);
      },
      (error) => {
        console.error('Lỗi lắng nghe đơn hàng từ Firestore:', error);
        setFirestoreSyncError('Không thể đồng bộ dữ liệu đơn hàng (mất kết nối hoặc lỗi máy chủ). Vui lòng kiểm tra mạng và tải lại trang.');
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

  // ================= Đồng bộ danh mục real-time qua Firestore =================
  const [categories, setCategories] = useState<Category[]>(CATEGORIES.filter(c => c.id !== 'all'));
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'categories'),
      (snapshot) => {
        if (snapshot.empty) {
          // Lần đầu chạy chưa có danh mục nào trên Firestore -> khởi tạo từ danh mục mặc định có sẵn.
          CATEGORIES.filter(c => c.id !== 'all').forEach((cat) => {
            setDoc(doc(db, 'categories', cat.id), cat, { merge: true }).catch((err) => {
              console.error('Lỗi khởi tạo danh mục mặc định lên Firestore:', err);
            });
          });
          return;
        }
        const firestoreCategories = snapshot.docs.map((d) => d.data() as Category);
        setCategories(firestoreCategories);
        saveLocalData('categories', firestoreCategories);
      },
      (error) => {
        console.error('Lỗi lắng nghe danh mục từ Firestore:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  const syncCategories = (updater: Category[] | ((prev: Category[]) => Category[])) => {
    setCategories(prev => {
      const newCategories = typeof updater === 'function'
        ? (updater as (c: Category[]) => Category[])(prev)
        : updater;

      saveLocalData('categories', newCategories);
      newCategories.forEach((category) => {
        setDoc(doc(db, 'categories', category.id), category, { merge: true }).catch((err) => {
          console.error('Lỗi đồng bộ danh mục lên Firestore:', err);
        });
      });

      return newCategories;
    });
  };

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || `cat_${Date.now()}`;

  const handleAddCategory = (name: string, icon: string) => {
    const id = slugify(name);
    if (categories.some(c => c.id === id)) {
      window.alert('Danh mục này (hoặc tên tương tự) đã tồn tại rồi.');
      return;
    }
    const newCategory: Category = { id, name: name.trim(), icon };
    syncCategories(prev => [...prev, newCategory]);
  };

  const handleUpdateCategory = (updatedCategory: Category) => {
    syncCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
  };

  const handleDeleteCategory = (categoryId: string) => {
    const productsUsingCategory = products.filter(p => p.category === categoryId).length;
    if (productsUsingCategory > 0) {
      window.alert(`Không thể xóa danh mục này vì đang có ${productsUsingCategory} sản phẩm thuộc danh mục này. Vui lòng chuyển các sản phẩm đó sang danh mục khác trước.`);
      return;
    }
    syncCategories(prev => prev.filter(c => c.id !== categoryId));
    deleteDoc(doc(db, 'categories', categoryId)).catch((err) => {
      console.error('Lỗi xóa danh mục trên Firestore:', err);
    });
  };


  const [coupons, setCoupons] = useState<Coupon[]>([]);
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'coupons'),
      (snapshot) => {
        const firestoreCoupons = snapshot.docs.map((d) => d.data() as Coupon);
        setCoupons(firestoreCoupons);
        saveLocalData('coupons', firestoreCoupons);
      },
      (error) => {
        console.error('Lỗi lắng nghe mã giảm giá từ Firestore:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  const syncCoupons = (updater: Coupon[] | ((prev: Coupon[]) => Coupon[])) => {
    setCoupons(prev => {
      const newCoupons = typeof updater === 'function'
        ? (updater as (c: Coupon[]) => Coupon[])(prev)
        : updater;

      saveLocalData('coupons', newCoupons);
      newCoupons.forEach((coupon) => {
        setDoc(doc(db, 'coupons', coupon.id), coupon, { merge: true }).catch((err) => {
          console.error('Lỗi đồng bộ mã giảm giá lên Firestore:', err);
        });
      });

      return newCoupons;
    });
  };

  const handleAddCoupon = (newCoupon: Omit<Coupon, 'id' | 'usedCount' | 'createdAt'>) => {
    const coupon: Coupon = {
      ...newCoupon,
      code: newCoupon.code.trim().toUpperCase(),
      id: newCoupon.code.trim().toUpperCase(),
      usedCount: 0,
      createdAt: new Date().toISOString()
    };
    syncCoupons(prev => [...prev.filter(c => c.id !== coupon.id), coupon]);
  };

  const handleUpdateCoupon = (updatedCoupon: Coupon) => {
    syncCoupons(prev => prev.map(c => c.id === updatedCoupon.id ? updatedCoupon : c));
  };

  const handleDeleteCoupon = (couponId: string) => {
    syncCoupons(prev => prev.filter(c => c.id !== couponId));
    deleteDoc(doc(db, 'coupons', couponId)).catch((err) => {
      console.error('Lỗi xóa mã giảm giá trên Firestore:', err);
    });
  };


  // ================= Cổng Shipper: đăng ký khu vực nhận đơn =================
  // Mỗi shipper tự đăng ký (các) khu vực mình chạy giao hàng (VD: "Quận 1, Bình Thạnh").
  // Hồ sơ này lưu trên Firestore (collection 'shippers', id = SĐT) để khi shipper đăng nhập lại
  // trên máy/trình duyệt khác (hoặc xoá localStorage), khu vực đã đăng ký vẫn còn nguyên -
  // không cần đăng ký lại từ đầu.
  const [shippers, setShippers] = useState<Shipper[]>([]);
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'shippers'),
      (snapshot) => {
        setShippers(snapshot.docs.map((d) => d.data() as Shipper));
      },
      (error) => {
        console.error('Lỗi lắng nghe danh sách shipper từ Firestore:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleSaveShipperAreas = (phone: string, name: string, areas: string[]) => {
    const existing = shippers.find(s => s.phone === phone);
    const shipper: Shipper = {
      phone,
      name,
      areas,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setShippers(prev => [...prev.filter(s => s.phone !== phone), shipper]);
    setDoc(doc(db, 'shippers', phone), shipper, { merge: true }).catch((err) => {
      console.error('Lỗi đồng bộ khu vực shipper lên Firestore:', err);
    });
  };

  // Admin gỡ một shipper khỏi hệ thống (VD: shipper nghỉ việc) - không ảnh hưởng các đơn
  // hàng đã/đang giao trước đó, chỉ đơn giản là xoá hồ sơ khu vực để họ không nhận đơn mới nữa
  // qua Cổng Shipper (nếu vẫn tự đăng nhập lại, hệ thống sẽ coi như đăng ký khu vực mới).
  const handleDeleteShipper = (phone: string) => {
    setShippers(prev => prev.filter(s => s.phone !== phone));
    deleteDoc(doc(db, 'shippers', phone)).catch((err) => {
      console.error('Lỗi xoá shipper trên Firestore:', err);
    });
  };

  // Hỗ trợ truyền vào mảng sản phẩm mới HOẶC một hàm cập nhật (updater) nhận state mới nhất.
  // Dùng dạng hàm cho MỌI thao tác liên quan tới tồn kho/soldCount để tránh "mất cập nhật"
  // khi có nhiều thao tác xảy ra gần nhau (đặt hàng, tự động chuyển trạng thái đơn, hủy đơn...).
  const syncProducts = (updater: Product[] | ((prev: Product[]) => Product[])) => {
    setProducts(prev => {
      const newProducts = typeof updater === 'function'
        ? (updater as (p: Product[]) => Product[])(prev)
        : updater;

      saveLocalData('products', newProducts);
      newProducts.forEach((product) => {
        setDoc(doc(db, 'products', product.id), product, { merge: true }).catch((err) => {
          console.error('Lỗi đồng bộ sản phẩm lên Firestore:', err);
        });
      });

      return newProducts;
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

  const syncOrders = (updater: Order[] | ((prev: Order[]) => Order[])) => {
    setOrders(prev => {
      const newOrders = typeof updater === 'function'
        ? (updater as (o: Order[]) => Order[])(prev)
        : updater;

      saveLocalData('orders', newOrders);
      // Ghi từng đơn hàng lên Firestore để đồng bộ real-time giữa mọi thiết bị.
      // (onSnapshot ở trên sẽ tự động cập nhật lại state khi ghi thành công)
      newOrders.forEach((order) => {
        // QUAN TRỌNG: vì Firestore đang bật ignoreUndefinedProperties (để tránh crash khi field
        // trống - xem firebase.ts), các trường có giá trị "undefined" sẽ bị ÂM THẦM BỎ QUA khi
        // ghi thay vì bị xóa - nghĩa là setDoc({..., shipperName: undefined}, {merge:true}) sẽ
        // KHÔNG xóa được shipperName cũ trên Firestore. Phải chuyển undefined -> deleteField()
        // để yêu cầu Firestore THỰC SỰ xóa trường đó.
        const payload: Record<string, unknown> = { ...order };
        Object.keys(payload).forEach((key) => {
          if (payload[key] === undefined) {
            payload[key] = deleteField();
          }
        });
        setDoc(doc(db, 'orders', order.id), payload, { merge: true }).catch((err) => {
          console.error('Lỗi đồng bộ đơn hàng lên Firestore:', err);
        });
      });

      return newOrders;
    });
  };

  const syncContactMessages = (updater: ContactMessage[] | ((prev: ContactMessage[]) => ContactMessage[])) => {
    setContactMessages(prev => {
      const newMessages = typeof updater === 'function'
        ? (updater as (m: ContactMessage[]) => ContactMessage[])(prev)
        : updater;

      saveLocalData('contact_messages', newMessages);
      newMessages.forEach((msg) => {
        setDoc(doc(db, 'contactMessages', msg.id), msg, { merge: true }).catch((err) => {
          console.error('Lỗi đồng bộ ý kiến liên hệ lên Firestore:', err);
        });
      });

      return newMessages;
    });
  };

  // Câu trả lời mặc định dùng chung cho MỌI đánh giá sản phẩm và ý kiến liên hệ mới - gửi tự
  // động ngay khi khách gửi, admin không cần thao tác gì thêm. Nếu sau này muốn đổi nội dung
  // trả lời tự động, chỉ cần sửa đúng 1 chỗ này.
  const AUTO_REPLY_MESSAGE = 'Cảm ơn quý khách đã dành thời gian đánh giá sản phẩm và dịch vụ của EasyShop. Shop luôn trân trọng mọi phản hồi và sẽ không ngừng cải thiện để mang đến trải nghiệm mua sắm tốt hơn.';

  const handleAddContactMessage = (name: string, email: string, message: string) => {
    const newMessage: ContactMessage = {
      id: `msg-${Date.now()}`,
      name,
      email,
      message,
      createdAt: new Date().toISOString(),
      // Tự động trả lời + đánh dấu đã xử lý ngay lúc gửi - admin không cần bấm duyệt/trả lời tay.
      status: 'READ',
      reply: AUTO_REPLY_MESSAGE
    };
    syncContactMessages(prev => [...prev, newMessage]);
  };

  const handleUpdateContactStatus = (contactId: string, status: 'PENDING' | 'READ') => {
    syncContactMessages(prev => prev.map(msg =>
      msg.id === contactId ? { ...msg, status } : msg
    ));
  };

  const handleDeleteContactMessage = (contactId: string) => {
    syncContactMessages(prev => prev.filter(msg => msg.id !== contactId));
    deleteDoc(doc(db, 'contactMessages', contactId)).catch((err) => {
      console.error('Lỗi xóa ý kiến liên hệ trên Firestore:', err);
    });
  };

  // Cart Management
  const handleAddToCart = (product: Product, quantity: number = 1) => {
    if (!currentUser) {
      setAuthModalMessage('Vui lòng đăng nhập hoặc đăng ký tài khoản thành viên để thêm sản phẩm vào giỏ hàng.');
      setIsAuthModalOpen(true);
      return;
    }

    const liveProduct = products.find(p => p.id === product.id) || product;
    const availableStock = liveProduct.stock ?? 0;

    if (availableStock <= 0) {
      window.alert('Rất tiếc, sản phẩm này hiện đã hết hàng trong kho.');
      return;
    }

    setCartItems(prev => {
      const existingIdx = prev.findIndex(item => item.product.id === product.id);
      const currentQtyInCart = existingIdx > -1 ? prev[existingIdx].quantity : 0;
      const allowedToAdd = Math.max(0, availableStock - currentQtyInCart);

      if (allowedToAdd <= 0) {
        window.alert(`Bạn chỉ có thể đặt tối đa ${availableStock} sản phẩm này (đã có ${currentQtyInCart} trong giỏ hàng).`);
        return prev;
      }

      const quantityToAdd = Math.min(quantity, allowedToAdd);
      if (quantityToAdd < quantity) {
        window.alert(`Kho chỉ còn ${availableStock} sản phẩm, hệ thống đã tự điều chỉnh số lượng thêm vào giỏ hàng cho phù hợp.`);
      }

      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += quantityToAdd;
        return updated;
      }
      return [...prev, { product: liveProduct, quantity: quantityToAdd }];
    });
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    const liveProduct = products.find(p => p.id === productId);
    const availableStock = liveProduct?.stock ?? 0;
    const cappedQuantity = Math.max(1, Math.min(quantity, availableStock > 0 ? availableStock : quantity));

    setCartItems(prev => prev.map(item =>
      item.product.id === productId ? { ...item, quantity: cappedQuantity } : item
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

    const liveProduct = products.find(p => p.id === product.id) || product;
    const availableStock = liveProduct.stock ?? 0;

    if (availableStock <= 0) {
      window.alert('Rất tiếc, sản phẩm này hiện đã hết hàng trong kho.');
      return;
    }

    const cappedQuantity = Math.min(quantity, availableStock);
    if (cappedQuantity < quantity) {
      window.alert(`Kho chỉ còn ${availableStock} sản phẩm, hệ thống đã tự điều chỉnh số lượng đặt hàng cho phù hợp.`);
    }

    // Clear cart or add item & proceed instantly
    setCartItems([{ product: liveProduct, quantity: cappedQuantity }]);
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
  pointsUsed?: number;
}) => {
    // ================= Kiểm tra tồn kho trước khi cho đặt hàng =================
    // Lấy dữ liệu tồn kho MỚI NHẤT từ state `products` (không dùng bản cache trong giỏ hàng),
    // để tránh trường hợp tồn kho đã thay đổi sau khi khách thêm vào giỏ.
    const insufficientItems = cartItems
      .map(item => {
        const liveProduct = products.find(p => p.id === item.product.id);
        const availableStock = liveProduct?.stock ?? 0;
        return { item, availableStock };
      })
      .filter(({ item, availableStock }) => item.quantity > availableStock);

    if (insufficientItems.length > 0) {
      const message = insufficientItems
        .map(({ item, availableStock }) =>
          `- ${item.product.name}: chỉ còn ${availableStock} sản phẩm trong kho (bạn đang đặt ${item.quantity})`
        )
        .join('\n');
      window.alert(`Rất tiếc, một số sản phẩm trong giỏ hàng không đủ số lượng tồn kho:\n\n${message}\n\nVui lòng điều chỉnh lại số lượng trước khi đặt hàng.`);
      return;
    }

    const orderSubtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const shippingFee = orderSubtotal > 150000 ? 0 : 15000;

    // ================= Ưu đãi thành viên VIP: giảm CỐ ĐỊNH 5.000đ mỗi sản phẩm =================
    // Áp dụng khi khách ĐÃ là thành viên VIP, hoặc đang đăng ký làm thành viên VIP ngay
    // trong đơn này (isMemberRegistrationRequested). Phải khớp CHÍNH XÁC với logic hiển thị
    // ở CheckoutModal.tsx (willBeVipMember) để số tiền hiển thị lúc thanh toán và số tiền
    // thực tế lưu vào đơn hàng luôn trùng khớp nhau.
    const willBeVipMember = !!(currentUser?.isMember || (!currentUser && customerData.isMemberRegistrationRequested));
    const totalItemQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const vipDiscountAmount = willBeVipMember ? Math.min(orderSubtotal, totalItemQuantity * 5000) : 0;

    // ================= Dùng điểm tích lũy để giảm giá =================
    // Kiểm tra lại NGAY LÚC ĐẶT HÀNG (không tin tưởng hoàn toàn số điểm đã tính ở CheckoutModal,
    // đề phòng dữ liệu điểm đã thay đổi trong lúc khách điền thông tin) - giới hạn không vượt quá
    // số điểm khách ĐANG THỰC SỰ CÓ, và không vượt quá phần còn lại phải trả sau ưu đãi VIP.
    const requestedPointsUsed = Math.max(0, customerData.pointsUsed || 0);
    const availablePoints = currentUser?.memberPoints || 0;
    const remainingAfterVip = Math.max(0, orderSubtotal - vipDiscountAmount);
    const maxUsablePoints = Math.min(availablePoints, Math.floor(remainingAfterVip / 10));
    const actualPointsUsed = Math.min(requestedPointsUsed, maxUsablePoints);
    const pointsDiscountAmount = actualPointsUsed * 10;

    // ================= Kiểm tra lại mã giảm giá (nếu có) ngay trước khi đặt hàng =================
    // Đề phòng mã đã bị admin tắt/xóa/hết lượt trong lúc khách đang điền thông tin thanh toán.
    let finalDiscountAmount = 0;
    let finalCouponCode = '';
    if (appliedCouponCode) {
      const liveCoupon = coupons.find(c => c.id === appliedCouponCode);
      const stillValid = liveCoupon
        && liveCoupon.isActive
        && (!liveCoupon.expiresAt || new Date(liveCoupon.expiresAt).getTime() >= Date.now())
        && (!liveCoupon.usageLimit || liveCoupon.usedCount < liveCoupon.usageLimit)
        && (!liveCoupon.minOrderValue || orderSubtotal >= liveCoupon.minOrderValue);

      if (stillValid && liveCoupon) {
        finalCouponCode = liveCoupon.id;
        finalDiscountAmount = liveCoupon.discountType === 'percent'
          ? Math.round((orderSubtotal * liveCoupon.value) / 100)
          : liveCoupon.value;
        if (liveCoupon.maxDiscountAmount) {
          finalDiscountAmount = Math.min(finalDiscountAmount, liveCoupon.maxDiscountAmount);
        }
        finalDiscountAmount = Math.min(finalDiscountAmount, orderSubtotal);
      } else {
        window.alert('Rất tiếc, mã giảm giá bạn áp dụng không còn hiệu lực. Đơn hàng sẽ được tính theo giá gốc, vui lòng kiểm tra lại trước khi xác nhận.');
      }
    }

    const orderTotal = Math.max(0, orderSubtotal - vipDiscountAmount - pointsDiscountAmount + shippingFee - finalDiscountAmount);

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
  estimatedDeliveryAt: new Date(Date.now() + ESTIMATED_DELIVERY_MS).toISOString(),
  stockDeducted: true,
  couponCode: finalCouponCode || undefined,
  discountAmount: finalDiscountAmount || undefined,
  vipDiscountAmount: vipDiscountAmount || undefined,
  pointsUsed: actualPointsUsed || undefined
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
syncOrders(prev => [newOrder, ...prev]);

    // Lưu ý: soldCount (số lượng đã bán) KHÔNG tăng ở đây nữa.
    // Nó chỉ tăng khi admin cập nhật trạng thái đơn hàng thành "Đã giao thành công"
    // (xem handleUpdateOrderStatus) để phản ánh đúng số lượng đã bán thực tế.

    // ================= Trừ tồn kho ngay khi đặt hàng =================
    // Tồn kho được "giữ chỗ" (trừ) ngay khi đơn được tạo, để tránh trường hợp
    // nhiều khách cùng đặt vượt quá số lượng thực tế còn trong kho.
    // Nếu đơn sau đó bị hủy hoặc bị xóa, tồn kho sẽ được hoàn lại tương ứng
    // (xem handleUpdateOrderStatus / handleDeleteOrder).
    const updatedProductsStock = (prevProducts: Product[]) => prevProducts.map(p => {
      const orderItem = newOrder.items.find(item => item.productId === p.id);
      if (orderItem) {
        return { ...p, stock: Math.max(0, (p.stock ?? 0) - orderItem.quantity) };
      }
      return p;
    });
    syncProducts(updatedProductsStock);

    // ================= Cập nhật lượt đã dùng của mã giảm giá (nếu có áp dụng) =================
    if (finalCouponCode) {
      syncCoupons(prev => prev.map(c =>
        c.id === finalCouponCode ? { ...c, usedCount: c.usedCount + 1 } : c
      ));
    }

    // Xoá mã giảm giá đã áp dụng khỏi giỏ hàng sau khi đặt hàng thành công
    setAppliedCouponCode('');
    setAppliedDiscountAmount(0);

    // Points earned: 1 điểm cho mỗi 1.000đ chi tiêu (100 điểm = quy đổi 1.000đ, tức 1 điểm = 10đ)
    const pointsEarned = Math.floor(orderTotal / 1000);

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
          memberPoints: Math.max(0, existing.memberPoints + pointsEarned - actualPointsUsed)
        };
      } else {
        targetUser = {
          name: customerData.customerName,
          email: customerData.customerEmail,
          phone: customerData.customerPhone,
          address: customerData.customerAddress,
          isMember: true,
          memberCardNo: `AURA-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
          memberPoints: Math.max(0, 100 + pointsEarned - actualPointsUsed), // 100 welcome points + order points - điểm đã dùng
          createdAt: new Date().toISOString()
        };
      }
    } else if (currentUser && currentUser.phone === customerData.customerPhone) {
      targetUser = {
        ...currentUser,
        // Luôn cập nhật địa chỉ theo đúng địa chỉ khách vừa nhập lúc thanh toán - đây là địa chỉ
        // mới nhất và chính xác nhất, trước đây bị bỏ sót không lưu lại gây ra tình trạng cột
        // "Địa chỉ" trong trang Khách hàng luôn trống dù khách đã đặt hàng nhiều lần.
        address: customerData.customerAddress,
        memberPoints: Math.max(0, currentUser.memberPoints + pointsEarned - actualPointsUsed)
      };
    }

    if (targetUser) {
      setCurrentUser(targetUser);
      localStorage.setItem('aura_current_user', JSON.stringify(targetUser));

      syncUsers(prev => [...prev.filter(u => u.phone !== targetUser.phone), targetUser]);
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
      // Tự động duyệt + trả lời ngay lúc khách gửi đánh giá - admin không cần bấm duyệt/trả lời tay.
      status: 'APPROVED',
      reply: AUTO_REPLY_MESSAGE
    };

    const updatedReviews = [newReview, ...reviews];
    syncReviews(updatedReviews);

    // Recalculate average rating of target product (all except HIDDEN)
    const productReviews = updatedReviews.filter(r => r.productId === productId && r.status !== 'HIDDEN');
    const avgRating = productReviews.length > 0 
      ? Number((productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length).toFixed(1))
      : 0;

    const updatedProducts = (prevProducts: Product[]) => prevProducts.map(p => {
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

      const updatedProducts = (prevProducts: Product[]) => prevProducts.map(p => {
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
    syncProducts(prev => [...prev, addedProduct]);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    syncProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const handleDeleteProduct = (productId: string) => {
    syncProducts(prev => prev.filter(p => p.id !== productId));
    deleteDoc(doc(db, 'products', productId)).catch((err) => {
      console.error('Lỗi xóa sản phẩm trên Firestore:', err);
    });
  };

const handleUpdateOrderStatus = (
  orderId: string,
  status: Order['orderStatus'],
  paymentStatus?: Order['paymentStatus'],
  // Cho phép cập nhật thêm các trường khác (VD: tên/SĐT shipper) TRONG CÙNG một lần ghi
  // duy nhất, để tránh race-condition giữa 2 lần ghi Firestore tách rời (xem handleClaimOrder).
  extraFields?: Partial<Order>
) => {

  const previousOrder = orders.find(o => o.id === orderId);

  // Chốt bảo vệ cuối cùng: nếu đơn ĐÃ ở đúng trạng thái này rồi (và không có gì mới để cập
  // nhật thêm) thì bỏ qua luôn, không ghi lại - tránh gửi email trùng lặp dù lệnh gọi đến
  // từ bất kỳ nguồn nào (tự động, admin bấm tay, hay shipper) bị gọi trùng nhau.
  if (previousOrder && previousOrder.orderStatus === status && !extraFields) {
    return;
  }

  syncOrders(prev => prev.map(o => {
    if (o.id === orderId) {
      let stockDeducted = o.stockDeducted;
      // Khi đơn chuyển sang HỦY: nếu tồn kho đã từng bị trừ, đánh dấu là đã hoàn (false)
      // để tránh hoàn kho 2 lần nếu trạng thái bị đổi qua lại nhiều lần.
      if (status === 'CANCELLED' && o.orderStatus !== 'CANCELLED' && o.stockDeducted) {
        stockDeducted = false;
      } else if (o.orderStatus === 'CANCELLED' && status !== 'CANCELLED' && !o.stockDeducted) {
        // Đơn đã hủy được mở lại -> tồn kho sẽ bị trừ lại, đánh dấu lại là true
        stockDeducted = true;
      }
      return {
        ...o,
        ...extraFields,
        orderStatus: status,
        paymentStatus: paymentStatus || o.paymentStatus,
        stockDeducted
      };
    }
    return o;
  }));

  // ================= Cập nhật soldCount (số lượng đã bán) =================
  // Chỉ tính là "đã bán" khi đơn được xác nhận GIAO HÀNG THÀNH CÔNG.
  // Nếu admin lỡ đổi từ COMPLETED sang trạng thái khác, số đã bán sẽ giảm lại tương ứng.
  if (previousOrder && previousOrder.orderStatus !== status) {
    const wasCompleted = previousOrder.orderStatus === 'COMPLETED';
    const isNowCompleted = status === 'COMPLETED';

    if (!wasCompleted && isNowCompleted) {
      const updatedProducts = (prevProducts: Product[]) => prevProducts.map(p => {
        const orderItem = previousOrder.items.find(item => item.productId === p.id);
        if (orderItem) {
          return { ...p, soldCount: p.soldCount + orderItem.quantity };
        }
        return p;
      });
      syncProducts(updatedProducts);
    } else if (wasCompleted && !isNowCompleted) {
      const updatedProducts = (prevProducts: Product[]) => prevProducts.map(p => {
        const orderItem = previousOrder.items.find(item => item.productId === p.id);
        if (orderItem) {
          return { ...p, soldCount: Math.max(0, p.soldCount - orderItem.quantity) };
        }
        return p;
      });
      syncProducts(updatedProducts);
    }
  }

  // ================= Hoàn lại tồn kho khi đơn hàng bị HỦY =================
  // Tồn kho đã được trừ ngay lúc đặt hàng (xem handlePlaceOrder). Nếu đơn bị hủy,
  // số lượng đó cần được cộng trả lại vào kho vì thực tế không có ai lấy hàng nữa.
  // CHỈ áp dụng cho đơn có cờ stockDeducted = true (đơn thực sự đã từng bị trừ kho) -
  // để tránh hoàn nhầm tồn kho cho các đơn hàng cũ tạo trước khi có tính năng quản lý tồn kho.
  if (previousOrder && previousOrder.orderStatus !== status) {
    const wasCancelled = previousOrder.orderStatus === 'CANCELLED';
    const isNowCancelled = status === 'CANCELLED';

    if (!wasCancelled && isNowCancelled && previousOrder.stockDeducted) {
      const updatedProducts = (prevProducts: Product[]) => prevProducts.map(p => {
        const orderItem = previousOrder.items.find(item => item.productId === p.id);
        if (orderItem) {
          return { ...p, stock: (p.stock ?? 0) + orderItem.quantity };
        }
        return p;
      });
      syncProducts(updatedProducts);
    } else if (wasCancelled && !isNowCancelled && !previousOrder.stockDeducted) {
      // Trường hợp hiếm: đơn đã hủy bị mở lại -> trừ tồn kho lại như lúc đặt hàng
      const updatedProducts = (prevProducts: Product[]) => prevProducts.map(p => {
        const orderItem = previousOrder.items.find(item => item.productId === p.id);
        if (orderItem) {
          return { ...p, stock: Math.max(0, (p.stock ?? 0) - orderItem.quantity) };
        }
        return p;
      });
      syncProducts(updatedProducts);
    }

    // Hoàn lại lượt sử dụng mã giảm giá nếu đơn có áp dụng mã và bị hủy
    if (previousOrder.couponCode) {
      if (!wasCancelled && isNowCancelled) {
        syncCoupons(prev => prev.map(c =>
          c.id === previousOrder.couponCode ? { ...c, usedCount: Math.max(0, c.usedCount - 1) } : c
        ));
      } else if (wasCancelled && !isNowCancelled) {
        syncCoupons(prev => prev.map(c =>
          c.id === previousOrder.couponCode ? { ...c, usedCount: c.usedCount + 1 } : c
        ));
      }
    }
  }

  const order = previousOrder ? { ...previousOrder, orderStatus: status, paymentStatus: paymentStatus || previousOrder.paymentStatus } : undefined;

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

// ================= Cổng Shipper: tự nhận đơn & giao hàng =================
// Shipper chỉ được nhận các đơn đang ở trạng thái "PREPARING" (đã chuẩn bị xong, sẵn sàng giao)
// và CHƯA có shipper nào khác nhận. Sau khi nhận, đơn chuyển sang "DELIVERING" và gắn tên/SĐT
// shipper vào đơn để admin + khách hàng đều biết ai đang giao.
const handleClaimOrder = (orderId: string, shipperName: string, shipperPhone: string) => {
  const target = orders.find(o => o.id === orderId);
  if (!target) return;
  if (target.orderStatus !== 'PREPARING') {
    window.alert('Đơn này không còn sẵn sàng để nhận nữa (có thể đã được shipper khác nhận trước).');
    return;
  }

  // Gắn tên/SĐT shipper VÀ đổi trạng thái trong CÙNG một lần ghi duy nhất (atomic),
  // tránh race-condition giữa 2 lần ghi Firestore tách rời.
  handleUpdateOrderStatus(orderId, 'DELIVERING', undefined, { shipperName, shipperPhone });
};

// Shipper xác nhận đã giao hàng thành công -> đơn chuyển "COMPLETED", tái sử dụng toàn bộ
// logic có sẵn của handleUpdateOrderStatus (cộng soldCount, gửi email, trừ điểm thành viên...).
const handleShipperCompleteDelivery = (orderId: string) => {
  handleUpdateOrderStatus(orderId, 'COMPLETED', 'PAID');
};

// Shipper trả lại đơn (bận đột xuất, xe hỏng...) -> đơn quay về pool "PREPARING" cho
// shipper khác nhận, đồng thời gỡ tên shipper cũ ra khỏi đơn (trong cùng 1 lần ghi).
const handleReleaseOrder = (orderId: string) => {
  handleUpdateOrderStatus(orderId, 'PREPARING', undefined, { shipperName: undefined, shipperPhone: undefined });
};

// ================= Tự động xử lý đơn hàng theo thời gian =================
// Đơn mới sẽ tự động chuyển từ "Chờ xác nhận" -> "Đang chuẩn bị hàng" sau một khoảng thời gian,
// mô phỏng việc kho xác nhận và soạn hàng. Từ bước này trở đi, đơn hàng cần một SHIPPER THẬT
// tự nhận đơn (qua Cổng Shipper) để chuyển sang "Đang giao", và shipper xác nhận đã giao để
// chuyển sang "Hoàn thành" - không còn tự động giả lập những bước có người thật tham gia nữa.
// Trang "Đơn hàng" của khách (UserAuthModal) đang lắng nghe cùng dữ liệu
// `orders` real-time qua Firestore, nên sẽ tự cập nhật ngay khi trạng thái thay đổi ở đây -
// không cần khách bấm F5. Nút bấm thủ công trong AdminPortal vẫn hoạt động bình thường,
// nhân viên có thể xử lý tay hoặc ghi đè bất cứ lúc nào (ví dụ giao gấp, xử lý ngoại lệ...).
//
// QUAN TRỌNG - sửa lỗi gửi email trùng lặp: bộ đếm này luôn đọc dữ liệu đơn hàng MỚI NHẤT
// qua `ordersRef` (thay vì dùng trực tiếp biến `orders` từ closure của useEffect, vốn có thể
// bị "cũ" tới 2 giây do interval không đồng bộ ngay với mỗi lần state thay đổi). Nếu không,
// khi admin bấm "Xác nhận đơn hàng" thủ công đúng lúc bộ đếm cũng vừa tới hạn 10 giây, cả 2
// nơi có thể cùng gọi chuyển trạng thái cho CÙNG một đơn -> gửi email xác nhận 2 lần.
const ordersRef = React.useRef<Order[]>(orders);
useEffect(() => {
  ordersRef.current = orders;
}, [orders]);

useEffect(() => {
  const timer = setInterval(() => {
    ordersRef.current.forEach((order) => {
      // Bỏ qua đơn đã huỷ, đã hoàn thành, HOẶC đã sang "Đang giao" (do shipper thật đảm nhiệm) -
      // không có gì để tự động thêm nữa. ĐÂY LÀ CHỖ SỬA LỖI QUAN TRỌNG: trước đây chỉ loại trừ
      // CANCELLED/COMPLETED, còn DELIVERING thì KHÔNG bị loại trừ. Vì ORDER_STATUS_FLOW chỉ có
      // 2 phần tử ['RECEIVED','PREPARING'], nên .indexOf('DELIVERING') trả về -1 (không tìm
      // thấy) -> hệ thống hiểu lầm là đơn "chưa tới bước nào cả" và tự động ép ngược lại về
      // PREPARING, xoá mất trạng thái "Đang giao" mà shipper vừa nhận! Đây chính là nguyên nhân
      // khiến đơn bị "tụt" lại sau khi shipper bấm nhận đơn.
      if (
        order.orderStatus === 'CANCELLED' ||
        order.orderStatus === 'COMPLETED' ||
        order.orderStatus === 'DELIVERING'
      ) return;

      const elapsedMs = Date.now() - new Date(order.createdAt).getTime();
      const expectedStepIdx = Math.min(
        ORDER_STATUS_FLOW.length - 1,
        Math.floor(elapsedMs / AUTO_STEP_INTERVAL_MS)
      );
      const currentStepIdx = ORDER_STATUS_FLOW.indexOf(order.orderStatus);
      const expectedStatus = ORDER_STATUS_FLOW[expectedStepIdx];

      // Chỉ tự động ĐI TỚI (không bao giờ lùi lại) - nếu nhân viên đã xử lý
      // nhanh hơn hoặc đơn đã ở bước sau, hệ thống sẽ không đụng vào.
      // Đồng thời chặn luôn trường hợp currentStepIdx = -1 (trạng thái không nằm trong
      // ORDER_STATUS_FLOW) để tránh lặp lại chính xác lỗi vừa mô tả ở trên cho bất kỳ
      // trạng thái nào khác có thể phát sinh sau này.
      if (currentStepIdx !== -1 && expectedStepIdx > currentStepIdx) {
        handleUpdateOrderStatus(
          order.id,
          expectedStatus,
          expectedStatus === 'COMPLETED' ? 'PAID' : undefined
        );
      }
    });
  }, 2000); // kiểm tra mỗi 2 giây

  return () => clearInterval(timer);
  // Không cần phụ thuộc [orders] nữa vì đã đọc qua ordersRef.current (luôn mới nhất) -
  // giúp bộ đếm chỉ được tạo DUY NHẤT 1 LẦN, không bị hủy/tạo lại liên tục mỗi khi có
  // đơn hàng thay đổi (hiệu quả hơn và loại bỏ hoàn toàn nguồn gốc gây trùng lặp).
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

// ================= Xóa đơn hàng =================
const handleDeleteOrder = (orderId: string) => {

  const confirmDelete = window.confirm(
    "Bạn có chắc muốn xóa đơn hàng này không?"
  );

  if (!confirmDelete) return;

  const orderToDelete = orders.find(o => o.id === orderId);

  syncOrders(prev => prev.filter(o => o.id !== orderId));

  // Nếu đơn bị xóa đã từng được tính "Đã giao thành công" thì trừ lại soldCount tương ứng
  if (orderToDelete && orderToDelete.orderStatus === 'COMPLETED') {
    const updatedProducts = (prevProducts: Product[]) => prevProducts.map(p => {
      const orderItem = orderToDelete.items.find(item => item.productId === p.id);
      if (orderItem) {
        return { ...p, soldCount: Math.max(0, p.soldCount - orderItem.quantity) };
      }
      return p;
    });
    syncProducts(updatedProducts);
  }

  // Hoàn lại tồn kho nếu đơn bị xóa CHƯA từng được hủy trước đó
  // (vì tồn kho đã bị trừ ngay lúc đặt hàng - xem handlePlaceOrder - và chỉ được hoàn khi hủy đơn)
  // CHỈ áp dụng cho đơn có cờ stockDeducted = true (đơn thực sự đã từng bị trừ kho) -
  // tránh hoàn nhầm tồn kho cho các đơn hàng cũ tạo trước khi có tính năng quản lý tồn kho.
  if (orderToDelete && orderToDelete.orderStatus !== 'CANCELLED' && orderToDelete.stockDeducted) {
    const updatedProductsStock = (prevProducts: Product[]) => prevProducts.map(p => {
      const orderItem = orderToDelete.items.find(item => item.productId === p.id);
      if (orderItem) {
        return { ...p, stock: (p.stock ?? 0) + orderItem.quantity };
      }
      return p;
    });
    syncProducts(updatedProductsStock);
  }

  // Hoàn lại lượt sử dụng mã giảm giá nếu đơn bị xóa có áp dụng mã và CHƯA từng bị hủy
  // (nếu đã hủy trước đó thì lượt dùng đã được hoàn lại rồi, tránh hoàn 2 lần)
  if (orderToDelete && orderToDelete.orderStatus !== 'CANCELLED' && orderToDelete.couponCode) {
    syncCoupons(prev => prev.map(c =>
      c.id === orderToDelete.couponCode ? { ...c, usedCount: Math.max(0, c.usedCount - 1) } : c
    ));
  }

  // Xóa luôn đơn hàng này khỏi Firestore để không bị "hồi sinh" qua real-time sync
  deleteDoc(doc(db, 'orders', orderId)).catch((err) => {
    console.error('Lỗi xóa đơn hàng trên Firestore:', err);
  });
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

      const updatedProducts = (prevProducts: Product[]) => prevProducts.map(p => {
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

const filteredProducts = products
  .filter((p) => {
    const keyword = normalize(searchQuery);

    const matchesSearch =
      normalize(p.name).includes(keyword) ||
      normalize(p.description).includes(keyword) ||
      normalize(p.category).includes(keyword);

    const matchesCategory =
      selectedCategory === "all" || p.category === selectedCategory;

    const matchesPrice =
      priceFilter === 'all' ? true :
      priceFilter === 'under100k' ? p.price < 100000 :
      priceFilter === '100k-300k' ? p.price >= 100000 && p.price <= 300000 :
      priceFilter === 'over300k' ? p.price > 300000 : true;

    return matchesSearch && matchesCategory && matchesPrice;
  })
  .sort((a, b) => {
    if (sortOrder === 'price-asc') return a.price - b.price;
    if (sortOrder === 'price-desc') return b.price - a.price;
    if (sortOrder === 'best-selling') return b.soldCount - a.soldCount;
    return 0; // 'default' - giữ nguyên thứ tự gốc
  });

  const cartSubtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const cartShippingFee = cartSubtotal > 150000 || cartItems.length === 0 ? 0 : 15000;

  // Cổng Shipper là một giao diện độc lập, tách biệt hoàn toàn khỏi Header/Footer của shop
  // (giống một app giao hàng riêng), nên render sớm ở đây trước khi vào layout chính.
  if (currentView === 'shipper') {
    return (
      <ShipperPortal
        shippers={shippers}
        onSaveShipperAreas={handleSaveShipperAreas}
        syncError={firestoreSyncError}
        onGoHome={() => {
          window.history.replaceState({}, '', '/');
          setCurrentView('client');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 flex flex-col font-sans selection:bg-gray-950 selection:text-white">
      
      {/* Dynamic Header */}
      <Header
        currentView={currentView}
        onViewChange={handleViewChange}
        cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
        onCartClick={() => setCartOpen(true)}
        wishlistCount={currentUser?.wishlist?.length || 0}
        onWishlistClick={() => {
          if (!currentUser) {
            setAuthModalMessage('Vui lòng đăng nhập để xem danh sách yêu thích.');
            setIsAuthModalOpen(true);
            return;
          }
          setWishlistOpen(true);
        }}
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
            {productNotFound ? (
              <NotFoundView
                onGoHome={() => {
                  setProductNotFound(false);
                  window.history.replaceState({}, '', window.location.pathname);
                }}
                onBrowseProducts={() => {
                  setProductNotFound(false);
                  window.history.replaceState({}, '', window.location.pathname);
                  setTimeout(() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' }), 100);
                }}
              />
            ) : (
              <>
            {/* Hero / Filter Section */}
            <div id="home" className="scroll-mt-20">
              <Hero
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                categories={categories}
              />
            </div>

            {/* Product Grid Section */}
            <section id="products" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-10">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
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

              {/* Bộ lọc giá + Sắp xếp */}
              <div className="flex flex-wrap items-center gap-3 mb-8" id="product-filters-bar">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Lọc theo giá:</span>
                {([
                  { key: 'all', label: 'Tất cả' },
                  { key: 'under100k', label: 'Dưới 100K' },
                  { key: '100k-300k', label: '100K - 300K' },
                  { key: 'over300k', label: 'Trên 300K' }
                ] as const).map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setPriceFilter(opt.key)}
                    className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                      priceFilter === opt.key
                        ? 'bg-gray-950 text-white border-gray-950'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}

                <div className="flex-1 hidden sm:block" />

                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Sắp xếp:</span>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
                  className="px-3.5 py-1.5 rounded-full text-[11px] font-bold border border-gray-200 bg-white text-gray-700 cursor-pointer focus:outline-hidden focus:border-gray-400"
                >
                  <option value="default">Mặc định</option>
                  <option value="price-asc">Giá: Thấp đến cao</option>
                  <option value="price-desc">Giá: Cao đến thấp</option>
                  <option value="best-selling">Bán chạy nhất</option>
                </select>
              </div>

              {/* Grid Layout */}
              {isInitialLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-250 p-8 max-w-md mx-auto space-y-4">
                  <p className="text-3xl">✨</p>
                  <p className="text-sm font-extrabold text-gray-800">Không tìm thấy sản phẩm bạn đang tìm kiếm!</p>
                  <p className="text-xs text-gray-400">Vui lòng thử tìm bằng từ khóa khác hoặc chọn danh mục khác.</p>
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setPriceFilter('all'); }}
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
                      isWishlisted={(currentUser?.wishlist || []).includes(product.id)}
                      onToggleWishlist={handleToggleWishlist}
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

              </>
            )}
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
                coupons={coupons}
                onAddCoupon={handleAddCoupon}
                onUpdateCoupon={handleUpdateCoupon}
                onDeleteCoupon={handleDeleteCoupon}
                categories={categories}
                onAddCategory={handleAddCategory}
                onUpdateCategory={handleUpdateCategory}
                onDeleteCategory={handleDeleteCategory}
                users={users}
                shippers={shippers}
                onUpdateShipperAreas={handleSaveShipperAreas}
                onDeleteShipper={handleDeleteShipper}
                onClaimOrder={handleClaimOrder}
                onReleaseOrder={handleReleaseOrder}
                onCompleteDelivery={handleShipperCompleteDelivery}
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
            href="https://m.me/61593475031258" 
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
        coupons={coupons}
        onCheckout={(code, amt) => {
          if (!currentUser) {
            setCartOpen(false);
            setAuthModalMessage('Vui lòng đăng nhập hoặc đăng ký tài khoản thành viên để tiến hành thanh toán đặt hàng.');
            setIsAuthModalOpen(true);
            return;
          }
          setAppliedCoupon(code, amt);
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />

      {/* Wishlist Drawer */}
      <WishlistDrawer
        isOpen={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        products={products.filter(p => (currentUser?.wishlist || []).includes(p.id))}
        onRemove={handleToggleWishlist}
        onAddToCart={(p) => handleAddToCart(p, 1)}
        onOpenDetails={(p) => { setSelectedProduct(p); setWishlistOpen(false); }}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cartItems={cartItems}
        subtotal={cartSubtotal}
        shippingFee={cartShippingFee}
        discountAmount={appliedDiscountAmount}
        discountCode={appliedCouponCode}
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
            isWishlisted={(currentUser?.wishlist || []).includes(selectedProduct.id)}
            onToggleWishlist={handleToggleWishlist}
            relatedProducts={products
              .filter(p => p.category === selectedProduct.category && p.id !== selectedProduct.id)
              .slice(0, 4)}
            onSelectRelatedProduct={(p) => setSelectedProduct(p)}
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

