import React, { useState } from 'react';
import { X, Star, MessageSquare, Send, ShoppingCart, Calendar, CornerDownRight, TrendingUp, Sparkles, CheckCircle2, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { Product, Review } from '../types';
import { motion } from 'motion/react';

interface ProductDetailModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  reviews: Review[];
  onAddReview: (productId: string, userName: string, rating: number, comment: string) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onQuickOrder: (product: Product, quantity: number) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
}

export default function ProductDetailModal({
  product,
  isOpen,
  onClose,
  reviews,
  onAddReview,
  onAddToCart,
  onQuickOrder,
  isWishlisted = false,
  onToggleWishlist
}: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [userName, setUserName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const allImages = [product.image, ...(product.images || [])].filter(Boolean);
  const availableStock = product.stock ?? 0;
  const isInStock = product.isAvailable && availableStock > 0;

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIdx(prev => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIdx(prev => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  React.useEffect(() => {
  if (isOpen) {
    setIsDescExpanded(false);
    setQuantity(1);
    setActiveImageIdx(0);

    // Nếu mở từ email thì tự cuộn xuống phần đánh giá
    const params = new URLSearchParams(window.location.search);

    if (params.get("review")) {

      setTimeout(() => {

        document
          .getElementById("review-section")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });

      }, 500);

    }
  }
}, [isOpen, product?.id]);

  if (!isOpen) return null;

  const productReviews = reviews.filter(r => r.productId === product.id && r.status !== 'HIDDEN');

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !comment.trim()) {
      setMessage('Vui lòng điền đầy đủ tên và nhận xét của bạn!');
      return;
    }

    setSubmitting(true);
    // Simulate short network delay
    setTimeout(() => {
      onAddReview(product.id, userName, rating, comment);
      setUserName('');
      setRating(5);
      setComment('');
      setSubmitting(false);
      setMessage('Đánh giá của bạn đã được gửi thành công!');
      
      // Auto-clear message
      setTimeout(() => setMessage(''), 4000);
    }, 400);
  };

  const handleAddToCartClick = () => {
    onAddToCart(product, quantity);
    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
    }, 2000);
  };

  const handleQuickOrderClick = () => {
    onQuickOrder(product, quantity);
    onClose();
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-gray-950/70 backdrop-blur-xs transition-opacity" 
          aria-hidden="true"
          onClick={onClose}
        />

        {/* This element is to trick the browser into centering the modal contents. */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          className="inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full w-full relative"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/90 hover:bg-white text-gray-500 hover:text-gray-950 shadow-md border border-gray-100 transition-all active:scale-90"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Wishlist button */}
          {onToggleWishlist && (
            <button
              onClick={() => onToggleWishlist(product.id)}
              className={`absolute top-4 right-16 z-20 p-2 rounded-full shadow-md border transition-all active:scale-90 ${
                isWishlisted
                  ? 'bg-rose-600 border-rose-600 text-white'
                  : 'bg-white/90 hover:bg-white border-gray-100 text-gray-500 hover:text-rose-600'
              }`}
              aria-label="Yêu thích"
            >
              <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-white' : ''}`} />
            </button>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
            
            {/* 1. PRODUCT IMAGE GALLERY COLUMN */}
            <div className="md:col-span-5 relative bg-gray-50 flex flex-col items-center justify-center p-6 border-b md:border-b-0 md:border-r border-gray-100 select-none">
              <div className="w-full aspect-square rounded-3xl overflow-hidden bg-white shadow-xs border border-gray-150 flex items-center justify-center p-4 relative group">
                <img
                  src={allImages[activeImageIdx]}
                  alt={`${product.name} ${activeImageIdx + 1}`}
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-full object-contain transition-all duration-300"
                  key={activeImageIdx}
                />

                {/* Left/Right Buttons */}
                {allImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevImage}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white text-gray-700 hover:text-gray-950 shadow-md border border-gray-100 hover:scale-105 active:scale-90 transition-all cursor-pointer"
                      title="Ảnh trước"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextImage}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white text-gray-700 hover:text-gray-950 shadow-md border border-gray-100 hover:scale-105 active:scale-90 transition-all cursor-pointer"
                      title="Ảnh tiếp theo"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}

                {/* Counter indicator */}
                {allImages.length > 1 && (
                  <span className="absolute bottom-3 right-3 bg-gray-950/80 text-white text-[9px] font-black tracking-widest px-2.5 py-1 rounded-full uppercase">
                    {activeImageIdx + 1} / {allImages.length}
                  </span>
                )}
              </div>

              {/* Thumbnails list below */}
              {allImages.length > 1 && (
                <div className="flex gap-2.5 mt-4 justify-center overflow-x-auto max-w-full py-1 scrollbar-none">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIdx(idx)}
                      className={`relative h-13 w-13 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer bg-white flex-shrink-0 flex items-center justify-center p-1 ${
                        activeImageIdx === idx 
                          ? 'border-emerald-500 shadow-xs scale-105' 
                          : 'border-gray-200 hover:border-gray-300 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="max-w-full max-h-full object-contain rounded-lg" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              )}

              {/* Status & Category Badge Overlay */}
              <div className="absolute top-8 left-8 flex flex-col gap-2">
                <span className="text-[10px] font-black text-white uppercase tracking-widest bg-gray-950 px-3 py-1 rounded-full shadow-sm border border-gray-800">
                  {product.category === 'notebook_paper' ? '📚 Sổ & Giấy' : product.category === 'digital_devices' ? '💻 Thiết Bị Số' : '📦 Sản phẩm'}
                </span>
                {product.originalPrice && (
                  <span className="text-[9px] font-extrabold text-red-700 uppercase bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg shadow-2xs">
                    🔥 GIẢM GIÁ
                  </span>
                )}
              </div>
            </div>

            {/* 2. PRODUCT DETAILS & ACTIONS COLUMN */}
            <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between max-h-[85vh] overflow-y-auto scrollbar-thin">
              <div className="space-y-6">
                
                {/* Product Name & Brand */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <span>EsyShop Vietnam</span>
                    <span>•</span>
                    <span className="text-emerald-600 font-extrabold">Chính hãng 100%</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-serif font-black text-gray-950 tracking-tight leading-tight">
                    {product.name}
                  </h2>
                </div>

                {/* Rating & Sales (Đánh Giá & Lượt mua) */}
                <div className="flex flex-wrap items-center gap-4 bg-gray-50 border border-gray-150 p-3 rounded-2xl">
                  {/* Đánh giá */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < Math.round(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                      ))}
                    </div>
                    <span className="text-xs font-black text-gray-900">{product.rating.toFixed(1)}</span>
                    <span className="text-[11px] text-gray-400 font-bold">({productReviews.length} nhận xét)</span>
                  </div>

                  <div className="hidden sm:block h-4 w-px bg-gray-200" />

                  {/* Lượt mua / Đã bán */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold">
                    <TrendingUp className="h-4 w-4 text-emerald-600 animate-pulse" />
                    <span>Lượt mua:</span>
                    <span className="text-gray-950 font-black">{product.soldCount} sản phẩm</span>
                  </div>
                </div>

                {/* Price tag */}
                <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Giá bán ưu đãi</p>
                    <div className="flex items-baseline gap-2.5 flex-wrap">
                      <span className="text-xl sm:text-2xl md:text-3xl font-black text-gray-950 tracking-tight">
                        {product.priceMax ? `${formatPrice(product.price)} - ${formatPrice(product.priceMax)}` : formatPrice(product.price)}
                      </span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-400 line-through font-semibold">
                          {formatPrice(product.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Product Info Description */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-gray-800" />
                    Thông Tin Chi Tiết Sản Phẩm
                  </h4>
                  <div className="relative">
                    <p className={`text-xs sm:text-sm text-gray-600 leading-relaxed font-semibold ${!isDescExpanded ? 'line-clamp-3' : ''}`}>
                      {product.description}
                    </p>
                    {product.description && product.description.length > 100 && (
                      <button
                        type="button"
                        onClick={() => setIsDescExpanded(!isDescExpanded)}
                        className="mt-2 text-xs font-black text-gray-950 hover:text-gray-800 hover:underline transition-all uppercase tracking-wider cursor-pointer inline-flex items-center gap-1"
                      >
                        {isDescExpanded ? 'Thu gọn' : 'Xem tiếp'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Cart & Order Controls */}
                {isInStock ? (
                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    {/* Quantity Picker */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Chọn số lượng:</span>
                      <div className="flex items-center border border-gray-250 bg-white rounded-xl overflow-hidden shadow-2xs">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="px-3 py-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-950 font-black transition-colors"
                        >
                          -
                        </button>
                        <span className="px-4 py-1.5 font-black text-gray-950 text-sm w-12 text-center">
                          {quantity}
                        </span>
                        <button
                          onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                          disabled={quantity >= availableStock}
                          className="px-3 py-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-950 font-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] font-bold text-gray-400 -mt-2">
                      Còn <span className="text-gray-700">{availableStock}</span> sản phẩm trong kho
                    </p>

                    {/* Notification on successfully adding to cart */}
                    {addedSuccess && (
                      <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Đã thêm {quantity} sản phẩm vào giỏ hàng thành công!
                      </div>
                    )}

                    {/* Dual Action CTA Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {/* Thêm giỏ hàng */}
                      <button
                        onClick={handleAddToCartClick}
                        className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl border-2 border-gray-950 text-gray-950 font-black text-xs uppercase tracking-wider hover:bg-gray-50 active:scale-95 transition-all cursor-pointer shadow-2xs"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        <span>Thêm Giỏ Hàng</span>
                      </button>

                      {/* Đặt hàng ngay */}
                      <button
                        onClick={handleQuickOrderClick}
                        className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl bg-gray-950 text-white font-black text-xs uppercase tracking-wider hover:bg-black active:scale-95 transition-all cursor-pointer shadow-md shadow-gray-250"
                      >
                        <span>Đặt Hàng Ngay</span>
                        <span className="text-[11px] font-normal opacity-90">• {product.priceMax ? 'từ ' : ''}{formatPrice(product.price * quantity)}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 p-4 rounded-2xl bg-gray-100 text-gray-500 text-center font-bold text-sm">
                    Sản phẩm hiện tại tạm hết hàng. Vui lòng liên hệ hỗ trợ!
                  </div>
                )}
              </div>

              {/* 3. REVIEWS & FEEDBACK ACCORDION IN MODAL */}
              <div
                  id="review-section"
                  className="mt-10 border-t border-gray-150 pt-8 space-y-6"
>
                <h3 className="text-sm font-black text-gray-950 uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="h-4.5 w-4.5 text-gray-800" />
                  Đánh Giá Thực Tế Từ Khách Hàng
                </h3>

                {/* List Reviews */}
                <div className="space-y-4 max-h-[220px] overflow-y-auto pr-2 scrollbar-thin">
                  {productReviews.length === 0 ? (
                    <p className="text-xs text-gray-400 italic text-center py-4">Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên đánh giá!</p>
                  ) : (
                    productReviews.map((rev) => (
                      <div key={rev.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-gray-950">{rev.userName}</span>
                          <span className="text-gray-400 font-mono flex items-center gap-1 font-bold text-[10px]">
                            <Calendar className="h-3 w-3" />
                            {formatDate(rev.createdAt)}
                          </span>
                        </div>
                        {/* stars */}
                        <div className="flex text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3 w-3 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                          ))}
                        </div>
                        <p className="text-gray-600 leading-relaxed font-semibold">{rev.comment}</p>

                        {/* Admin Reply */}
                        {rev.reply && (
                          <div className="mt-2.5 p-3 rounded-xl bg-white border border-gray-150 text-[11px] text-gray-800 flex items-start gap-1.5 ml-4">
                            <CornerDownRight className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-black text-gray-950">EsyShop Phản Hồi:</span> {rev.reply}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Submit New Review Form */}
                <form onSubmit={handleSubmitReview} className="space-y-3.5 p-5 rounded-2xl bg-gray-50 border border-gray-150">
                  <h4 className="text-xs font-black text-gray-950 uppercase tracking-widest">Viết Đánh Giá Của Bạn</h4>
                  
                  {message && (
                    <div className={`p-2.5 rounded-xl text-xs font-bold ${message.includes('thành công') ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-red-50 text-red-800 border border-red-100'}`}>
                      {message}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Tên của bạn..."
                      required
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full text-xs font-bold p-3 rounded-xl border border-gray-200 focus:outline-hidden focus:border-gray-400 bg-white"
                    />
                    {/* Stars Selector */}
                    <div className="flex items-center gap-1 bg-white p-2 rounded-xl border border-gray-200 justify-center">
                      <span className="text-[11px] font-bold text-gray-400 mr-1.5 uppercase">Số sao:</span>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <button
                          type="button"
                          key={i}
                          onClick={() => setRating(i + 1)}
                          className="p-0.5 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star className={`h-4 w-4 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative">
                    <textarea
                      placeholder="Nhận xét của bạn về chất lượng sản phẩm, dịch vụ hỗ trợ kỹ thuật..."
                      required
                      rows={2}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full text-xs font-bold p-3 pr-12 rounded-xl border border-gray-200 focus:outline-hidden focus:border-gray-400 bg-white"
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="absolute bottom-3 right-3 p-2 rounded-xl bg-gray-950 hover:bg-black text-white shadow-xs disabled:bg-gray-300 transition-colors cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </form>

              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </div>
  );
}

