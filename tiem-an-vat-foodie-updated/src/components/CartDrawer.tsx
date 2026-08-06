import { useState, useEffect } from 'react';
import { X, Trash2, ShoppingBag, ShieldCheck, Tag, Gift } from 'lucide-react';
import { CartItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: (discountCode: string, discountAmount: number) => void;
}

const DISCOUNT_CODES: { [key: string]: { type: 'percent' | 'fixed'; value: number; label: string; minOrder?: number } } = {
  'ANVATHE': { type: 'percent', value: 15, label: 'Giảm 15% tổng thực đơn' },
  'FREETSHIP': { type: 'fixed', value: 15000, label: 'Miễn phí vận chuyển (giảm 15k)' },
  'FOODIE50': { type: 'fixed', value: 50000, label: 'Tặng 50k cho đơn từ 200k', minOrder: 200000 }
};

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}: CartDrawerProps) {
  const [promoCode, setPromoCode] = useState('');
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [promoMessage, setPromoMessage] = useState({ text: '', type: 'success' });

  // Reset codes on close/empty
  useEffect(() => {
    if (cartItems.length === 0) {
      setAppliedCode(null);
      setPromoCode('');
      setPromoMessage({ text: '', type: 'success' });
    }
  }, [cartItems]);

  const itemsSubtotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const shippingFee = itemsSubtotal > 150000 || cartItems.length === 0 ? 0 : 15000;

  // Calculate discount
  let discountAmount = 0;
  if (appliedCode && DISCOUNT_CODES[appliedCode]) {
    const codeData = DISCOUNT_CODES[appliedCode];
    if (codeData.type === 'percent') {
      discountAmount = Math.round((itemsSubtotal * codeData.value) / 100);
    } else {
      discountAmount = codeData.value;
    }
  }

  const grandTotal = Math.max(0, itemsSubtotal + shippingFee - discountAmount);

  const handleApplyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    if (DISCOUNT_CODES[code]) {
      const info = DISCOUNT_CODES[code];
      if (info.minOrder && itemsSubtotal < info.minOrder) {
        setPromoMessage({
          text: `Mã ${code} chỉ áp dụng cho đơn hàng từ ${formatPrice(info.minOrder)} trở lên.`,
          type: 'error'
        });
        return;
      }
      setAppliedCode(code);
      setPromoMessage({
        text: `Đã áp dụng mã "${code}": ${info.label}!`,
        type: 'success'
      });
    } else {
      setPromoMessage({
        text: 'Mã giảm giá không hợp lệ hoặc đã hết hạn!',
        type: 'error'
      });
    }
  };

  const handleRemovePromo = () => {
    setAppliedCode(null);
    setPromoCode('');
    setPromoMessage({ text: '', type: 'success' });
  };

  const handleCheckoutClick = () => {
    onCheckout(appliedCode || '', discountAmount);
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
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
              
              {/* Sliding Cart Panel */}
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
                    <ShoppingBag className="h-5.5 w-5.5 text-gray-750 animate-bounce" />
                    Giỏ Hàng Của Bạn ({cartItems.length})
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
                  {cartItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                      <div className="p-4 rounded-full bg-gray-100 text-gray-400">
                        <ShoppingBag className="h-12 w-12" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-extrabold text-gray-800 text-sm">Giỏ hàng của bạn đang trống</p>
                        <p className="text-xs text-gray-400">Hãy lướt qua bộ sưu tập và chọn cho mình những sản phẩm nước hoa ưng ý nhất nhé!</p>
                      </div>
                      <button
                        onClick={onClose}
                        className="py-2.5 px-6 rounded-xl bg-gray-950 hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                      >
                        Mua sắm ngay
                      </button>
                    </div>
                  ) : (
                    cartItems.map((item) => (
                      <div key={item.product.id} className="flex items-center gap-4 p-3 rounded-2xl bg-gray-50 border border-gray-100 relative group">
                        {/* Item image */}
                        <div className="h-16 w-16 rounded-xl overflow-hidden shrink-0 bg-white border border-gray-100">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover"
                          />
                        </div>

                        {/* Item Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-gray-900 truncate pr-6">
                            {item.product.name}
                          </h4>
                          <span className="text-xs font-mono font-bold text-gray-950">
                            {formatPrice(item.product.price)}
                          </span>

                          {/* Control Qty */}
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center border border-gray-200 bg-white rounded-lg overflow-hidden text-[10px] shadow-2xs">
                              <button
                                onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                                className="px-2 py-1 text-gray-500 hover:bg-gray-100 font-bold"
                              >
                                -
                              </button>
                              <span className="px-3 py-0.5 font-bold text-gray-800">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                                disabled={item.quantity >= (item.product.stock ?? 0)}
                                className="px-2 py-1 text-gray-500 hover:bg-gray-100 font-bold disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                              >
                                +
                              </button>
                            </div>
                            {item.quantity >= (item.product.stock ?? 0) && (
                              <span className="text-[10px] font-bold text-amber-600">Đã đạt tối đa tồn kho</span>
                            )}
                            
                            <span className="text-xs font-semibold text-gray-500">
                              Tổng: <span className="text-gray-800 font-bold">{formatPrice(item.product.price * item.quantity)}</span>
                            </span>
                          </div>
                        </div>

                        {/* Remove item */}
                        <button
                          onClick={() => onRemoveItem(item.product.id)}
                          className="absolute top-3 right-3 p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                 {/* Footer calculations & codes */}
                {cartItems.length > 0 && (
                  <div className="p-6 border-t border-gray-150 bg-gray-50/50 space-y-4">
                    
                    {/* Discount Input */}
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Tag className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Mã giảm giá (AURAGIFT, FREESHIP...)"
                            value={promoCode}
                            disabled={appliedCode !== null}
                            onChange={(e) => setPromoCode(e.target.value)}
                            className="w-full text-xs font-semibold pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-hidden focus:border-gray-400 bg-white uppercase disabled:bg-gray-100 disabled:text-gray-400"
                          />
                        </div>
                        {appliedCode ? (
                          <button
                            onClick={handleRemovePromo}
                            className="px-4 py-2 rounded-xl text-xs font-bold border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          >
                            Xóa mã
                          </button>
                        ) : (
                          <button
                            onClick={handleApplyPromo}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                          >
                            Áp dụng
                          </button>
                        )}
                      </div>
                      
                      {promoMessage.text && (
                        <p className={`text-[11px] font-semibold flex items-center gap-1 ${
                          promoMessage.type === 'success' ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          <Gift className="h-3.5 w-3.5" />
                          {promoMessage.text}
                        </p>
                      )}

                      {!appliedCode && (
                        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                          {Object.keys(DISCOUNT_CODES).map((code) => (
                            <button
                              key={code}
                              onClick={() => {
                                setPromoCode(code);
                                // Automatically apply next frame
                                setTimeout(() => {
                                  setPromoCode(code);
                                }, 0);
                              }}
                              className="text-[9px] font-black border border-gray-200 bg-white hover:bg-gray-100 text-gray-800 rounded-lg px-2 py-1 whitespace-nowrap"
                            >
                              {code}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Summary list */}
                    <div className="space-y-2 border-b border-gray-150 pb-4 text-xs">
                      <div className="flex justify-between text-gray-500 font-semibold">
                        <span>Giá trị sản phẩm:</span>
                        <span className="text-gray-900 font-mono">{formatPrice(itemsSubtotal)}</span>
                      </div>
                      <div className="flex justify-between text-gray-500 font-semibold">
                        <span>Phí vận chuyển:</span>
                        <span className="text-gray-900 font-mono">
                          {shippingFee === 0 ? <span className="text-emerald-600 font-bold uppercase text-[10px]">Miễn phí</span> : formatPrice(shippingFee)}
                        </span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-emerald-600 font-bold">
                          <span className="flex items-center gap-1">Giảm giá mã quà tặng:</span>
                          <span className="font-mono">-{formatPrice(discountAmount)}</span>
                        </div>
                      )}
                      {shippingFee > 0 && (
                        <p className="text-[10px] text-gray-400 italic font-medium">Mua thêm {formatPrice(150000 - itemsSubtotal)} để được MIỄN PHÍ ship!</p>
                      )}
                    </div>

                    {/* Grand Total */}
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-sm font-black text-gray-900">Tổng cộng thanh toán:</span>
                      <span className="text-xl font-black text-gray-950 font-mono">
                        {formatPrice(grandTotal)}
                      </span>
                    </div>

                    {/* Checkout Button */}
                    <button
                      id="btn-cart-checkout"
                      onClick={handleCheckoutClick}
                      className="w-full py-3.5 px-5 rounded-2xl bg-gray-950 text-white font-extrabold text-sm uppercase tracking-wider hover:bg-black shadow-md shadow-gray-100 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShieldCheck className="h-5 w-5" />
                      <span>Tiến Hành Đặt Hàng</span>
                    </button>
                  </div>
                )}

              </motion.div>
            </div>

          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
