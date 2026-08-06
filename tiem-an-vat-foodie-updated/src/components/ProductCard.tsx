import React from 'react';
import { ShoppingCart, Flame, Star, Zap } from 'lucide-react';
import { Product } from '../types';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onQuickOrder: (product: Product) => void;
  onOpenDetails: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onQuickOrder,
  onOpenDetails
}) => {

  // Sản phẩm chỉ thực sự có thể mua khi admin bật "Mở bán" VÀ còn tồn kho > 0
  const isInStock = product.isAvailable && (product.stock ?? 0) > 0;

  // Calculate discount percent
  const discountPercent = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  // Format currency helper
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-300 transition-all duration-300 flex flex-col group h-full relative"
    >
      {/* Discount / Avail Badge */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
        {discountPercent > 0 && (
          <span className="bg-gray-950 text-white text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
            -{discountPercent}%
          </span>
        )}
        {product.soldCount > 1000 && (
          <span className="bg-gray-100 text-gray-800 text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md border border-gray-200">
            <Flame className="h-3 w-3 text-gray-500 animate-bounce" />
            Bán chạy
          </span>
        )}
      </div>

      {/* Product Image */}
      <div 
        className="relative aspect-square overflow-hidden bg-gray-50 cursor-pointer"
        onClick={() => onOpenDetails(product)}
      >
        <img
          src={product.image}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {!isInStock && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
            <span className="text-white font-black text-sm uppercase tracking-widest px-4 py-2 border-2 border-white rounded-xl">
              Tạm hết hàng
            </span>
          </div>
        )}
      </div>

      {/* Product Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          
          {/* Rating and Sold */}
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold tracking-wide">
            <div className="flex items-center gap-1 text-gray-900">
              <Star className="h-3.5 w-3.5 fill-gray-900 text-gray-900" />
              <span className="font-bold text-gray-900">{product.rating.toFixed(1)}</span>
              <span className="text-gray-400">({product.reviewsCount})</span>
            </div>
            <div className="text-[11px] font-medium text-gray-400">
              Đã bán <span className="font-bold text-gray-700">{product.soldCount >= 1000 ? `${(product.soldCount/1000).toFixed(1)}k` : product.soldCount}</span>
            </div>
          </div>

          {/* Product Title */}
          <h3 
            onClick={() => onOpenDetails(product)}
            className="text-base font-serif font-bold text-gray-950 group-hover:text-gray-700 transition-colors cursor-pointer line-clamp-1 tracking-wide"
          >
            {product.name}
          </h3>

          {/* Product Description */}
          <p className="text-xs text-gray-400 font-medium line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Pricing & CTA */}
        <div className="mt-5 pt-4 border-t border-gray-100 space-y-4">
          
          {/* Pricing */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-sm sm:text-base md:text-lg font-black text-gray-950">
              {product.priceMax ? `${formatPrice(product.price)} - ${formatPrice(product.priceMax)}` : formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          {/* CTA Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              disabled={!isInStock}
              id={`btn-quick-order-${product.id}`}
              onClick={() => onQuickOrder(product)}
              className="flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl bg-gray-950 text-white text-xs font-bold uppercase tracking-wider hover:bg-black active:scale-95 disabled:bg-gray-200 disabled:text-gray-400 transition-all cursor-pointer"
            >
              <Zap className="h-3.5 w-3.5 text-white animate-pulse" />
              <span>Đặt Hàng</span>
            </button>
            <button
              disabled={!isInStock}
              id={`btn-add-cart-${product.id}`}
              onClick={() => onAddToCart(product)}
              className="flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl bg-gray-50 text-gray-800 text-xs font-bold uppercase tracking-wider hover:bg-gray-100 active:scale-95 disabled:bg-gray-100 disabled:text-gray-400 transition-all cursor-pointer border border-gray-200"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>Thêm Giỏ</span>
            </button>
          </div>

        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
