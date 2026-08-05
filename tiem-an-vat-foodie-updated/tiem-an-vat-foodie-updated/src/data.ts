import { Product, Review, Order, Category, ContactMessage } from './types';

export const CATEGORIES: Category[] = [
  { id: 'all', name: 'Tất cả', icon: 'Grid' },
  { id: 'notebook_paper', name: 'Sổ và giấy các loại', icon: 'BookOpen' },
  { id: 'digital_devices', name: 'Máy in, máy scan, máy chiếu', icon: 'Cpu' }
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'paper-1',
    name: 'Giấy in nhiệt TEM nhãn Dán DP23, cho máy DP23,DP27 ,DP26 ,DP30, B21 Niimbot.....',
    description: 'Sổ tay thiết kế bìa cứng Kraft mộc mạc, giấy dầy 120gsm chống nhòe mực hoàn hảo, ruột Dot Grid chuyên dụng để ghi chép kế hoạch, làm Bullet Journal tiện lợi cho cá nhân và văn phòng.',
    price: 25000,
    originalPrice: 27000,
    image: 'https://down-vn.img.susercontent.com/file/sg-11134201-22110-vr4xj5xpsckvc2@resize_w900_nl.webp',
    images: [
      'https://down-vn.img.susercontent.com/file/577d5de17530836e16609393ed2a86bb@resize_w900_nl.webp',
      'https://down-vn.img.susercontent.com/file/0c4f6b695e63dd7c17307795a85ea320@resize_w900_nl.webp',
      'https://down-vn.img.susercontent.com/file/ed22dc33fd59c2edbfdabbea5afd83b5@resize_w900_nl.webp'
    ],
    category: 'Sổ và giấy các loại',
    rating: 0,
    reviewsCount: 0,
    isAvailable: true,
    soldCount: 0
  },
  {
    id: 'paper-2',
    name: 'Giấy in nhiệt tự dính A6 (Khổ 100x150mm - 350 tờ)',
    description: 'Giấy in nhiệt trực tiếp chất lượng cao dạng tệp gấp nếp tiện dụng, keo dán siêu dính chống nước, chống cào xước. Thích hợp in tem vận đơn gửi hàng Shopee, Lazada, TikTok cực sắc nét không cần mực.',
    price: 110000,
    originalPrice: 150000,
    image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=600',
    images: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600'
    ],
    category: 'notebook_paper',
    rating: 0,
    reviewsCount: 0,
    isAvailable: true,
    soldCount: 0
  },
  {
    id: 'paper-3',
    name: 'Cuộn giấy in nhiệt mini màu sắc 57x30mm (Hộp 3 cuộn)',
    description: 'Giấy nhiệt màu pastel cực kỳ dễ thương dành cho máy in nhiệt mini cầm tay P10. Phù hợp in hình ảnh, danh sách việc cần làm, ghi chú dán vào sổ tay lưu niệm xinh xắn.',
    price: 45000,
    originalPrice: 60000,
    image: 'https://images.unsplash.com/photo-1603481588273-2f908a9a7a1b?auto=format&fit=crop&q=80&w=600',
    images: [
      'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80&w=600'
    ],
    category: 'notebook_paper',
    rating: 0,
    reviewsCount: 0,
    isAvailable: true,
    soldCount: 0
  },
  {
    id: 'printer-1',
    name: 'Máy in nhiệt mini cầm tay EsyPrint P10',
    description: 'Máy in nhiệt cầm tay mini kết nối Bluetooth không dây cho điện thoại, in hóa đơn nhanh, in tem nhãn dán sticker, nhãn dán sổ tay tiện lợi, kích thước nhỏ gọn bỏ túi mang đi mọi nơi dễ dàng.',
    price: 490000,
    originalPrice: 650000,
    image: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&q=80&w=600',
    images: [
      'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=600'
    ],
    category: 'digital_devices',
    rating: 0,
    reviewsCount: 0,
    isAvailable: true,
    soldCount: 0
  },
  {
    id: 'printer-2',
    name: 'Máy in hóa đơn nhiệt Epson TM-T82III',
    description: 'Máy in hóa đơn nhiệt cao cấp cho siêu thị, cửa hàng bán lẻ, nhà hàng và quán cafe. Tốc độ in siêu tốc, cơ chế tự động cắt giấy thông minh, kết nối cổng USB/LAN cực kỳ ổn định và bền bỉ.',
    price: 2950000,
    originalPrice: 3300000,
    image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=600',
    category: 'digital_devices',
    rating: 0,
    reviewsCount: 0,
    isAvailable: true,
    soldCount: 0
  },
  {
    id: 'printer-3',
    name: 'Máy in tem nhãn mã vạch nhiệt EsyPro L350',
    description: 'Máy in tem mã vạch, nhãn vận đơn thương mại điện tử chuyên nghiệp kết nối máy tính qua cổng USB. Công nghệ in nhiệt trực tiếp không cần mực, hỗ tả khổ giấy A6 chuẩn của các sàn Shopee, Lazada, TikTok Shop.',
    price: 1450000,
    originalPrice: 1750000,
    image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&q=80&w=600',
    category: 'digital_devices',
    rating: 0,
    reviewsCount: 0,
    isAvailable: true,
    soldCount: 0
  },
  {
    id: 'scanner-1',
    name: 'Máy quét mã vạch không dây EsyScan W100',
    description: 'Máy quét mã vạch 1D & 2D cầm tay không dây (quét cực nhạy cả mã QR Code trên điện thoại và bao bì). Kết nối bộ thu USB 2.4G tiện dụng, chống bụi nước chuẩn IP54, pin sạc Lithium dung lượng lớn dùng liên tục cả tuần.',
    price: 890000,
    originalPrice: 1100000,
    image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=600',
    category: 'digital_devices',
    rating: 0,
    reviewsCount: 0,
    isAvailable: true,
    soldCount: 0
  },
  {
    id: 'scanner-2',
    name: 'Máy Scan tài liệu phẳng Canon Lide 300',
    description: 'Máy quét hình ảnh và tài liệu phẳng tốc độ cao, độ phân giải quang học 2400x2400 dpi siêu sắc nét. Thiết kế mỏng nhẹ hiện đại, thích hợp quét hồ sơ văn phòng, hợp đồng pháp lý, ảnh thẻ cá nhân nhanh chóng qua cổng USB tiện lợi.',
    price: 1750000,
    originalPrice: 1950000,
    image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=600',
    category: 'digital_devices',
    rating: 0,
    reviewsCount: 0,
    isAvailable: true,
    soldCount: 0
  },
  {
    id: 'projector-1',
    name: 'Máy chiếu mini di động thông minh EsyView M2',
    description: 'Máy chiếu mini bỏ túi chạy hệ điều hành Android TV tích hợp sẵn ứng dụng giải trí Youtube, Netflix, K+. Độ sáng sắc nét, tự động lấy nét và căn góc chiếu vuông vức thông minh, kết nối Wifi và Bluetooth cực nhanh.',
    price: 3200000,
    originalPrice: 3800000,
    image: 'https://images.unsplash.com/photo-1535016120720-40c646be5580?auto=format&fit=crop&q=80&w=600',
    category: 'digital_devices',
    rating: 0,
    reviewsCount: 0,
    isAvailable: true,
    soldCount: 0
  },
  {
    id: 'projector-2',
    name: 'Máy chiếu văn phòng hội thảo Epson EB-E01',
    description: 'Máy chiếu văn phòng độ sáng cao 3300 Ansi Lumens chuyên dụng cho lớp học, văn phòng công ty và hội trường lớn. Công nghệ chiếu 3LCD cho màu sắc rực rỡ, chân thực, tuổi thọ bóng đèn chiếu lên đến 12.000 giờ.',
    price: 8900000,
    originalPrice: 9800000,
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=600',
    category: 'digital_devices',
    rating: 0,
    reviewsCount: 0,
    isAvailable: true,
    soldCount: 0
  }
];

const INITIAL_REVIEWS: Review[] = [];

const INITIAL_ORDERS: Order[] = [];

export function getLocalData<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(`esyshop_${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error loading data from localStorage', error);
    return defaultValue;
  }
}

export function saveLocalData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`esyshop_${key}`, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving data to localStorage', error);
  }
}

// Initial state getters
export function getProducts(): Product[] {
  const products = getLocalData<Product[]>('products', INITIAL_PRODUCTS);
  return products;
}

export function getReviews(): Review[] {
  return getLocalData<Review[]>('reviews', INITIAL_REVIEWS);
}

export function getOrders(): Order[] {
  return getLocalData<Order[]>('orders', INITIAL_ORDERS);
}

const INITIAL_CONTACT_MESSAGES: ContactMessage[] = [
  {
    id: 'msg-1',
    name: 'Phan Quốc Việt',
    email: 'vietpq@gmail.com',
    message: 'Mình muốn liên hệ nhập sỉ số lượng lớn máy in nhiệt cầm tay EsyPrint P10 và máy quét mã vạch để phân phối cho các cửa hàng tạp hóa tại miền Trung, xin bảng giá sỉ và chính sách chiết khấu đại lý.',
    createdAt: '2026-06-25T16:40:00Z',
    status: 'PENDING'
  },
  {
    id: 'msg-2',
    name: 'Nguyễn Diệu Hương',
    email: 'huongnd@hotmail.com',
    message: 'Máy in tem nhãn EsyPro L350 dùng rất ổn định! Cho mình hỏi EsyShop có chính sách hỗ trợ kỹ thuật cài đặt driver từ xa qua Ultraview không ạ?',
    createdAt: '2026-06-24T11:20:00Z',
    status: 'READ'
  }
];

export function getContactMessages(): ContactMessage[] {
  return getLocalData<ContactMessage[]>('contact_messages', INITIAL_CONTACT_MESSAGES);
}
