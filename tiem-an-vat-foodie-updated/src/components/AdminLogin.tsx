import React, { useState } from 'react';
import { ShieldCheck, Lock, User, Eye, EyeOff, Sparkles, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onBackToStore: () => void;
}

export default function AdminLogin({ onLoginSuccess, onBackToStore }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // LƯU Ý: đây chỉ là kiểm tra ở phía trình duyệt (client), không phải bảo mật thật sự -
    // xem ghi chú chi tiết trong file .env.example. Đọc từ biến môi trường thay vì viết cứng
    // để chủ shop có thể tự đổi tài khoản/mật khẩu mà không cần sửa code.
    const validUsername = (import.meta.env.VITE_ADMIN_USERNAME || 'admin').toLowerCase();
    const validPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';

    // Simulate authentication api call
    setTimeout(() => {
      if (username.trim().toLowerCase() === validUsername && password === validPassword) {
        localStorage.setItem('isAdminAuthenticated', 'true');
        onLoginSuccess();
      } else {
        setError('Tài khoản hoặc mật khẩu không chính xác! Vui lòng thử lại.');
      }
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-50 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gray-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 bg-gray-200/30 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-gray-250 shadow-xl shadow-gray-100/50 relative z-10"
      >
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-gray-950 flex items-center justify-center text-white shadow-lg shadow-gray-200">
            <ShieldCheck className="h-9 w-9" />
          </div>
          <h2 className="mt-6 text-3xl font-black text-gray-950 tracking-tight">
            Quản Trị Hệ Thống
          </h2>
          <p className="mt-2 text-sm text-gray-500 font-semibold">
            Vui lòng đăng nhập để quản lý sản phẩm và đơn hàng
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-xl bg-red-50 border border-red-100 text-xs font-semibold text-red-600"
            >
              ⚠️ {error}
            </motion.div>
          )}

          <div className="space-y-4">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label htmlFor="username" className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                Tên đăng nhập
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 hover:border-gray-400 focus:border-gray-950 focus:bg-white rounded-xl text-sm font-semibold text-gray-950 placeholder-gray-400 outline-hidden transition-all duration-200"
                  placeholder="Nhập tên đăng nhập..."
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 hover:border-gray-400 focus:border-gray-950 focus:bg-white rounded-xl text-sm font-semibold text-gray-950 placeholder-gray-400 outline-hidden transition-all duration-200"
                  placeholder="Nhập mật khẩu..."
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-black rounded-xl text-white bg-gray-950 hover:bg-black focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-gray-950 transition-all duration-200 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed shadow-md shadow-gray-200"
            >
              {isLoading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                <span className="flex items-center gap-2">
                  Đăng Nhập Quản Trị
                  <Sparkles className="h-4 w-4 text-white animate-pulse" />
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onBackToStore}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-gray-600 transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Quay lại Trang Cửa Hàng
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
