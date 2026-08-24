import React, { useState } from 'react';
import { X, Sparkles, Phone, User, MapPin, Award, CheckCircle, ShieldCheck, Clock, Truck, ShoppingBag, Eye, AlertCircle, Mail, Lock, Calculator } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppUser, Order } from '../types';

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: AppUser[];
  currentUser: AppUser | null;
  orders?: Order[];
  onLogin: (email: string, password: string, remember?: boolean) => boolean;
  onRegister: (name: string, email: string, phone: string, password: string, isMember: boolean) => AppUser;
  onLogout: () => void;
  message?: string;
}

export default function UserAuthModal({
  isOpen,
  onClose,
  users,
  currentUser,
  orders = [],
  onLogin,
  onRegister,
  onLogout,
  message
}: UserAuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [profileTab, setProfileTab] = useState<'membership' | 'orders'>('membership');

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Forgot password mini-flow
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');

  // Social login placeholder message
  const [socialMessage, setSocialMessage] = useState('');

  // Register form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regCaptchaInput, setRegCaptchaInput] = useState('');
  const [captchaNums, setCaptchaNums] = useState(() => ({
    a: Math.floor(Math.random() * 8) + 1,
    b: Math.floor(Math.random() * 8) + 1
  }));
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);

  const regenerateCaptcha = () => {
    setCaptchaNums({ a: Math.floor(Math.random() * 8) + 1, b: Math.floor(Math.random() * 8) + 1 });
    setRegCaptchaInput('');
  };

  const switchTab = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    setLoginError('');
    setRegError('');
    setShowForgotPassword(false);
    setForgotMessage('');
    setSocialMessage('');
    if (tab === 'register') regenerateCaptcha();
  };

  if (!isOpen) return null;

  const handleSocialLogin = (provider: string) => {
    setSocialMessage(`Đăng nhập bằng ${provider} sẽ sớm được hỗ trợ. Vui lòng đăng nhập bằng Email trong lúc này nhé!`);
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    const exists = users.some(u => (u.email || '').toLowerCase() === forgotEmail.trim().toLowerCase());
    if (exists) {
      setForgotMessage('Đã gửi hướng dẫn đặt lại mật khẩu tới email của bạn. Vui lòng kiểm tra hộp thư!');
    } else {
      setForgotMessage('Không tìm thấy tài khoản nào với email này. Vui lòng kiểm tra lại hoặc đăng ký mới.');
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginEmail.trim() || !loginPassword.trim()) return;

    const success = onLogin(loginEmail.trim(), loginPassword, rememberMe);
    if (success) {
      setLoginSuccess(true);
      setTimeout(() => {
        setLoginSuccess(false);
        setLoginEmail('');
        setLoginPassword('');
        onClose();
      }, 1500);
    } else {
      const emailExists = users.some(u => (u.email || '').toLowerCase() === loginEmail.trim().toLowerCase());
      setLoginError(
        emailExists
          ? 'Mật khẩu không đúng. Vui lòng thử lại hoặc dùng "Quên mật khẩu?".'
          : 'Email này chưa được đăng ký thành viên Esy Club. Vui lòng chuyển sang tab Đăng Ký để tạo tài khoản nhé!'
      );
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regName.trim() || !regEmail.trim() || !regPhone.trim() || !regPassword || !regConfirmPassword) {
      setRegError('Vui lòng nhập đầy đủ các trường thông tin bắt buộc.');
      return;
    }

    if (regPassword.length < 6) {
      setRegError('Mật khẩu cần có ít nhất 6 ký tự.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.');
      return;
    }

    if (parseInt(regCaptchaInput, 10) !== captchaNums.a + captchaNums.b) {
      setRegError('Kết quả xác minh chưa đúng. Vui lòng thử lại.');
      regenerateCaptcha();
      return;
    }

    // Check if email already registered
    const emailExists = users.some(u => (u.email || '').toLowerCase() === regEmail.trim().toLowerCase());
    if (emailExists) {
      setRegError('Email này đã được sử dụng. Vui lòng chuyển sang tab Đăng Nhập.');
      return;
    }

    // Check if phone already registered
    const phoneExists = users.some(u => u.phone === regPhone.trim());
    if (phoneExists) {
      setRegError('Số điện thoại này đã được sử dụng. Vui lòng chuyển sang tab Đăng Nhập.');
      return;
    }

    onRegister(regName.trim(), regEmail.trim(), regPhone.trim(), regPassword, true);
    setRegSuccess(true);
    setTimeout(() => {
      setRegSuccess(false);
      setRegName('');
      setRegEmail('');
      setRegPhone('');
      setRegPassword('');
      setRegConfirmPassword('');
      setRegCaptchaInput('');
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="auth-modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-950/60 backdrop-blur-xs transition-opacity" 
          aria-hidden="true"
          onClick={onClose}
        />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          className="inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full w-full p-6 sm:p-8 relative"
        >
          {/* Close Icon */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Account Details View (if already logged in) */}
          {currentUser ? (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-gray-250">
                  Trang Quản Trị Người Dùng (Cá Nhân)
                </span>
                <div className="h-12 w-12 rounded-full bg-gray-150 text-gray-900 border border-gray-250 flex items-center justify-center font-bold text-lg mx-auto">
                  {currentUser.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-serif font-black text-gray-950 tracking-tight">{currentUser.name}</h3>
                  <p className="text-xs text-gray-400 font-semibold mt-0.5">Thành viên Esy Club VIP</p>
                </div>
              </div>

              {/* Profile Sub-tabs */}
              <div className="flex border-b border-gray-150 gap-2">
                <button
                  onClick={() => setProfileTab('membership')}
                  className={`flex-1 pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer text-center ${
                    profileTab === 'membership'
                      ? 'border-gray-950 text-gray-950'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Thẻ Thành Viên
                </button>
                <button
                  onClick={() => setProfileTab('orders')}
                  className={`flex-1 pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                    profileTab === 'orders'
                      ? 'border-gray-950 text-gray-950'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Truck className="h-3.5 w-3.5" />
                  Theo Dõi Đơn Hàng ({orders.filter(o => o.customerPhone === currentUser.phone).length})
                </button>
              </div>

              <div className="space-y-4">
                {profileTab === 'membership' ? (
                  <div className="space-y-5">
                    {/* Membership Card representation */}
                    {currentUser.isMember ? (
                      <div className="relative overflow-hidden rounded-2xl p-5 text-white shadow-xl bg-gradient-to-tr from-gray-900 via-gray-950 to-neutral-800 border border-gray-800 flex flex-col justify-between h-44">
                        {/* Decorative silk waves inside the card */}
                        <div className="absolute inset-0 bg-radial from-white/10 to-transparent pointer-events-none" />
                        <div className="absolute top-[-20%] right-[-10%] w-32 h-32 rounded-full bg-slate-100/10 blur-xl pointer-events-none" />
                        
                        <div className="flex justify-between items-start relative z-10">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 block">ESY CLUB MEMBERSHIP</span>
                            <span className="inline-flex items-center gap-1 bg-yellow-500/10 text-yellow-500 font-extrabold text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-yellow-500/20 mt-1">
                              ✨ Hạng Gold Member
                            </span>
                          </div>
                          <span className="text-lg font-serif tracking-[0.2em] text-white">ESY</span>
                        </div>

                        <div className="space-y-1 relative z-10">
                          <span className="text-[9px] font-medium text-gray-500 block uppercase tracking-wider">Mã số thẻ</span>
                          <p className="text-sm font-mono font-bold tracking-widest text-gray-200">
                            {currentUser.memberCardNo?.replace('AURA', 'ESY') || 'ESY-XXXX-XXXX'}
                          </p>
                        </div>

                        <div className="flex justify-between items-end border-t border-white/10 pt-2.5 relative z-10">
                          <div>
                            <span className="text-[9px] text-gray-500 block uppercase">Họ & Tên</span>
                            <p className="text-xs font-bold text-white tracking-wide">{currentUser.name}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-gray-500 block uppercase">Điểm tích lũy</span>
                            <p className="text-xs font-black text-yellow-400 font-mono">{currentUser.memberPoints} điểm</p>
                            <p className="text-[10px] font-bold text-gray-400 font-mono">
                              ≈ {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(currentUser.memberPoints * 10)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-center space-y-3">
                        <p className="text-xs text-gray-500 font-semibold">Bạn hiện là khách hàng thường và chưa đăng ký Thẻ thành viên VIP.</p>
                        <button
                          onClick={() => {
                            onRegister(currentUser.name, currentUser.email || '', currentUser.phone, currentUser.password || '', true);
                          }}
                          className="w-full py-2.5 rounded-xl bg-gray-950 text-white font-bold text-xs uppercase tracking-wider hover:bg-black transition-colors cursor-pointer"
                        >
                          Kích Hoạt Thẻ Thành Viên Miễn Phí
                        </button>
                      </div>
                    )}

                    {/* User Address & Phone */}
                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-3 font-semibold text-gray-600">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>Số điện thoại: <span className="text-gray-900">{currentUser.phone}</span></span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-500 shrink-0 mt-0.5" />
                        <span>Địa chỉ giao hàng mặc định: <br />
                        <span className="text-gray-900 block mt-0.5">{currentUser.address}</span>
                        </span>
                      </div>
                    </div>

                    {/* Member privileges list */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">Đặc quyền thẻ Esy Club</span>
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-600 font-bold">
                        <div className="flex items-center gap-1.5 bg-gray-50 p-2 rounded-lg border border-gray-150">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>Tích điểm 5% đơn hàng</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-gray-50 p-2 rounded-lg border border-gray-150">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>Miễn phí giao hàng &gt;150k</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-gray-50 p-2 rounded-lg border border-gray-150">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>Ưu đãi sinh nhật VIP</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-gray-50 p-2 rounded-lg border border-gray-150">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>Hỗ trợ kỹ thuật 24/7</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">Trạng thái xử lý & Giao hàng</span>
                    <div className="max-h-[340px] overflow-y-auto pr-1 space-y-3 scrollbar-thin">
                      {orders.filter(o => o.customerPhone === currentUser.phone).length === 0 ? (
                        <div className="text-center py-10 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 text-gray-400 space-y-2">
                          <ShoppingBag className="h-8 w-8 mx-auto opacity-35" />
                          <p className="text-xs font-bold">Bạn chưa có đơn đặt hàng nào!</p>
                          <p className="text-[10px] text-gray-400">Đơn hàng của bạn sau khi thanh toán sẽ hiển thị đầy đủ quy trình ở đây.</p>
                        </div>
                      ) : (
                        orders.filter(o => o.customerPhone === currentUser.phone).map((order) => (
                          <div key={order.id} className="p-3.5 bg-gray-50/60 rounded-2xl border border-gray-150 hover:bg-gray-50 transition-colors space-y-3.5">
                            <div className="flex justify-between items-center text-[10px] font-bold text-gray-500">
                              <span>Mã đơn: <span className="text-gray-950 font-mono font-black">{order.id}</span></span>
                              <span>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                            </div>

                            {/* Product List summary */}
                            <div className="pt-1.5 border-t border-gray-200/50 text-[11px] font-bold text-gray-800 space-y-1">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center">
                                  <span className="truncate max-w-[200px] font-medium text-gray-600">{item.productName}</span>
                                  <span className="text-gray-500">x{item.quantity}</span>
                                </div>
                              ))}
                            </div>

                            {/* Total Price */}
                            <div className="flex justify-between items-center pt-1.5 border-t border-gray-200/50 text-xs">
                              <span className="font-bold text-gray-400">Tổng thanh toán:</span>
                              <span className="font-black text-gray-950 font-mono">{order.total.toLocaleString('vi-VN')}đ</span>
                            </div>

                            {/* Tracker Stepper */}
                            <div className="pt-2 border-t border-gray-200/50 space-y-3">
                              {order.orderStatus === 'CANCELLED' ? (
                                <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-red-600 bg-red-50/50 py-1.5 px-2.5 rounded-lg border border-red-100">
                                  <span>❌ Đơn hàng đã bị hủy</span>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {/* Visual 4-step progress bar */}
                                  <div className="grid grid-cols-4 gap-1 relative text-[8px] text-center font-bold text-gray-400">
                                    {/* Line backgrounds */}
                                    <div className="absolute top-2.5 left-[12%] right-[12%] h-[2px] bg-gray-200 -z-0" />
                                    <div className="absolute top-2.5 left-[12%] h-[2px] bg-gray-950 -z-0 transition-all duration-500" style={{
                                      width: order.orderStatus === 'RECEIVED' ? '0%' :
                                             order.orderStatus === 'PREPARING' ? '33%' :
                                             order.orderStatus === 'DELIVERING' ? '66%' :
                                             order.orderStatus === 'COMPLETED' ? '100%' : '0%'
                                    }} />

                                    {/* Step 1: Chờ xác nhận */}
                                    <div className="space-y-1 relative z-10 flex flex-col items-center">
                                      <div className={`h-5 w-5 rounded-full flex items-center justify-center border text-[9px] ${
                                        ['RECEIVED', 'PREPARING', 'DELIVERING', 'COMPLETED'].includes(order.orderStatus)
                                          ? 'bg-gray-950 border-gray-950 text-white shadow-xs'
                                          : 'bg-white border-gray-250 text-gray-400'
                                      }`}>
                                        1
                                      </div>
                                      <span className={['RECEIVED', 'PREPARING', 'DELIVERING', 'COMPLETED'].includes(order.orderStatus) ? 'text-gray-950 font-extrabold' : ''}>
                                        Chờ xác nhận
                                      </span>
                                    </div>

                                    {/* Step 2: Chờ lấy hàng */}
                                    <div className="space-y-1 relative z-10 flex flex-col items-center">
                                      <div className={`h-5 w-5 rounded-full flex items-center justify-center border text-[9px] ${
                                        ['PREPARING', 'DELIVERING', 'COMPLETED'].includes(order.orderStatus)
                                          ? 'bg-gray-950 border-gray-950 text-white shadow-xs'
                                          : 'bg-white border-gray-250 text-gray-400'
                                      }`}>
                                        2
                                      </div>
                                      <span className={['PREPARING', 'DELIVERING', 'COMPLETED'].includes(order.orderStatus) ? 'text-gray-950 font-extrabold' : ''}>
                                        Chờ lấy hàng
                                      </span>
                                    </div>

                                    {/* Step 3: Chờ giao hàng */}
                                    <div className="space-y-1 relative z-10 flex flex-col items-center">
                                      <div className={`h-5 w-5 rounded-full flex items-center justify-center border text-[9px] ${
                                        ['DELIVERING', 'COMPLETED'].includes(order.orderStatus)
                                          ? 'bg-gray-950 border-gray-950 text-white shadow-xs'
                                          : 'bg-white border-gray-250 text-gray-400'
                                      }`}>
                                        3
                                      </div>
                                      <span className={['DELIVERING', 'COMPLETED'].includes(order.orderStatus) ? 'text-gray-950 font-extrabold' : ''}>
                                        Chờ giao hàng
                                      </span>
                                    </div>

                                    {/* Step 4: Đánh giá */}
                                    <div className="space-y-1 relative z-10 flex flex-col items-center">
                                      <div className={`h-5 w-5 rounded-full flex items-center justify-center border text-[9px] ${
                                        order.orderStatus === 'COMPLETED'
                                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs animate-pulse'
                                          : 'bg-white border-gray-250 text-gray-400'
                                      }`}>
                                        {order.orderStatus === 'COMPLETED' ? '✓' : '4'}
                                      </div>
                                      <span className={order.orderStatus === 'COMPLETED' ? 'text-emerald-600 font-extrabold' : ''}>
                                        Đánh giá
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Thông tin shipper đang giao (nếu có) */}
                              {order.orderStatus === 'DELIVERING' && order.shipperName && (
                                <div className="mt-3 flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                                  <Truck className="h-4 w-4 text-blue-600 shrink-0" />
                                  <p className="text-[11px] text-blue-800 font-semibold">
                                    Shipper <span className="font-black">{order.shipperName}</span> đang giao hàng cho bạn
                                    {order.shipperPhone && (
                                      <> · <a href={`tel:${order.shipperPhone}`} className="underline">{order.shipperPhone}</a></>
                                    )}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Thời gian dự kiến giao hàng */}
                            {order.orderStatus !== 'CANCELLED' && order.estimatedDeliveryAt && (
                              <div className="flex items-center justify-between gap-2 text-[10px] font-bold bg-amber-50/70 text-amber-800 border border-amber-150 py-2 px-3 rounded-xl">
                                <span className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5 shrink-0" />
                                  {order.orderStatus === 'COMPLETED' ? 'Đã giao trong khoảng:' : 'Dự kiến giao hàng:'}
                                </span>
                                <span className="text-amber-900 font-black">
                                  {new Date(order.estimatedDeliveryAt).toLocaleDateString('vi-VN')}{' '}
                                  {new Date(order.estimatedDeliveryAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Logout CTA */}
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full py-3 rounded-xl border border-red-250 text-red-600 bg-red-50/50 hover:bg-red-50 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Đăng Xuất Khỏi Tài Khoản
              </button>
            </div>
          ) : (
            /* Login / Register view */
            <div className="space-y-6">

              {message && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold leading-relaxed flex items-start gap-2">
                  <span className="text-amber-500 shrink-0">⚠️</span>
                  <span>{message}</span>
                </div>
              )}

              <AnimatePresence mode="wait">
                {activeTab === 'login' ? (
                  <motion.div
                    key="login-view"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-5"
                  >
                    <h2 className="text-2xl font-serif font-black text-gray-950 tracking-tight text-center">
                      Đăng Nhập
                    </h2>

                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                      {loginSuccess && (
                        <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-150 flex items-center gap-1.5">
                          <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>Đăng nhập thành công! Đang đồng bộ hóa...</span>
                        </div>
                      )}

                      {loginError && (
                        <div className="p-3.5 rounded-2xl bg-red-50 text-red-600 text-xs font-bold border border-red-150 leading-relaxed">
                          ⚠️ {loginError}
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Email</label>
                        <div className="relative flex items-center">
                          <Mail className="h-4 w-4 text-gray-400 absolute left-3" />
                          <input
                            type="email"
                            required
                            placeholder="email@example.com"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            className="w-full text-xs font-semibold p-3.5 pl-10 rounded-xl border border-gray-200 focus:outline-hidden focus:border-gray-400 bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Password</label>
                        <div className="relative flex items-center">
                          <Lock className="h-4 w-4 text-gray-400 absolute left-3" />
                          <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            className="w-full text-xs font-semibold p-3.5 pl-10 rounded-xl border border-gray-200 focus:outline-hidden focus:border-gray-400 bg-white"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-[11px] font-semibold text-gray-600 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="h-3.5 w-3.5 rounded-sm border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                          />
                          Ghi nhớ đăng nhập
                        </label>
                        <button
                          type="button"
                          onClick={() => { setShowForgotPassword(!showForgotPassword); setForgotMessage(''); }}
                          className="text-[11px] font-bold text-gray-500 hover:text-gray-900 underline underline-offset-2 cursor-pointer"
                        >
                          Quên mật khẩu?
                        </button>
                      </div>

                      <AnimatePresence>
                        {showForgotPassword && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-150 space-y-2.5">
                              <p className="text-[11px] font-semibold text-gray-500">Nhập email để nhận hướng dẫn đặt lại mật khẩu.</p>
                              {forgotMessage && (
                                <p className="text-[11px] font-bold text-gray-800">{forgotMessage}</p>
                              )}
                              <div className="flex gap-2">
                                <input
                                  type="email"
                                  placeholder="email@example.com"
                                  value={forgotEmail}
                                  onChange={(e) => setForgotEmail(e.target.value)}
                                  className="flex-1 text-xs font-semibold p-2.5 rounded-lg border border-gray-200 focus:outline-hidden bg-white"
                                />
                                <button
                                  type="button"
                                  onClick={handleForgotPasswordSubmit}
                                  className="bg-gray-950 hover:bg-black text-white text-[10px] font-extrabold px-3 py-2.5 rounded-lg tracking-wider uppercase shrink-0 cursor-pointer"
                                >
                                  Gửi
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <button
                        type="submit"
                        className="w-full py-3.5 rounded-xl bg-gray-950 text-white font-extrabold text-xs uppercase tracking-widest hover:bg-black transition-colors cursor-pointer"
                      >
                        Đăng Nhập
                      </button>

                      <div className="relative flex items-center py-1">
                        <div className="flex-1 border-t border-gray-200" />
                        <span className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">hoặc</span>
                        <div className="flex-1 border-t border-gray-200" />
                      </div>

                      {socialMessage && (
                        <div className="p-3 rounded-xl bg-gray-50 border border-gray-150 text-[10px] font-semibold text-gray-600 leading-relaxed">
                          {socialMessage}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleSocialLogin('Google')}
                        className="w-full py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <span className="font-black text-sm text-gray-700">G</span>
                        Đăng nhập với Google
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSocialLogin('Facebook')}
                        className="w-full py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-blue-600 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        Đăng nhập với Facebook
                      </button>

                      <div className="pt-1 border-t border-gray-150 text-center">
                        <p className="text-xs text-gray-500 font-semibold pt-3">
                          Chưa có tài khoản?{' '}
                          <button
                            type="button"
                            onClick={() => switchTab('register')}
                            className="text-gray-950 font-bold underline underline-offset-2 cursor-pointer"
                          >
                            Đăng ký ngay
                          </button>
                        </p>
                      </div>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="register-view"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-5"
                  >
                    <h2 className="text-2xl font-serif font-black text-gray-950 tracking-tight text-center">
                      Đăng Ký Tài Khoản
                    </h2>

                    <form onSubmit={handleRegisterSubmit} className="space-y-4">
                      {regSuccess && (
                        <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-150 flex items-center gap-1.5">
                          <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>Đăng ký thành viên Esy Club thành công!</span>
                        </div>
                      )}

                      {regError && (
                        <div className="p-3.5 rounded-2xl bg-red-50 text-red-600 text-xs font-bold border border-red-150">
                          ⚠️ {regError}
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Họ và tên</label>
                        <div className="relative flex items-center">
                          <User className="h-4 w-4 text-gray-400 absolute left-3" />
                          <input
                            type="text"
                            required
                            placeholder="Nguyễn Văn A"
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                            className="w-full text-xs font-semibold p-3.5 pl-10 rounded-xl border border-gray-200 focus:outline-hidden focus:border-gray-400 bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Email</label>
                        <div className="relative flex items-center">
                          <Mail className="h-4 w-4 text-gray-400 absolute left-3" />
                          <input
                            type="email"
                            required
                            placeholder="email@example.com"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            className="w-full text-xs font-semibold p-3.5 pl-10 rounded-xl border border-gray-200 focus:outline-hidden focus:border-gray-400 bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Số điện thoại</label>
                        <div className="relative flex items-center">
                          <Phone className="h-4 w-4 text-gray-400 absolute left-3" />
                          <input
                            type="tel"
                            required
                            placeholder="09xxxxxxxx"
                            value={regPhone}
                            onChange={(e) => setRegPhone(e.target.value)}
                            className="w-full text-xs font-semibold p-3.5 pl-10 rounded-xl border border-gray-200 focus:outline-hidden focus:border-gray-400 bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Password</label>
                        <div className="relative flex items-center">
                          <Lock className="h-4 w-4 text-gray-400 absolute left-3" />
                          <input
                            type="password"
                            required
                            placeholder="Tối thiểu 6 ký tự"
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            className="w-full text-xs font-semibold p-3.5 pl-10 rounded-xl border border-gray-200 focus:outline-hidden focus:border-gray-400 bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Xác nhận mật khẩu</label>
                        <div className="relative flex items-center">
                          <Lock className="h-4 w-4 text-gray-400 absolute left-3" />
                          <input
                            type="password"
                            required
                            placeholder="Nhập lại mật khẩu"
                            value={regConfirmPassword}
                            onChange={(e) => setRegConfirmPassword(e.target.value)}
                            className="w-full text-xs font-semibold p-3.5 pl-10 rounded-xl border border-gray-200 focus:outline-hidden focus:border-gray-400 bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                          Xác minh: {captchaNums.a} + {captchaNums.b} = ?
                        </label>
                        <div className="relative flex items-center">
                          <Calculator className="h-4 w-4 text-gray-400 absolute left-3" />
                          <input
                            type="text"
                            inputMode="numeric"
                            required
                            placeholder="Nhập kết quả phép tính"
                            value={regCaptchaInput}
                            onChange={(e) => setRegCaptchaInput(e.target.value)}
                            className="w-full text-xs font-semibold p-3.5 pl-10 rounded-xl border border-gray-200 focus:outline-hidden focus:border-gray-400 bg-white"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3.5 rounded-xl bg-gray-950 text-white font-extrabold text-xs uppercase tracking-widest hover:bg-black transition-colors cursor-pointer"
                      >
                        Đăng Ký
                      </button>

                      <div className="pt-1 border-t border-gray-150 text-center">
                        <p className="text-xs text-gray-500 font-semibold pt-3">
                          Đã có tài khoản?{' '}
                          <button
                            type="button"
                            onClick={() => switchTab('login')}
                            className="text-gray-950 font-bold underline underline-offset-2 cursor-pointer"
                          >
                            Đăng nhập ngay
                          </button>
                        </p>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          )}

        </motion.div>
      </div>
    </div>
  );
}
