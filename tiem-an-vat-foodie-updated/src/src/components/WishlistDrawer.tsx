import { Heart, X, ShoppingCart, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onRemove: (productId: string) => void;
  onAddToCart: (product: Product) => void;
  onOpenDetails: (product: Product) => void;
}

export default function WishlistDrawer({
  isOpen,
  onClose,
  products,
  onRemove,
  onAddToCart,
  onOpenDetails
}: WishlistDrawerProps) {
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="wishlist-title" role="dialog" aria-modal="true">
          <div className="absolute inset-0 overflow-hidden">

            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-gray-900/50 backdrop-blur-xs transition-opacity"
            />

            <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">

              {/* Sliding Panel */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="w-screen max-w-md bg-white flex flex-col shadow-2xl"
              >

                {/* Header */}
                <div className="p-6 border-b border-gray-150 flex items-center justify-between">
                  <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                    <Heart className="h-5.5 w-5.5 text-rose-600 fill-rose-600" />
                    Sản Phẩm Yêu Thích ({products.length})
                  </h2>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {products.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                      <div className="p-4 rounded-full bg-gray-100 text-gray-400">
                        <Heart className="h-12 w-12" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-extrabold text-gray-800 text-sm">Chưa có sản phẩm yêu thích nào</p>
                        <p className="text-xs text-gray-400">Bấm biểu tượng trái tim trên sản phẩm để lưu lại xem sau nhé!</p>
                      </div>
                      <button
                        onClick={onClose}
                        className="py-2.5 px-6 rounded-xl bg-gray-950 hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                      >
                        Khám phá sản phẩm
                      </button>
                    </div>
                  ) : (
                    products.map((product) => {
                      const isInStock = product.isAvailable && (product.stock ?? 0) > 0;
                      return (
                        <div key={product.id} className="flex items-center gap-4 p-3 rounded-2xl bg-gray-50 border border-gray-100 relative group">
                          {/* Item image */}
                          <div
                            className="h-16 w-16 rounded-xl overflow-hidden shrink-0 bg-white border border-gray-100 cursor-pointer"
                            onClick={() => { onOpenDetails(product); onClose(); }}
                          >
                            <img
                              src={product.image}
                              alt={product.name}
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-cover"
                            />
                          </div>

                          {/* Item Info */}
                          <div className="flex-1 min-w-0">
                            <h4
                              className="text-xs font-bold text-gray-900 truncate pr-6 cursor-pointer hover:underline"
                              onClick={() => { onOpenDetails(product); onClose(); }}
                            >
                              {product.name}
                            </h4>
                            <span className="text-xs font-mono font-bold text-gray-950 block mt-0.5">
                              {formatPrice(product.price)}
                            </span>

                            <div className="flex items-center gap-2 mt-2">
                              <button
                                disabled={!isInStock}
                                onClick={() => onAddToCart(product)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-950 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-black active:scale-95 disabled:bg-gray-200 disabled:text-gray-400 transition-all cursor-pointer"
                              >
                                <ShoppingCart className="h-3 w-3" />
                                {isInStock ? 'Thêm giỏ hàng' : 'Hết hàng'}
                              </button>
                            </div>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => onRemove(product.id)}
                            className="absolute top-2.5 right-2.5 p-1.5 rounded-lg text-gray-300 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                            aria-label="Bỏ yêu thích"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
