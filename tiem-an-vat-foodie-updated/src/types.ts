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
  stock: number;
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
  // Mã giảm giá đã áp dụng cho đơn này (nếu có).
  couponCode?: string;
  discountAmount?: number;
  // Số tiền được giảm nhờ ưu đãi thành viên VIP (2%/món), tách riêng khỏi mã giảm giá để dễ tra cứu.
  vipDiscountAmount?: number;
  // Số điểm tích lũy khách đã dùng để giảm giá cho đơn này (nếu có).
  pointsUsed?: number;
  // Shipper đang phụ trách giao đơn này (tự nhận đơn qua Cổng Shipper).
  shipperName?: string;
  shipperPhone?: string;
  // Ngày giờ dự kiến giao hàng tới khách (ISO string), tính tự động khi tạo đơn.
  estimatedDeliveryAt?: string;
  // Đánh dấu đơn này ĐÃ thực sự trừ tồn kho lúc đặt hàng hay chưa.
  // Chỉ những đơn có cờ này = true mới được hoàn lại tồn kho khi hủy/xóa,
  // để tránh hoàn nhầm tồn kho cho các đơn hàng cũ (tạo trước khi có tính năng quản lý tồn kho).
  stockDeducted?: boolean;
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
  reply?: string;
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
  // Danh sách id sản phẩm khách đã thêm vào Yêu thích.
  wishlist?: string[];
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percent' | 'fixed';
  value: number;
  // Đơn hàng tối thiểu để áp dụng mã (VND). Để trống/0 nếu không giới hạn.
  minOrderValue?: number;
  // Giảm tối đa (VND) - chỉ áp dụng cho loại phần trăm, tránh giảm quá nhiều.
  maxDiscountAmount?: number;
  // Số lượt sử dụng tối đa. Để trống = không giới hạn.
  usageLimit?: number;
  usedCount: number;
  // Hạn sử dụng (ISO date string). Để trống = không hết hạn.
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
}

// Hồ sơ shipper đăng ký qua Cổng Shipper. Lưu trên Firestore (id = số điện thoại) để shipper
// đăng nhập lại trên máy khác vẫn giữ nguyên khu vực đã đăng ký, đồng thời cho phép hệ thống
// (và admin, nếu cần mở rộng sau này) biết mỗi shipper đang phụ trách khu vực nào.
export interface Shipper {
  phone: string;
  name: string;
  // Danh sách khu vực (quận/huyện/phường/tên đường...) mà shipper này đăng ký nhận đơn.
  // Đơn hàng chỉ hiện ra trong tab "Đơn sẵn sàng" của shipper nếu địa chỉ giao hàng của đơn
  // khớp (chứa) một trong các khu vực này.
  areas: string[];
  createdAt: string;
  updatedAt: string;
}

