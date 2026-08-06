import React, { useState } from 'react';
import { 
  TrendingUp, ShoppingBag, MessageSquare, ShieldAlert, Plus, 
  Trash2, Edit, Save, Power, Check, RefreshCw, X, Award, MapPin, 
  CornerDownRight, CheckCircle, Clock, Truck, ShieldCheck, Flame, Info, Star,
  Bot, Send, Bell, AlertCircle
} from 'lucide-react';
import { Product, Order, Review, ContactMessage, TelegramConfig } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface AdminPortalProps {
  products: Product[];
  orders: Order[];
  reviews: Review[];
  contactMessages: ContactMessage[];
  telegramConfig?: TelegramConfig;
  onUpdateTelegramConfig?: (config: TelegramConfig) => void;
  onAddProduct: (product: Omit<Product, 'id' | 'rating' | 'reviewsCount' | 'soldCount'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateOrderStatus: (orderId: string, status: Order['orderStatus'], paymentStatus?: Order['paymentStatus']) => void;
  onAddReviewReply: (reviewId: string, replyText: string) => void;
  onUpdateReviewStatus: (reviewId: string, status: 'PENDING' | 'APPROVED' | 'HIDDEN') => void;
  onUpdateContactStatus: (contactId: string, status: 'PENDING' | 'READ') => void;
  onDeleteContactMessage: (contactId: string) => void;
  onLogout?: () => void;
  onDeleteOrder: (id: string) => void;
}

export default function AdminPortal({
  products,
  orders,
  reviews,
  contactMessages = [],
  telegramConfig,
  onUpdateTelegramConfig,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateOrderStatus,
  onAddReviewReply,
  onUpdateReviewStatus,
  onUpdateContactStatus,
  onDeleteContactMessage,
  onDeleteOrder,
  onLogout
  
}: AdminPortalProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'products' | 'orders' | 'reviews' | 'telegram'>('stats');
  const [reviewSubTab, setReviewSubTab] = useState<'product_reviews' | 'customer_feedback'>('product_reviews');

  // Telegram Bot config form states
  const [botToken, setBotToken] = useState(telegramConfig?.botToken || '');
  const [chatId, setChatId] = useState(telegramConfig?.chatId || '');
  const [telegramEnabled, setTelegramEnabled] = useState(telegramConfig?.enabled || false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testMessageStatus, setTestMessageStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [testMessageError, setTestMessageError] = useState('');

  React.useEffect(() => {
    if (telegramConfig) {
      setBotToken(telegramConfig.botToken);
      setChatId(telegramConfig.chatId);
      setTelegramEnabled(telegramConfig.enabled);
    }
  }, [telegramConfig]);

  const handleSaveTelegramConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateTelegramConfig) {
      onUpdateTelegramConfig({
        botToken: botToken.trim(),
        chatId: chatId.trim(),
        enabled: telegramEnabled
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleSendTestMessage = async () => {
    if (!botToken.trim() || !chatId.trim()) {
      setTestMessageStatus('error');
      setTestMessageError('Vui lòng điền đầy đủ mã Token và Chat ID trước khi thử nghiệm.');
      return;
    }

    setTestMessageStatus('sending');
    setTestMessageError('');

    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken.trim()}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId.trim(),
          text: `🔔 <b>THÔNG BÁO THỬ NGHIỆM - ESYSHOP</b>\n\nChúc mừng! Hệ thống liên kết Telegram của bạn hoạt động thành công. Bạn sẽ nhận được thông báo tức thì khi có đơn đặt hàng mới!`,
          parse_mode: 'HTML',
        }),
      });

      if (response.ok) {
        setTestMessageStatus('success');
        setTimeout(() => setTestMessageStatus('idle'), 5000);
      } else {
        const errData = await response.json();
        setTestMessageStatus('error');
        setTestMessageError(errData.description || 'Không thể gửi tin nhắn. Kiểm tra lại thông tin.');
      }
    } catch (err: any) {
      setTestMessageStatus('error');
      setTestMessageError(err.message || 'Lỗi kết nối mạng.');
    }
  };

  // Form states for Products
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: 0,
    priceMax: 0,
    originalPrice: 0,
    image: '',
    images: [] as string[],
    category: 'notebook_paper',
    isAvailable: true,
    stock: 0
  });

  // Reply states for Reviews
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});

  // Confirm delete message state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Calculation stats
  const totalRevenue = orders
    .filter(o => o.orderStatus !== 'CANCELLED')
    .reduce((acc, curr) => acc + curr.total, 0);
  
  const pendingOrdersCount = orders.filter(o => o.orderStatus !== 'COMPLETED' && o.orderStatus !== 'CANCELLED').length;
  
  const averageRating = reviews.length > 0 
    ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length 
    : 4.8;

  const outOfStockCount = products.filter(p => !p.isAvailable).length;

  // Calculation of monthly revenue for last 6 months
  const getMonthlyRevenueData = () => {
    const monthsData = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthLabel = `T${d.getMonth() + 1}`;
      const fullLabel = `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`;
      const yearMonthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      
      const monthlyTotal = orders
        .filter(o => {
          if (o.orderStatus === 'CANCELLED') return false;
          const orderDate = new Date(o.createdAt);
          const orderYearMonth = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
          return orderYearMonth === yearMonthKey;
        })
        .reduce((sum, o) => sum + o.total, 0);
        
      monthsData.push({
        label: monthLabel,
        fullName: fullLabel,
        value: monthlyTotal
      });
    }
    return monthsData;
  };

  const monthlyData = getMonthlyRevenueData();
  const maxMonthlyValue = Math.max(...monthlyData.map(m => m.value), 1);

  // Filter lists
  const [productSearch, setProductSearch] = useState('');
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  const [orderSearch, setOrderSearch] = useState('');
  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(orderSearch.toLowerCase()) || 
    o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) || 
    o.customerPhone.includes(orderSearch)
  );

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.image || productForm.price <= 0) return;

    if (editingProductId) {
      const original = products.find(p => p.id === editingProductId);
      if (original) {
        onUpdateProduct({
          ...original,
          name: productForm.name,
          description: productForm.description,
          price: Number(productForm.price),
          priceMax: productForm.priceMax > 0 ? Number(productForm.priceMax) : undefined,
          originalPrice: productForm.originalPrice > 0 ? Number(productForm.originalPrice) : undefined,
          image: productForm.image,
          images: productForm.images.filter(Boolean),
          category: productForm.category,
          isAvailable: productForm.isAvailable,
          stock: Number(productForm.stock)
        });
      }
      setEditingProductId(null);
    } else {
      onAddProduct({
        name: productForm.name,
        description: productForm.description,
        price: Number(productForm.price),
        priceMax: productForm.priceMax > 0 ? Number(productForm.priceMax) : undefined,
        originalPrice: productForm.originalPrice > 0 ? Number(productForm.originalPrice) : undefined,
        image: productForm.image,
        images: productForm.images.filter(Boolean),
        category: productForm.category,
        isAvailable: productForm.isAvailable,
        stock: Number(productForm.stock)
      });
      setIsAddingNew(false);
    }

    // Reset Form
    setProductForm({
      name: '',
      description: '',
      price: 0,
      priceMax: 0,
      originalPrice: 0,
      image: '',
      images: [],
      category: 'notebook_paper',
      isAvailable: true,
      stock: 0
    });
  };

  const startEditProduct = (p: Product) => {
    setEditingProductId(p.id);
    setIsAddingNew(false);
    setProductForm({
      name: p.name,
      description: p.description,
      price: p.price,
      priceMax: p.priceMax || 0,
      originalPrice: p.originalPrice || 0,
      image: p.image,
      images: p.images || [],
      category: p.category,
      isAvailable: p.isAvailable,
      stock: p.stock ?? 0
    });
  };

  const handleReplySubmit = (reviewId: string) => {
    const text = replyText[reviewId];
    if (!text || !text.trim()) return;

    onAddReviewReply(reviewId, text);
    setReplyText(prev => ({ ...prev, [reviewId]: '' }));
  };

  const getOrderStatusBadge = (status: Order['orderStatus']) => {
    switch (status) {
      case 'RECEIVED': 
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <Clock className="h-3 w-3" /> Chờ xác nhận
        </span>;
      case 'PREPARING': 
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <RefreshCw className="h-3 w-3 animate-spin" /> Chờ lấy hàng
        </span>;
      case 'DELIVERING': 
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
          <Truck className="h-3 w-3" /> Chờ giao hàng
        </span>;
      case 'COMPLETED': 
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle className="h-3 w-3" /> Đánh giá
        </span>;
      case 'CANCELLED': 
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-250 text-gray-800 border border-gray-300">
          <X className="h-3 w-3" /> Đã hủy
        </span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-6 mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-950 flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-gray-900" />
            Bảng Quản Trị Hệ Thống
          </h1>
          <p className="text-xs text-gray-500 mt-1">Quản lý kho hàng, theo dõi đơn hàng thời gian thực, duyệt ý kiến khách hàng.</p>
        </div>

        {/* Action button to trigger Add Product / Logout */}
        <div className="flex gap-2">
          {activeTab === 'products' && !isAddingNew && !editingProductId && (
            <button
              onClick={() => {
                setIsAddingNew(true);
                setEditingProductId(null);
                setProductForm({ name: '', description: '', price: 0, priceMax: 0, originalPrice: 0, image: '', images: [], category: 'notebook_paper', isAvailable: true, stock: 0 });
              }}
              className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-gray-950 text-white text-xs font-bold uppercase hover:bg-black transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Thêm Sản Phẩm Mới
            </button>
          )}

          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-850 text-xs font-bold uppercase transition-colors cursor-pointer"
            >
              <Power className="h-4 w-4" /> Đăng xuất
            </button>
          )}
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex border-b border-gray-200 mb-8 overflow-x-auto no-scrollbar gap-1.5">
        {(['stats', 'products', 'orders', 'reviews', 'telegram'] as const).map((tab) => {
          const hasPendingFeedback = tab === 'reviews' && (
            reviews.some(r => r.status === 'PENDING') || 
            contactMessages.some(m => m.status === 'PENDING')
          );
          return (
            <button
              key={tab}
              id={`admin-tab-${tab}`}
              onClick={() => {
                setActiveTab(tab);
                setIsAddingNew(false);
                setEditingProductId(null);
              }}
              className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === tab
                  ? 'border-gray-950 text-gray-950 font-black'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab === 'stats' && 'Tổng quan số liệu'}
              {tab === 'products' && `Danh sách sản phẩm (${products.length})`}
              {tab === 'orders' && `Đơn đặt hàng (${orders.length})`}
              {tab === 'reviews' && `Quản lý đánh giá & Phản hồi (${reviews.length + contactMessages.length})`}
              {tab === 'telegram' && 'Liên kết Telegram'}
              {hasPendingFeedback && (
                <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        
        {/* Tab 1: Stats & Charts overview */}
        {activeTab === 'stats' && (
          <motion.div
            key="stats"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            {/* Stats Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-2xs space-y-2">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tổng Doanh Thu</p>
                <p className="text-xl sm:text-2xl font-black text-gray-950 font-mono">{formatPrice(totalRevenue)}</p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-2xs space-y-2">
                <div className="h-10 w-10 rounded-xl bg-gray-100 text-gray-800 flex items-center justify-center font-bold">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Đơn Chưa Xử Lý</p>
                <p className="text-xl sm:text-2xl font-black text-gray-950 font-mono">{pendingOrdersCount} đơn</p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-2xs space-y-2">
                <div className="h-10 w-10 rounded-xl bg-gray-100 text-gray-800 flex items-center justify-center font-bold">
                  <Award className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Điểm Đánh Giá</p>
                <p className="text-xl sm:text-2xl font-black text-gray-950 font-mono">{averageRating.toFixed(2)} / 5</p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-2xs space-y-2">
                <div className="h-10 w-10 rounded-xl bg-gray-100 text-gray-800 flex items-center justify-center font-bold">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Hết kho / Tạm tắt</p>
                <p className="text-xl sm:text-2xl font-black text-gray-950 font-mono">{outOfStockCount} món</p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-2xs space-y-2 col-span-2 lg:col-span-1">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ý kiến khách hàng</p>
                <p className="text-xl sm:text-2xl font-black text-gray-950 font-mono">
                  {contactMessages.length} <span className="text-xs font-semibold text-gray-400">({contactMessages.filter(m => m.status === 'PENDING').length} mới)</span>
                </p>
              </div>
            </div>

            {/* Custom Visual Data Chart Representation */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Column 1: Category Statistics */}
              <div className="lg:col-span-4 p-6 rounded-3xl bg-white border border-gray-100 shadow-2xs space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Doanh số Danh Mục</h3>
                  <p className="text-[10px] text-gray-400 font-medium">Tỷ lệ đóng góp doanh thu của từng nhóm sản phẩm.</p>
                </div>
                
                {/* Visual category barchart */}
                <div className="space-y-4.5 py-2">
                  {['notebook_paper', 'digital_devices'].map((catId) => {
                    const label = catId === 'notebook_paper' ? 'Sổ và giấy các loại' : 'Máy in, máy scan, máy chiếu';
                    const value = orders
                      .filter(o => o.orderStatus !== 'CANCELLED')
                      .reduce((acc, order) => {
                        const catSub = order.items.reduce((sub, item) => {
                          const prod = products.find(p => p.id === item.productId);
                          if (prod && prod.category === catId) {
                            return sub + (item.price * item.quantity);
                          }
                          return sub;
                        }, 0);
                        return acc + catSub;
                      }, 0);

                    // Max scale divisor
                    const percentWidth = totalRevenue > 0 ? Math.min(100, Math.max(8, (value / totalRevenue) * 100)) : 0;

                    return (
                      <div key={catId} className="space-y-1 text-xs">
                        <div className="flex justify-between font-bold">
                          <span className="text-gray-700">{label}</span>
                          <span className="font-mono text-gray-950 font-extrabold">{formatPrice(value)}</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-gray-50 overflow-hidden border border-gray-100/60">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percentWidth}%` }}
                            transition={{ duration: 0.8 }}
                            className="h-full bg-gray-950 rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Column 2: Monthly Revenue Vertical Bar Chart */}
              <div className="lg:col-span-4 p-6 rounded-3xl bg-white border border-gray-100 shadow-2xs space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Doanh thu theo Tháng</h3>
                  <p className="text-[10px] text-gray-400 font-medium">Doanh số bán hàng thực tế qua 6 tháng gần nhất.</p>
                </div>

                {/* Vertical columns representation */}
                <div className="flex items-end justify-between h-[135px] pt-2 px-1 gap-2">
                  {monthlyData.map((m, idx) => {
                    const barHeight = m.value > 0 ? (m.value / maxMonthlyValue) * 100 : 0;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                        {/* Hover Tooltip */}
                        <div className="absolute -top-9 scale-0 group-hover:scale-100 transition-all bg-gray-900/95 text-white text-[9px] py-1 px-1.5 rounded-lg font-black font-mono shadow-md z-10 whitespace-nowrap">
                          {formatPrice(m.value)}
                        </div>

                        {/* Interactive column visual bar */}
                        <div className="w-full bg-gray-50/70 rounded-md h-[95px] flex items-end overflow-hidden border border-gray-100/60">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${barHeight || 4}%` }}
                            transition={{ duration: 0.8, delay: idx * 0.08 }}
                            className={`w-full rounded-t-sm ${
                              m.value > 0
                                ? 'bg-gray-950 group-hover:opacity-90 transition-opacity'
                                : 'bg-gray-200/50'
                            }`}
                          />
                        </div>

                        {/* Month text label */}
                        <span className="text-[9px] font-bold text-gray-500 font-mono tracking-tight" title={m.fullName}>
                          {m.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Column 3: Recent Transactions */}
              <div className="lg:col-span-4 p-6 rounded-3xl bg-white border border-gray-100 shadow-2xs space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Giao dịch gần đây</h3>
                  <p className="text-[10px] text-gray-400 font-medium">Danh sách các đơn hàng mới cập nhật trong hệ thống.</p>
                </div>

                <div className="space-y-3 max-h-[145px] overflow-y-auto pr-1 mt-2 flex-1">
                  {orders.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-6 text-gray-400 italic font-medium">
                      Chưa có đơn hàng nào
                    </div>
                  ) : (
                    orders.slice(0, 4).map(o => (
                      <div key={o.id} className="p-2.5 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between text-xs font-semibold">
                        <div className="space-y-0.5 min-w-0 flex-1 pr-2">
                          <p className="font-bold text-gray-900 truncate">{o.customerName}</p>
                          <p className="text-[9px] text-gray-400 font-mono">{o.id} • {new Date(o.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div className="text-right shrink-0 space-y-0.5">
                          <span className="text-gray-950 font-bold font-mono text-[11px]">{formatPrice(o.total)}</span>
                          <div className="text-[9px] text-gray-400 font-medium">
                            {o.paymentMethod === 'ONLINE' ? 'Chuyển khoản' : 'COD'}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </motion.div>
        )}

        {/* Tab 2: Products management */}
        {activeTab === 'products' && (
          <motion.div
            key="products"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Form for Add / Edit product */}
            {(isAddingNew || editingProductId) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-gray-50 border border-gray-200 p-6 rounded-3xl space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-gray-950 uppercase tracking-wider">
                    {editingProductId ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}
                  </h3>
                  <button
                    onClick={() => {
                      setIsAddingNew(false);
                      setEditingProductId(null);
                    }}
                    className="p-1 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-900"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleProductSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-gray-700">
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block mb-1">Tên sản phẩm *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: Nước hoa Replica Lazy Sunday Morning"
                        value={productForm.name}
                        onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-gray-400 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block mb-1">Danh mục *</label>
                      <select
                        value={productForm.category}
                        onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-gray-400 bg-white"
                      >
                        <option value="notebook_paper">Sổ và giấy các loại</option>
                        <option value="digital_devices">Máy in, máy scan, máy chiếu</option>
                      </select>
                    </div>

                    <div>
                      <label className="block mb-1">Tồn kho</label>
                      <input
                        type="number"
                        min={0}
                        placeholder="Nhập số lượng tồn kho (0 nếu hết hàng)"
                        value={productForm.stock === 0 ? '' : productForm.stock}
                        onChange={(e) => {
                          const raw = e.target.value;
                          setProductForm(prev => ({ ...prev, stock: raw === '' ? 0 : Number(raw) }));
                        }}
                        className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-gray-400 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 text-xs font-semibold">Giá bán tối thiểu (VND) *</label>
                      <input
                        type="number"
                        required
                        placeholder="25000"
                        value={productForm.price || ''}
                        onChange={(e) => setProductForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                        className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-gray-400 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-xs font-semibold">Giá bán tối đa (VND) - Trống nếu 1 giá</label>
                      <input
                        type="number"
                        placeholder="27000"
                        value={productForm.priceMax || ''}
                        onChange={(e) => setProductForm(prev => ({ ...prev, priceMax: Number(e.target.value) }))}
                        className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-gray-400 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1">Giá gốc khi chưa giảm (VND) - Để trống nếu không giảm giá</label>
                    <input
                      type="number"
                      placeholder="30000"
                      value={productForm.originalPrice || ''}
                      onChange={(e) => setProductForm(prev => ({ ...prev, originalPrice: Number(e.target.value) }))}
                      className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-gray-400 bg-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block mb-1">Link ảnh sản phẩm (URL Unsplash...) *</label>
                    <input
                      type="url"
                      required
                      placeholder="https://images.unsplash.com/..."
                      value={productForm.image}
                      onChange={(e) => setProductForm(prev => ({ ...prev, image: e.target.value }))}
                      className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-gray-400 bg-white"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Các ảnh phụ liên quan (Chụp từ nhiều góc khác nhau)</label>
                    <div className="grid grid-cols-1 gap-2">
                      {productForm.images.map((imgUrl, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <input
                            type="url"
                            placeholder="https://images.unsplash.com/... (ảnh góc khác)"
                            value={imgUrl}
                            onChange={(e) => {
                              const newImages = [...productForm.images];
                              newImages[index] = e.target.value;
                              setProductForm(prev => ({ ...prev, images: newImages }));
                            }}
                            className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-gray-400 bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newImages = productForm.images.filter((_, i) => i !== index);
                              setProductForm(prev => ({ ...prev, images: newImages }));
                            }}
                            className="p-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-all cursor-pointer flex items-center justify-center shrink-0"
                            title="Xóa ảnh này"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setProductForm(prev => ({ ...prev, images: [...prev.images, ''] }));
                      }}
                      className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100/70 px-4 py-2 rounded-xl border border-emerald-200 transition-all cursor-pointer w-fit"
                    >
                      <Plus className="h-3.5 w-3.5" /> Thêm ảnh phụ
                    </button>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block mb-1">Mô tả sản phẩm</label>
                    <textarea
                      rows={3}
                      placeholder="Hương thơm nồng nàn quyến rũ từ hoa hồng và hổ phách..."
                      value={productForm.description}
                      onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-gray-400 bg-white"
                    />
                  </div>

                  {/* Availability toggle */}
                  <div className="md:col-span-2 flex items-center gap-2 py-2">
                    <input
                      type="checkbox"
                      id="avail-toggle-check"
                      checked={productForm.isAvailable}
                      onChange={(e) => setProductForm(prev => ({ ...prev, isAvailable: e.target.checked }))}
                      className="h-4.5 w-4.5 rounded-sm text-gray-950 focus:ring-gray-400 border-gray-300"
                    />
                    <label htmlFor="avail-toggle-check" className="text-gray-900 font-bold select-none cursor-pointer">
                      Sản phẩm đang sẵn có trong kho (Mở bán ngay)
                    </label>
                  </div>

                  <div className="md:col-span-2 flex justify-end gap-2 pt-2 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingNew(false);
                        setEditingProductId(null);
                      }}
                      className="py-2.5 px-4 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="py-2.5 px-5 rounded-xl bg-gray-950 hover:bg-black text-white font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Save className="h-4 w-4" />
                      <span>{editingProductId ? 'Lưu chỉnh sửa' : 'Thêm nước hoa mới'}</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Search filter bar */}
            <div className="max-w-md shadow-xs rounded-xl bg-white border border-gray-100 p-1.5 flex items-center gap-2">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm nhanh..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full text-xs font-semibold py-2 px-3 border-0 focus:outline-hidden focus:ring-0 bg-transparent"
              />
            </div>

            {/* Table Listing */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-600 border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-400 border-b border-gray-100 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-4">Hình ảnh</th>
                      <th className="p-4">Tên sản phẩm / Danh mục</th>
                      <th className="p-4">Giá bán</th>
                      <th className="p-4">Tồn kho</th>
                      <th className="p-4">Đã bán</th>
                      <th className="p-4">Trạng thái</th>
                      <th className="p-4 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-semibold text-gray-800">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-gray-400 italic font-medium">Không tìm thấy sản phẩm nào khớp với từ khóa tìm kiếm.</td>
                      </tr>
                    ) : (
                      filteredProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-4">
                            <img
                              src={p.image}
                              alt={p.name}
                              referrerPolicy="no-referrer"
                              className="h-12 w-12 rounded-xl object-cover border border-gray-100 bg-gray-50"
                            />
                          </td>
                          <td className="p-4 max-w-xs">
                            <p className="font-extrabold text-gray-900 truncate">{p.name}</p>
                            <span className="text-[10px] uppercase font-bold text-gray-800 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                              {p.category === 'notebook_paper' ? 'Sổ và giấy các loại' : p.category === 'digital_devices' ? 'Máy in, máy scan, máy chiếu' : 'Chưa phân loại'}
                            </span>
                          </td>
                          <td className="p-4 font-mono font-bold text-gray-950 text-xs">
                            {p.priceMax ? `${formatPrice(p.price)} - ${formatPrice(p.priceMax)}` : formatPrice(p.price)}
                            {p.originalPrice && <span className="block text-[10px] text-gray-400 line-through font-normal">{formatPrice(p.originalPrice)}</span>}
                          </td>
                          <td className="p-4 font-mono font-bold">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                              (p.stock ?? 0) === 0
                                ? 'bg-red-50 text-red-600'
                                : (p.stock ?? 0) <= 10
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-emerald-50 text-emerald-700'
                            }`}>
                              {p.stock ?? 0}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-gray-500">{p.soldCount} sản phẩm</td>
                          <td className="p-4">
                            <button
                              onClick={() => onUpdateProduct({ ...p, isAvailable: !p.isAvailable })}
                              className={`inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-[10px] font-black tracking-wider uppercase border select-none cursor-pointer transition-colors ${
                                p.isAvailable 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                  : 'bg-gray-100 text-gray-500 border-gray-200'
                              }`}
                            >
                              <Power className="h-3 w-3" />
                              {p.isAvailable ? 'Đang mở bán' : 'Tạm tắt'}
                            </button>
                          </td>
                          <td className="p-4">
                            <div className="flex justify-center gap-1.5">
                              <button
                                onClick={() => startEditProduct(p)}
                                className="p-2 rounded-xl text-gray-400 hover:text-gray-950 hover:bg-gray-100 transition-colors cursor-pointer"
                                title="Chỉnh sửa sản phẩm"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => onDeleteProduct(p.id)}
                                className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Xóa món ăn"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 3: Orders management */}
        {activeTab === 'orders' && (
          <motion.div
            key="orders"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Search bar */}
            <div className="max-w-md shadow-xs rounded-xl bg-white border border-gray-100 p-1.5 flex items-center gap-2">
              <input
                type="text"
                placeholder="Tìm mã đơn hàng, tên khách hàng, số điện thoại..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full text-xs font-semibold py-2 px-3 border-0 focus:outline-hidden focus:ring-0 bg-transparent"
              />
            </div>

            {/* Grid listing of orders */}
            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <div className="p-8 text-center text-gray-400 italic bg-white rounded-3xl border border-gray-100 font-medium">Chưa nhận được đơn đặt hàng nào khớp với tìm kiếm của bạn.</div>
              ) : (
                filteredOrders.map((o) => (
                  <div key={o.id} className="bg-white rounded-3xl border border-gray-100 shadow-2xs p-6 space-y-4">
                    
                    {/* Header bar of card */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-gray-900 font-mono">{o.id}</span>
                          <span className="text-[10px] font-semibold text-gray-400 font-mono">
                            {new Date(o.createdAt).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-extrabold text-gray-800">{o.customerName}</span>
                          <span className="text-gray-400 font-mono">{o.customerPhone}</span>
                          <span className="text-gray-300">|</span>
                          <span className="text-gray-500 font-medium flex items-center gap-0.5">
                            <MapPin className="h-3.5 w-3.5 shrink-0" /> {o.customerAddress}
                          </span>
                        </div>
                      </div>

                      {/* Statuses badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* payment status */}
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase border tracking-wider ${
                          o.paymentStatus === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-gray-150 text-gray-800 border-gray-250'
                        }`}>
                          {o.paymentMethod === 'ONLINE' ? 'Chuyển khoản' : 'COD'} — {o.paymentStatus === 'PAID' ? 'Đã Thanh Toán' : 'Chưa Thanh toán'}
                        </span>
                        
                        {/* Order status */}
                        {getOrderStatusBadge(o.orderStatus)}
                      </div>
                    </div>

                    {/* Order items nested list */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                      <div className="md:col-span-8 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Các món ăn đã đặt:</span>
                        <div className="space-y-2">
                          {o.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 text-xs font-semibold">
                              <img
                                src={item.image}
                                alt={item.productName}
                                referrerPolicy="no-referrer"
                                className="h-8 w-8 rounded-lg object-cover bg-gray-100 border border-gray-100"
                              />
                              <p className="text-gray-900 flex-1 truncate">
                                {item.productName} <span className="text-gray-950 font-mono font-bold">x{item.quantity}</span>
                              </p>
                              <span className="text-gray-500 font-mono">{formatPrice(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>

                        {o.customerNotes && (
                          <div className="mt-3.5 p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-[11px] text-gray-600 font-medium flex gap-2">
                            <Info className="h-4.5 w-4.5 text-gray-400 shrink-0" />
                            <div>
                              <span className="font-extrabold text-gray-950">Ghi chú của khách:</span> "{o.customerNotes}"
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Management control action buttons */}
                      <div className="md:col-span-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-3.5 text-right">
                        <div className="flex justify-between items-center text-xs border-b border-gray-200/50 pb-2">
                          <span className="text-gray-500">Doanh thu đơn hàng:</span>
                          <span className="text-sm font-black text-gray-950 font-mono">{formatPrice(o.total)}</span>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 text-left">Tiến độ giao dịch:</p>
                            {o.orderStatus !== 'CANCELLED' && o.orderStatus !== 'COMPLETED' && (
                              <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-150 px-1.5 py-0.5 rounded-md">
                                ⚡ Tự động xử lý
                              </span>
                            )}
                          </div>
                          {o.estimatedDeliveryAt && o.orderStatus !== 'CANCELLED' && (
                            <p className="text-[10px] font-bold text-gray-500 text-left">
                              Dự kiến giao: <span className="text-gray-800 font-black">
                                {new Date(o.estimatedDeliveryAt).toLocaleDateString('vi-VN')} {new Date(o.estimatedDeliveryAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </p>
                          )}
                          
                          {/* Visual 4-Step Stepper */}
                          {o.orderStatus !== 'CANCELLED' ? (
                            <div className="py-2.5 px-1">
                              <div className="flex items-center justify-between relative">
                                {/* Backline bar */}
                                <div className="absolute left-0 right-0 top-3 h-[2.5px] bg-gray-250 -z-10 rounded-full" />
                                <div 
                                  className="absolute left-0 top-3 h-[2.5px] bg-emerald-500 -z-10 transition-all duration-500 rounded-full" 
                                  style={{
                                    width: o.orderStatus === 'RECEIVED' ? '0%' :
                                           o.orderStatus === 'PREPARING' ? '33.33%' :
                                           o.orderStatus === 'DELIVERING' ? '66.66%' : '100%'
                                  }}
                                />

                                {[
                                  { key: 'RECEIVED', label: 'Chờ xác nhận' },
                                  { key: 'PREPARING', label: 'Chờ lấy hàng' },
                                  { key: 'DELIVERING', label: 'Chờ giao hàng' },
                                  { key: 'COMPLETED', label: 'Đánh giá' }
                                ].map((step, idx) => {
                                  const statusList = ['RECEIVED', 'PREPARING', 'DELIVERING', 'COMPLETED'];
                                  const currentIdx = statusList.indexOf(o.orderStatus);
                                  const stepIdx = statusList.indexOf(step.key);
                                  const isCompleted = stepIdx < currentIdx;
                                  const isActive = stepIdx === currentIdx;

                                  return (
                                    <div key={step.key} className="flex flex-col items-center flex-1 relative">
                                      <div 
                                        className={`h-6.5 w-6.5 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all duration-300 shadow-3xs ${
                                          isCompleted 
                                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                                            : isActive 
                                            ? 'bg-white border-emerald-600 text-emerald-700 ring-4 ring-emerald-50 font-extrabold' 
                                            : 'bg-white border-gray-300 text-gray-400'
                                        }`}
                                      >
                                        {isCompleted ? '✓' : idx + 1}
                                      </div>
                                      <span 
                                        className={`text-[9px] mt-2 font-bold tracking-tight text-center whitespace-nowrap block ${
                                          isActive 
                                            ? 'text-emerald-750 font-black' 
                                            : isCompleted 
                                            ? 'text-gray-800' 
                                            : 'text-gray-400'
                                        }`}
                                      >
                                        {step.label}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-2 bg-red-50 rounded-xl border border-red-150 text-[10px] font-bold text-red-650 uppercase tracking-wider">
                              Đơn hàng đã bị hủy bỏ
                            </div>
                          )}

                          <div className="flex justify-end gap-1.5 flex-wrap pt-1.5">
                            {o.orderStatus === 'RECEIVED' && (
                              <button
                                onClick={() => onUpdateOrderStatus(o.id, 'PREPARING')}
                                className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase rounded-xl cursor-pointer shadow-xs transition-transform hover:-translate-y-0.5 active:translate-y-0"
                              >
                                Xác nhận đơn hàng
                              </button>
                            )}
                            {o.orderStatus === 'PREPARING' && (
                              <button
                                onClick={() => onUpdateOrderStatus(o.id, 'DELIVERING')}
                                className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase rounded-xl cursor-pointer shadow-xs transition-transform hover:-translate-y-0.5 active:translate-y-0"
                              >
                                Giao cho vận chuyển
                              </button>
                            )}
                            {o.orderStatus === 'DELIVERING' && (
                              <button
                                onClick={() => onUpdateOrderStatus(o.id, 'COMPLETED', 'PAID')}
                                className="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase rounded-xl cursor-pointer shadow-xs transition-transform hover:-translate-y-0.5 active:translate-y-0"
                              >
                                Giao hàng thành công
                              </button>
                            )}
                            {o.orderStatus !== 'COMPLETED' && o.orderStatus !== 'CANCELLED' && (
                              <button
                                onClick={() => onUpdateOrderStatus(o.id, 'CANCELLED')}
                                className="py-2 px-3 bg-white text-red-600 hover:bg-red-50 font-bold text-[10px] uppercase rounded-xl cursor-pointer border border-red-200 shadow-3xs transition-colors"
                              >
                                Hủy đơn
                              </button>
                            )}
                            <button
                              onClick={() => onDeleteOrder(o.id)}
                              className="py-2 px-3 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] uppercase rounded-xl cursor-pointer"
                            >
                              🗑 Xóa đơn
                            </button>
                            {(o.orderStatus === 'COMPLETED' || o.orderStatus === 'CANCELLED') && (
                              <span className="text-[10px] font-bold text-gray-450 italic">Giao dịch hoàn tất</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* Tab 4: Reviews approval and replies (Gộp Quản lý đánh giá & Phản hồi) */}
        {activeTab === 'reviews' && (
          <motion.div
            key="reviews_feedback"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Header and Segment Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-gray-100 shadow-2xs">
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Quản lý đánh giá & Phản hồi</h3>
                <p className="text-[11px] text-gray-500 font-semibold mt-1">Phê duyệt, ẩn đánh giá tránh spam và trả lời trực tiếp thắc mắc từ khách hàng.</p>
              </div>
              
              {/* Sub-tabs toggles */}
              <div className="flex bg-gray-150 p-1 rounded-2xl border border-gray-200">
                <button
                  type="button"
                  onClick={() => setReviewSubTab('product_reviews')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    reviewSubTab === 'product_reviews'
                      ? 'bg-white text-gray-950 shadow-xs'
                      : 'text-gray-500 hover:text-gray-850'
                  }`}
                >
                  Đánh giá sản phẩm ({reviews.length})
                </button>
                <button
                  type="button"
                  onClick={() => setReviewSubTab('customer_feedback')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    reviewSubTab === 'customer_feedback'
                      ? 'bg-white text-gray-950 shadow-xs'
                      : 'text-gray-500 hover:text-gray-850'
                  }`}
                >
                  Ý kiến & Liên hệ ({contactMessages.length})
                </button>
              </div>
            </div>

            {/* Sub-tab 1: Product Reviews moderation and replies */}
            {reviewSubTab === 'product_reviews' && (
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <div className="p-12 text-center text-gray-400 italic bg-white rounded-3xl border border-gray-100 font-medium">
                    Chưa nhận được đánh giá nào từ khách hàng cho sản phẩm.
                  </div>
                ) : (
                  reviews.map((rev) => {
                    const product = products.find(p => p.id === rev.productId);
                    const reviewStatus = rev.status || 'APPROVED'; // default legacy is APPROVED
                    
                    return (
                      <div key={rev.id} className="bg-white rounded-3xl border border-gray-100 shadow-2xs p-5 space-y-4 text-xs">
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-gray-900 text-sm">{rev.userName}</span>
                              
                              {/* Stars */}
                              <div className="flex text-amber-400">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} className={`h-3 w-3 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                                ))}
                              </div>

                              {/* Status badges */}
                              {reviewStatus === 'PENDING' && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-250 text-[9px] font-extrabold uppercase tracking-wider animate-pulse">
                                  Chờ duyệt
                                </span>
                              )}
                              {reviewStatus === 'APPROVED' && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-250 text-[9px] font-extrabold uppercase tracking-wider">
                                  Đã duyệt (Hiện)
                                </span>
                              )}
                              {reviewStatus === 'HIDDEN' && (
                                <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200 text-[9px] font-extrabold uppercase tracking-wider">
                                  Đã ẩn (Spam)
                                </span>
                              )}
                            </div>
                            {product && (
                              <p className="text-[10px] text-gray-500 font-semibold">
                                Sản phẩm: <span className="text-gray-950 font-bold">{product.name}</span>
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-gray-400 font-mono text-[10px] sm:text-xs">
                              {new Date(rev.createdAt).toLocaleString('vi-VN')}
                            </span>
                          </div>
                        </div>

                        {/* Comment text */}
                        <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-gray-700 font-semibold leading-relaxed">
                          {rev.comment}
                        </div>

                        {/* Moderation Controls: Phê duyệt / Ẩn tránh spam */}
                        <div className="flex items-center gap-2 flex-wrap text-[11px] font-bold">
                          <span className="text-gray-400 uppercase tracking-widest text-[9px] mr-1.5">Kiểm duyệt:</span>
                          
                          {reviewStatus !== 'APPROVED' && (
                            <button
                              type="button"
                              onClick={() => onUpdateReviewStatus(rev.id, 'APPROVED')}
                              className="flex items-center gap-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-750 text-white font-black hover:scale-105 transition-all cursor-pointer shadow-xs"
                            >
                              <Check className="h-3.5 w-3.5" /> Phê duyệt (Hiện)
                            </button>
                          )}
                          
                          {reviewStatus !== 'HIDDEN' && (
                            <button
                              type="button"
                              onClick={() => onUpdateReviewStatus(rev.id, 'HIDDEN')}
                              className="flex items-center gap-1 py-1.5 px-3 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-black hover:scale-105 transition-all cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" /> Ẩn bình luận (Spam)
                            </button>
                          )}

                          {reviewStatus !== 'PENDING' && (
                            <button
                              type="button"
                              onClick={() => onUpdateReviewStatus(rev.id, 'PENDING')}
                              className="flex items-center gap-1 py-1.5 px-3 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 font-semibold cursor-pointer"
                            >
                              <RefreshCw className="h-3 w-3" /> Đưa về chờ duyệt
                            </button>
                          )}
                        </div>

                        {/* Direct reply form / Answer display */}
                        <div className="border-t border-gray-50 pt-3 mt-3">
                          {rev.reply ? (
                            <div className="p-3.5 rounded-2xl bg-gray-950 text-[11px] text-white flex items-start gap-1.5 ml-4 shadow-sm relative">
                              <div className="absolute top-0 left-0 h-full w-1.5 bg-emerald-500" />
                              <CornerDownRight className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <div className="space-y-1.5">
                                <p className="font-extrabold text-emerald-400">Câu trả lời chính thức của EsyShop:</p>
                                <p className="font-semibold leading-relaxed text-gray-200">{rev.reply}</p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReplyText(prev => ({ ...prev, [rev.id]: rev.reply || '' }));
                                    onAddReviewReply(rev.id, ''); // clear reply temporarily to enter edit mode
                                  }}
                                  className="text-[9px] font-black text-gray-400 hover:text-white uppercase tracking-wider hover:underline transition-all cursor-pointer"
                                >
                                  Sửa câu trả lời
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3 ml-4 border-l-2 border-emerald-500 pl-4 py-1">
                              <label className="block text-[9px] font-black text-emerald-650 uppercase tracking-wider mb-1">
                                Trả lời trực tiếp đánh giá của khách:
                              </label>

                              {/* Quick Replies Selection */}
                              <div className="space-y-1.5 bg-gray-50 p-2.5 rounded-2xl border border-gray-150">
                                <span className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">💡 Click chọn nhanh phản hồi mẫu có sẵn:</span>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                                  {[
                                    "Dạ EsyShop chân thành cảm ơn phản hồi tích cực của quý khách rất nhiều ạ! Chúc quý khách có những trải nghiệm thật ngon miệng!",
                                    "Cảm ơn bạn đã tin dùng và đánh giá sản phẩm của EsyShop. Shop luôn nỗ lực duy trì chất lượng tốt nhất phục vụ quý khách.",
                                    "Dạ cảm ơn đánh giá của bạn! Sự hài lòng của quý khách chính là nguồn động lực to lớn nhất để EsyShop phát triển hơn.",
                                    "Chào bạn, EsyShop rất trân trọng ý kiến đóng góp của bạn và sẽ luôn nỗ lực cải thiện dịch vụ tốt nhất!"
                                  ].map((replyOption, idx) => {
                                    const isSelected = replyText[rev.id] === replyOption;
                                    return (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setReplyText(prev => ({ ...prev, [rev.id]: replyOption }))}
                                        className={`text-left text-[10px] p-2 rounded-xl border transition-all duration-200 leading-relaxed font-semibold cursor-pointer ${
                                          isSelected
                                            ? 'bg-emerald-50 border-emerald-350 text-emerald-800 shadow-2xs font-extrabold'
                                            : 'bg-white hover:bg-gray-100 border-gray-150 text-gray-600 hover:text-gray-900'
                                        }`}
                                      >
                                        <span className="text-emerald-600 font-extrabold mr-1">Mẫu {idx + 1}:</span> 
                                        "{replyOption.length > 55 ? replyOption.substring(0, 55) + '...' : replyOption}"
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Nhập câu trả lời tư vấn, cảm ơn hoặc click chọn nhanh mẫu phản hồi phía trên..."
                                  value={replyText[rev.id] || ''}
                                  onChange={(e) => setReplyText(prev => ({ ...prev, [rev.id]: e.target.value }))}
                                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-gray-400 bg-white shadow-2xs"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleReplySubmit(rev.id)}
                                  className="py-2.5 px-4 rounded-xl bg-gray-950 hover:bg-black text-white font-black hover:scale-105 transition-all cursor-pointer whitespace-nowrap uppercase tracking-wider text-[10px]"
                                >
                                  Gửi phản hồi
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Sub-tab 2: Contact Messages from customers */}
            {reviewSubTab === 'customer_feedback' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 gap-4">
                  {contactMessages.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 shadow-2xs space-y-2">
                      <div className="text-4xl">📬</div>
                      <h4 className="font-extrabold text-gray-900 text-sm">Chưa có ý kiến hay phản hồi nào</h4>
                      <p className="text-[11px] text-gray-400 font-semibold">Khi khách hàng gửi liên hệ từ chân trang, thông tin sẽ hiện ở đây.</p>
                    </div>
                  ) : (
                    contactMessages.slice().reverse().map((msg) => (
                      <div 
                        key={msg.id} 
                        className={`bg-white rounded-3xl border p-5 space-y-4 transition-all relative overflow-hidden ${
                          msg.status === 'PENDING' 
                            ? 'border-blue-200 bg-blue-50/10 shadow-sm' 
                            : 'border-gray-100 shadow-2xs'
                        }`}
                      >
                        {msg.status === 'PENDING' && (
                          <div className="absolute top-0 left-0 h-full w-1 bg-blue-500" />
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-extrabold text-gray-900 text-sm">{msg.name}</p>
                              {msg.status === 'PENDING' ? (
                                <span className="inline-block px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[9px] font-black uppercase tracking-wider animate-pulse">
                                  Mới
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[9px] font-bold uppercase tracking-wider">
                                  Đã đọc
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-500 font-semibold flex items-center gap-1">
                              📧 {msg.email || 'Không để lại email'}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 font-mono text-[10px] sm:text-xs">
                              {new Date(msg.createdAt).toLocaleString('vi-VN')}
                            </span>
                          </div>
                        </div>

                        {/* Message Body */}
                        <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 text-gray-700 font-semibold leading-relaxed text-xs">
                          {msg.message}
                        </div>

                        {/* Action buttons */}
                        <div className="flex justify-end gap-2 pt-1">
                          {msg.status === 'PENDING' && (
                            <button
                              onClick={() => onUpdateContactStatus(msg.id, 'READ')}
                              className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold transition-all cursor-pointer shadow-xs hover:scale-[1.02]"
                            >
                              <Check className="h-3.5 w-3.5" /> Đánh dấu đã đọc
                            </button>
                          )}
                          
                          {confirmDeleteId === msg.id ? (
                            <div className="flex items-center gap-1.5 animate-pulse">
                              <span className="text-red-600 font-extrabold text-[11px] mr-1">Xác nhận xóa?</span>
                              <button
                                onClick={() => {
                                  onDeleteContactMessage(msg.id);
                                  setConfirmDeleteId(null);
                                }}
                                className="py-2 px-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                              >
                                Xóa ngay
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="py-2 px-3.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-600 font-bold text-xs cursor-pointer"
                              >
                                Hủy
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(msg.id)}
                              className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 font-bold transition-all cursor-pointer"
                              title="Xóa ý kiến"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Xóa
                            </button>
                          )}
                        </div>

                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Tab 5: Telegram configuration */}
        {activeTab === 'telegram' && (
          <motion.div
            key="telegram"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Header Description card */}
            <div className="bg-gradient-to-br from-blue-500/10 via-teal-500/5 to-transparent p-6 rounded-3xl border border-blue-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
              <div className="space-y-2">
                <h3 className="text-base font-black text-gray-950 flex items-center gap-2">
                  <Bot className="h-5 w-5 text-blue-500" />
                  Hệ thống thông báo Telegram Bot
                </h3>
                <p className="text-xs text-gray-600 font-semibold leading-relaxed max-w-2xl">
                  Nhận thông báo đơn đặt hàng mới tức thì ngay trên Telegram của bạn! Khi khách hàng nhấn đặt hàng, toàn bộ chi tiết đơn bao gồm họ tên, điện thoại, địa chỉ, sản phẩm và tổng tiền sẽ được bot tự động gửi về kênh riêng tư hoặc nhóm của bạn.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-bold text-gray-500">Trạng thái thông báo:</span>
                <button
                  type="button"
                  onClick={() => setTelegramEnabled(!telegramEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-250 ease-in-out focus:outline-none ${
                    telegramEnabled ? 'bg-blue-600' : 'bg-gray-250'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-250 ease-in-out ${
                    telegramEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>

            {/* Config & Testing forms */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Configuration Form */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 p-6 space-y-5 shadow-2xs">
                <h4 className="text-sm font-black text-gray-950 flex items-center gap-1.5 uppercase tracking-wider">
                  <Bell className="h-4 w-4 text-gray-900" />
                  Thiết lập thông tin Bot
                </h4>

                {saveSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-150 text-xs font-bold"
                  >
                    🎉 Đã lưu cấu hình Telegram thành công vào hệ thống!
                  </motion.div>
                )}

                <form onSubmit={handleSaveTelegramConfig} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-700 block">
                      Mã Token của Telegram Bot (Bot Token) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={botToken}
                      onChange={(e) => setBotToken(e.target.value)}
                      placeholder="Ví dụ: 1234567890:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:border-gray-950 font-mono"
                      required
                    />
                    <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
                      Lấy từ cuộc trò chuyện với <b>@BotFather</b> bằng lệnh <code>/newbot</code>.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-700 block">
                      Telegram Chat ID (ID người nhận hoặc Nhóm) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={chatId}
                      onChange={(e) => setChatId(e.target.value)}
                      placeholder="Ví dụ: 987654321 hoặc -10012345678"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:border-gray-950 font-mono"
                      required
                    />
                    <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
                      ID tài khoản cá nhân hoặc nhóm của bạn. Sử dụng bot <b>@userinfobot</b> hoặc <b>@MissRose_bot</b> để lấy ID.
                    </p>
                  </div>

                  <div className="pt-3 flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 px-4 rounded-xl bg-gray-950 hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
                    >
                      Lưu cấu hình
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleSendTestMessage}
                      disabled={testMessageStatus === 'sending'}
                      className="flex-1 py-2.5 px-4 rounded-xl border border-blue-200 text-blue-600 bg-blue-50/50 hover:bg-blue-50 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {testMessageStatus === 'sending' ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          Đang gửi...
                        </>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" />
                          Gửi tin nhắn thử
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Instructions & Help */}
              <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4 shadow-2xs">
                <h4 className="text-sm font-black text-gray-950 flex items-center gap-1.5 uppercase tracking-wider">
                  <Info className="h-4 w-4 text-gray-950" />
                  Hướng dẫn kết nối
                </h4>

                <div className="space-y-3.5 text-xs text-gray-600 font-semibold leading-relaxed">
                  <div className="flex gap-2">
                    <span className="h-5 w-5 rounded-full bg-gray-100 text-gray-800 text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
                    <p>Mở Telegram, tìm kiếm và bắt đầu trò chuyện với <b className="text-gray-900">@BotFather</b>.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="h-5 w-5 rounded-full bg-gray-100 text-gray-800 text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
                    <p>Gửi lệnh <code className="text-red-600 bg-red-50 px-1 py-0.5 rounded">/newbot</code>, đặt tên và tên đăng nhập cho Bot của bạn để nhận mã <b>Bot Token</b>.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="h-5 w-5 rounded-full bg-gray-100 text-gray-800 text-[10px] font-bold flex items-center justify-center shrink-0">3</span>
                    <p>Nhấp vào liên kết bot bạn vừa tạo để bắt đầu (<b>/start</b>) nhắn tin với bot.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="h-5 w-5 rounded-full bg-gray-100 text-gray-800 text-[10px] font-bold flex items-center justify-center shrink-0">4</span>
                    <p>Tìm bot <b className="text-gray-900">@userinfobot</b> và gửi tin nhắn bất kỳ để lấy <b>Chat ID</b> cá nhân của bạn.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="h-5 w-5 rounded-full bg-gray-100 text-gray-800 text-[10px] font-bold flex items-center justify-center shrink-0">5</span>
                    <p>Copy các mã này dán vào form cấu hình bên trái, bật kích hoạt và nhấn <b>Lưu cấu hình</b>.</p>
                  </div>
                </div>

                {/* Status messages for testing */}
                <AnimatePresence>
                  {testMessageStatus === 'success' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-3.5 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-150 text-[11px] font-bold leading-relaxed"
                    >
                      ✅ Gửi tin nhắn thành công! Vui lòng kiểm tra lại ứng dụng Telegram trên điện thoại/máy tính của bạn.
                    </motion.div>
                  )}

                  {testMessageStatus === 'error' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-3.5 bg-red-50 text-red-700 rounded-2xl border border-red-150 text-[11px] font-bold leading-relaxed flex items-start gap-1.5"
                    >
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                      <div>
                        <p className="font-extrabold text-red-800">Gửi tin nhắn thất bại</p>
                        <p className="mt-0.5 text-[10px] text-red-600 font-medium leading-relaxed">{testMessageError}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
