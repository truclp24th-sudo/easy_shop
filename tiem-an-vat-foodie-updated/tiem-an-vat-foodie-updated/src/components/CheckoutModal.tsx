import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Smartphone, Truck, QrCode, Sparkles, Loader2, ArrowRight, User, Award, KeyRound, UserPlus } from 'lucide-react';
import { CartItem, AppUser } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  discountCode: string;
  onPlaceOrder: (customerData: {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  customerNotes: string;
  paymentMethod: 'COD' | 'ONLINE';
  paymentStatus: 'PENDING' | 'PAID';
  isMemberRegistrationRequested?: boolean;
}) => void;
  currentUser: AppUser | null;
  users: AppUser[];
  onLogin: (email: string, password: string, remember?: boolean) => boolean;
  onRegister: (name: string, email: string, phone: string, password: string, isMember: boolean) => AppUser;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  cartItems,
  subtotal,
  shippingFee,
  discountAmount,
  discountCode,
  onPlaceOrder,
  currentUser,
  users,
  onLogin,
  onRegister
}: CheckoutModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState(''); // Thêm dòng này
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');
  const [isMemberRegistrationRequested, setIsMemberRegistrationRequested] = useState(true);

  // Inline Quick Login states
  const [showLoginInline, setShowLoginInline] = useState(false);
  const [inlineEmail, setInlineEmail] = useState('');
  const [inlinePassword, setInlinePassword] = useState('');
  const [inlineError, setInlineError] = useState('');
  const [inlineSuccess, setInlineSuccess] = useState('');
  
  // Online Payment states
  const [isPaying, setIsPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState('');

  // Autofill if user logs in
  useEffect(() => {
    if (currentUser && isOpen) {
      setCustomerName(currentUser.name);
      setCustomerPhone(currentUser.phone);
      setCustomerAddress(currentUser.address);
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const handleInlineLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setInlineError('');
    setInlineSuccess('');

    if (!inlineEmail.trim() || !inlinePassword.trim()) return;
    const success = onLogin(inlineEmail.trim(), inlinePassword);
    if (success) {
      setInlineSuccess('Đăng nhập thành công! Đã tự động điền thông tin.');
      setShowLoginInline(false);
      setInlineEmail('');
      setInlinePassword('');
    } else {
      setInlineError('Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại hoặc điền form dưới để mua và đăng ký tự động.');
    }
  };

  const totalToPay = Math.max(0, subtotal + shippingFee - discountAmount);

  const handleSimulatePayment = () => {
    setIsPaying(true);
    setTimeout(() => {
      setIsPaying(false);
      setPaySuccess(true);
    }, 1800);
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) return;

    // Check payment status
    const paymentStatus = paymentMethod === 'ONLINE' && paySuccess ? 'PAID' : 'PENDING';
    
    // Create random order id to show the user
    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    setPlacedOrderId(orderId);

    // Call callback to persist
onPlaceOrder({
  customerName,
  customerPhone,
  customerEmail,
  customerAddress,
  customerNotes,
  paymentMethod,
  paymentStatus,
  isMemberRegistrationRequested: !currentUser && isMemberRegistrationRequested // only register if not already logged in
});

    setOrderComplete(true);
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="checkout-modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-950/60 backdrop-blur-xs transition-opacity" 
          aria-hidden="true"
          onClick={() => { if (!orderComplete) onClose(); }}
        />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          className="inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full w-full p-6 sm:p-8 relative"
        >
          
          {/* Close Icon */}
          {!orderComplete && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}

          <AnimatePresence mode="wait">
            {!orderComplete ? (
              <motion.div
                key="checkout-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-black text-gray-950 tracking-tight flex items-center gap-2">
                    <Sparkles className="h-5.5 w-5.5 text-gray-700 animate-spin" />
                    Thanh Toán Đơn Hàng
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">Vui lòng điền thông tin giao hàng để EsyShop hỏa tốc gửi bạn nhé!</p>
                </div>

                <form onSubmit={handleSubmitOrder} className="space-y-5">
                  
                  {/* Member Login or Status Banner */}
                  {currentUser ? (
                    <div className="p-4 rounded-2xl bg-neutral-950 text-white border border-neutral-800 space-y-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-xl bg-white/10 text-yellow-400 flex items-center justify-center font-extrabold text-xs shrink-0">
                          ✨
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Thành viên: {currentUser.name}</p>
                          <p className="text-[10px] text-gray-400 font-semibold">Tài khoản SĐT: {currentUser.phone}</p>
                        </div>
                      </div>
                      {currentUser.isMember && (
                        <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full self-start sm:self-center">
                          🏆 Esy VIP: {currentUser.memberPoints} điểm
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 space-y-3 shadow-xs">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 bg-gray-950 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                            Esy Club Benefit
                          </span>
                          <h4 className="text-xs font-bold text-gray-950">Bạn đã có tài khoản thành viên?</h4>
                          <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                            Đăng nhập nhanh để tự động điền địa chỉ giao hàng và tích điểm cho đơn này!
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowLoginInline(!showLoginInline);
                            setInlineError('');
                            setInlineSuccess('');
                          }}
                          className="py-1.5 px-3 rounded-lg border border-gray-250 bg-white hover:bg-gray-50 text-[10px] font-bold text-gray-800 tracking-wide transition-all shadow-2xs shrink-0 cursor-pointer"
                        >
                          {showLoginInline ? 'Đóng' : 'Đăng Nhập'}
                        </button>
                      </div>

                      {/* Inline login form block */}
                      <AnimatePresence>
                        {showLoginInline && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden border-t border-gray-200/60 pt-3"
                          >
                            <div className="space-y-2">
                              {inlineError && (
                                <p className="text-[10px] text-red-500 font-bold">⚠️ {inlineError}</p>
                              )}
                              {inlineSuccess && (
                                <p className="text-[10px] text-emerald-600 font-bold">✓ {inlineSuccess}</p>
                              )}
                              <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                  type="email"
                                  placeholder="Email đã đăng ký"
                                  value={inlineEmail}
                                  onChange={(e) => setInlineEmail(e.target.value)}
                                  className="flex-1 text-xs font-semibold p-2.5 rounded-lg border border-gray-200 focus:outline-hidden bg-white text-gray-900"
                                />
                                <input
                                  type="password"
                                  placeholder="Mật khẩu"
                                  value={inlinePassword}
                                  onChange={(e) => setInlinePassword(e.target.value)}
                                  className="flex-1 text-xs font-semibold p-2.5 rounded-lg border border-gray-200 focus:outline-hidden bg-white text-gray-900"
                                />
                                <button
                                  type="button"
                                  onClick={handleInlineLogin}
                                  className="bg-gray-950 hover:bg-black text-white text-[10px] font-extrabold px-3 py-2.5 rounded-lg tracking-wider uppercase shrink-0 cursor-pointer"
                                >
                                  Đăng Nhập
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Customer Information */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500 block">Thông Tin Người Nhận</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 mb-1">Họ tên khách hàng *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ví dụ: Nguyễn Văn A"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full text-xs font-semibold p-3 rounded-xl border border-gray-200 focus:outline-hidden focus:border-gray-400 bg-white"
                        />
                      </div>
                    <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">
                      Số điện thoại liên lạc *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Ví dụ: 0854848058"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full text-xs font-semibold p-3 rounded-xl border border-gray-200 focus:outline-hidden focus:border-gray-400 bg-white"
                    />
                  </div>

                  {/* Thêm ngay bên dưới */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="Ví dụ: example@gmail.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full text-xs font-semibold p-3 rounded-xl border border-gray-200 focus:outline-hidden focus:border-gray-400 bg-white"
                    />
                  </div>

                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">Địa chỉ nhận hàng (Số nhà, Tên đường, Quận) *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: 123 Nguyễn Trãi, Phường 2, Quận 5, TP.HCM"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        className="w-full text-xs font-semibold p-3 rounded-xl border border-gray-200 focus:outline-hidden focus:border-gray-400 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">Ghi chú cho cửa hàng (Ví dụ: Đóng gói hộp quà, giao giờ hành chính...)</label>
                      <input
                        type="text"
                        placeholder="Có thể để trống..."
                        value={customerNotes}
                        onChange={(e) => setCustomerNotes(e.target.value)}
                        className="w-full text-xs font-semibold p-3 rounded-xl border border-gray-200 focus:outline-hidden focus:border-gray-400 bg-white"
                      />
                    </div>

                    {/* Membership selection checkbox for guest users */}
                    {!currentUser && (
                      <div className="p-3.5 rounded-2xl border border-gray-200 bg-gray-50 flex items-start gap-2.5 mt-2">
                        <input
                          type="checkbox"
                          id="isMemberRegistrationRequested"
                          checked={isMemberRegistrationRequested}
                          onChange={(e) => setIsMemberRegistrationRequested(e.target.checked)}
                          className="mt-1 h-4 w-4 rounded-sm border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                        />
                        <label htmlFor="isMemberRegistrationRequested" className="text-xs font-semibold text-gray-700 leading-relaxed cursor-pointer select-none">
                          <span className="text-gray-950 font-black block">Đăng ký thành viên Esy Club (Tùy chọn)</span>
                          Đăng ký cực nhanh với thông tin trên, nhận ngay 100 điểm chào mừng và tích lũy điểm thưởng cho đơn này để quy đổi quà!
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Payment Methods */}
                  <div className="space-y-3 pt-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500 block">Phương Thức Thanh Toán</span>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {/* COD */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('COD')}
                        className={`p-4 rounded-2xl border-2 text-left flex items-start gap-3 transition-all cursor-pointer ${
                          paymentMethod === 'COD'
                            ? 'border-gray-950 bg-gray-50 text-gray-950'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <Truck className={`h-5 w-5 shrink-0 mt-0.5 ${paymentMethod === 'COD' ? 'text-gray-900' : 'text-gray-400'}`} />
                        <div>
                          <p className="text-xs font-bold">Thanh Toán COD</p>
                          <p className="text-[10px] text-gray-400 font-medium mt-0.5">Thanh toán khi nhận thiết bị</p>
                        </div>
                      </button>

                      {/* Online VietQR */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('ONLINE')}
                        className={`p-4 rounded-2xl border-2 text-left flex items-start gap-3 transition-all cursor-pointer ${
                          paymentMethod === 'ONLINE'
                            ? 'border-gray-950 bg-gray-50 text-gray-950'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <QrCode className={`h-5 w-5 shrink-0 mt-0.5 ${paymentMethod === 'ONLINE' ? 'text-gray-900' : 'text-gray-400'}`} />
                        <div>
                          <p className="text-xs font-bold">Quét Mã VietQR</p>
                          <p className="text-[10px] text-gray-400 font-medium mt-0.5">Ví MoMo / VNPAY / Ngân hàng</p>
                        </div>
                      </button>
                    </div>

                    {/* QR Code Container when Online chosen */}
                    {paymentMethod === 'ONLINE' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 mt-3"
                      >
                        <div className="h-32 w-32 rounded-xl bg-white border border-gray-100 p-2 shrink-0 flex items-center justify-center relative group">
                          {/* Simulated QR Code representation */}
                          <div className="absolute inset-2 bg-radial from-gray-200 to-transparent opacity-20 group-hover:opacity-0 transition-opacity" />
                          <div className="grid grid-cols-4 gap-1 w-full h-full opacity-80">
                            {Array.from({ length: 16 }).map((_, i) => (
                              <div 
                                key={i} 
                                className={`rounded-sm ${(i % 3 === 0 || i === 1 || i === 14) ? 'bg-gray-900' : 'bg-transparent'} ${
                                  (i === 0 || i === 3 || i === 12 || i === 15) ? 'bg-gray-950 border border-gray-900' : ''
                                }`} 
                              />
                            ))}
                          </div>
                          {/* Centered App Brand */}
                          <div className="absolute h-8 w-8 rounded-lg bg-gray-950 text-white flex items-center justify-center font-bold text-[8px] border-2 border-white shadow-md">
                            QR
                          </div>
                        </div>

                        <div className="space-y-2 text-center sm:text-left flex-1">
                          <span className="inline-block bg-gray-100 text-gray-850 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border border-gray-200">
                            Chuyển Khoản Nhanh
                          </span>
                          <p className="text-xs text-gray-700 font-bold">Quét mã bằng Ví điện tử (MoMo) hoặc App Ngân hàng</p>
                          <div className="text-[11px] text-gray-500 font-semibold leading-relaxed">
                            <p>Chủ TK: <span className="text-gray-900 font-bold">ESYSHOP</span></p>
                            <p>Số tiền: <span className="text-gray-950 font-extrabold">{formatPrice(totalToPay)}</span></p>
                            <p>Nội dung: <span className="text-gray-900 font-bold">ESY {placedOrderId || 'SHOP'}</span></p>
                          </div>

                          {/* Simulation Payment Controller */}
                          {!paySuccess ? (
                            <button
                              type="button"
                              onClick={handleSimulatePayment}
                              disabled={isPaying}
                              className="w-full sm:w-auto mt-2 py-2 px-4 rounded-xl text-[11px] font-bold text-white bg-gray-950 hover:bg-black active:scale-95 disabled:bg-gray-300 flex items-center justify-center gap-1 cursor-pointer"
                            >
                              {isPaying ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  <span>Đang xác nhận GD...</span>
                                </>
                              ) : (
                                <>
                                  <Smartphone className="h-3.5 w-3.5" />
                                  <span>Đã quét và thanh toán</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs bg-emerald-50 border border-emerald-200 py-1.5 px-3 rounded-lg w-full sm:w-auto inline-flex">
                              <CheckCircle className="h-4 w-4 shrink-0 fill-emerald-100" />
                              <span>Đã thanh toán thành công!</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Pricing Summary footer */}
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-2">
                    <div className="flex justify-between text-gray-500 font-medium">
                      <span>Tổng tiền sản phẩm ({cartItems.length} sản phẩm):</span>
                      <span className="font-bold text-gray-800">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500 font-medium">
                      <span>Phí giao tận nơi:</span>
                      <span className="font-bold text-gray-800">
                        {shippingFee === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : formatPrice(shippingFee)}
                      </span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-bold">
                        <span>Giảm giá mã quà tặng ({discountCode}):</span>
                        <span>-{formatPrice(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm text-gray-950 font-black border-t border-gray-200 pt-2 mt-1">
                      <span>Tổng giá trị đơn hàng:</span>
                      <span className="text-gray-950 text-base">{formatPrice(totalToPay)}</span>
                    </div>
                  </div>

                  {/* Submission CTA */}
                  <button
                    type="submit"
                    disabled={paymentMethod === 'ONLINE' && !paySuccess}
                    className="w-full py-3.5 rounded-2xl bg-gray-950 text-white font-extrabold text-xs uppercase tracking-widest active:scale-95 transition-all shadow-md shadow-gray-200 flex items-center justify-center gap-2 cursor-pointer disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                  >
                    <span>Đặt Hàng Ngay</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  {paymentMethod === 'ONLINE' && !paySuccess && (
                    <p className="text-[10px] text-red-500 font-semibold text-center mt-1">
                      * Bạn cần quét mã QR và click xác nhận thanh toán thành công để tiếp tục đặt hàng trực tuyến!
                    </p>
                  )}

                </form>
              </motion.div>
            ) : (
              <motion.div
                key="order-success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8 space-y-6"
              >
                <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow-lg">
                  ✓
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-gray-950 tracking-tight">Đặt Hàng Thành Công!</h3>
                  <p className="text-xs text-gray-500">
                    Cảm ơn <span className="font-bold text-gray-900">{customerName}</span> đã chọn EsyShop!
                  </p>
                </div>

                {/* Ticket container */}
                <div className="max-w-sm mx-auto p-5 rounded-2xl bg-gray-50 border border-gray-100 text-xs text-left space-y-3 font-medium">
                  <div className="flex justify-between border-b border-dashed border-gray-200 pb-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    <span>Mã Đơn Hàng:</span>
                    <span className="text-gray-800 font-black">{placedOrderId}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Số điện thoại:</span>
                    <p className="text-gray-800 font-bold">{customerPhone}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Địa chỉ nhận hàng:</span>
                    <p className="text-gray-800 font-bold">{customerAddress}</p>
                  </div>
                  <div className="flex justify-between border-t border-dashed border-gray-200 pt-2 font-bold">
                    <span className="text-gray-500">Tổng thanh toán:</span>
                    <span className="text-gray-950 font-black text-sm">{formatPrice(totalToPay)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-[10px]">
                    <span className="text-gray-500">Hình thức:</span>
                    <span className="text-gray-800 uppercase bg-gray-200/50 px-2 py-0.5 rounded-md">
                      {paymentMethod === 'ONLINE' ? 'Trực tuyến (MoMo/VNPAY)' : 'Thanh toán COD'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-full">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    Đơn hàng đang được chuẩn bị hỏa tốc!
                  </div>
                  <p className="text-[10px] text-gray-400 max-w-xs mx-auto">
                    Bạn có thể theo dõi tiến độ đơn hàng bằng cách chuyển qua nút **"Trang Quản Trị"** ở thanh menu để quản lý trạng thái của đơn hàng này.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setOrderComplete(false);
                    setPaySuccess(false);
                    onClose();
                  }}
                  className="py-3 px-8 rounded-xl bg-gray-950 hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Tiếp Tục Mua Sắm
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </div>
    </div>
  );
}
