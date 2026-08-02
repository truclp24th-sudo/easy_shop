import React, { useState } from 'react';
import { Phone, MapPin, Mail, Clock, Send, Sparkles, Map, Compass, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface ContactSectionProps {
  onSubmitContact?: (name: string, email: string, message: string) => void;
}

export default function ContactSection({ onSubmitContact }: ContactSectionProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    setSubmitting(true);
    
    // Call custom callback if provided to sync with App state / Admin messages
    if (onSubmitContact) {
      onSubmitContact(name, email, message);
    }

    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setName('');
      setEmail('');
      setMessage('');
      
      // Auto close message success notification
      setTimeout(() => setSubmitted(false), 5000);
    }, 800);
  };

  return (
    <section id="contact" className="py-20 bg-gray-50 border-t border-gray-250 overflow-hidden relative">
      
      {/* Background blur decorative element */}
      <div className="absolute top-[20%] left-[-15%] w-[45vw] h-[45vw] rounded-full bg-gray-200/20 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-4">
          <span className="text-xs font-bold text-gray-800 uppercase tracking-widest bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200/50">
            Trải nghiệm & đóng góp
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-black text-gray-950 tracking-tight">
            Ý Kiến & Đánh Giá Của Khách Hàng
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 font-semibold">
            Chúng tôi luôn trân trọng mọi ý kiến đóng góp, phản hồi dịch vụ và đánh giá trải nghiệm mua sắm của bạn để cải tiến chất lượng ngày một tốt hơn.
          </p>
        </div>

        {/* 1. ĐÁNH GIÁ CỦA KHÁCH HÀNG (BẢNG DÀI NGANG) */}
        <div className="w-full bg-white border border-gray-250 rounded-3xl shadow-xs overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left label part */}
            <div className="lg:col-span-4 bg-gray-950 text-white p-8 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-white/5 blur-xl pointer-events-none" />
              <div className="space-y-4 relative z-10">
                <span className="inline-flex items-center gap-1 bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-white/10">
                  Ghi nhận 24/7
                </span>
                <h3 className="text-2xl font-serif font-black tracking-tight flex items-center gap-2">
                  <Sparkles className="h-5.5 w-5.5 text-amber-400 animate-pulse" />
                  Đánh Giá Của Khách Hàng
                </h3>
                <p className="text-xs text-gray-400 font-semibold leading-relaxed">
                  Hãy chia sẻ cảm nhận của bạn về sản phẩm, đóng gói hàng hóa, tốc độ giao nhận hoặc dịch vụ hỗ trợ kỹ thuật để giúp EsyShop không ngừng nâng cao chất lượng phục vụ.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-2 text-[10px] text-gray-400 font-bold">
                <ShieldCheck className="h-4.5 w-4.5 text-emerald-400" />
                <span>Ý kiến của bạn giúp chúng tôi phát triển tốt hơn</span>
              </div>
            </div>

            {/* Right form part */}
            <div className="lg:col-span-8 p-8">
              {submitted && (
                <div className="mb-6 p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-100 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  Cảm ơn đóng góp của quý khách! Ý kiến quý báu của bạn đã được ghi nhận thành công để EsyShop không ngừng cải thiện chất lượng dịch vụ.
                </div>
              )}

              <form onSubmit={handleContactSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Tên của bạn *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Nguyễn Văn Hải"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-xs font-semibold p-3.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-gray-400 bg-white shadow-3xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Địa chỉ email</label>
                    <input
                      type="email"
                      placeholder="Ví dụ: hainguyen@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs font-semibold p-3.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-gray-400 bg-white shadow-3xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Lời đánh giá hoặc ý kiến đóng góp *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Nhập cảm nhận của bạn về sản phẩm, đóng gói hàng hóa, chất lượng giấy hoặc thái độ phục vụ..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full text-xs font-semibold p-3.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-gray-400 bg-white shadow-3xs"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full md:w-auto px-8 py-3.5 rounded-xl bg-gray-950 hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-gray-250"
                  >
                    {submitting ? (
                      <span>Đang xử lý gửi tin...</span>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        <span>Gửi Phản Hồi Ngay</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>


        {/* 2. CỬA HÀNG CHÍNH (BẢNG DÀI NGANG) */}
        <div className="w-full bg-white border border-gray-250 rounded-3xl shadow-xs overflow-hidden p-6 sm:p-8">
          <div className="border-b border-gray-100 pb-4 mb-6">
            <h3 className="text-sm font-black text-gray-950 uppercase tracking-widest flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Thông Tin Showroom & Cửa Hàng Chính
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Showrooms */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-800">
                <MapPin className="h-4.5 w-4.5 text-gray-900 shrink-0" />
                <h4 className="text-xs font-black uppercase tracking-wider">Hệ thống Showroom</h4>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-[11px] font-bold text-gray-900">Cơ sở 1 (Hà Nội):</p>
                  <p className="text-[11px] text-gray-600 font-medium">15 Tạ Quang Bửu, Phường Bách Khoa, Hai Bà Trưng, Hà Nội</p>
                </div>
                <div className="pt-1 border-t border-gray-100">
                  <p className="text-[11px] font-bold text-gray-900">Cơ sở 2 (TP.HCM):</p>
                  <p className="text-[11px] text-gray-600 font-medium">Landmark 81, Phường 22, Bình Thạnh, TP. Hồ Chí Minh</p>
                </div>
              </div>
            </div>

            {/* Hotline */}
            <div className="space-y-3 md:border-l md:border-gray-150 md:pl-6">
              <div className="flex items-center gap-2 text-gray-800">
                <Phone className="h-4.5 w-4.5 text-gray-900 shrink-0" />
                <h4 className="text-xs font-black uppercase tracking-wider">Hotline Đặt Hàng</h4>
              </div>
              <div className="space-y-1">
                <p className="text-base font-black text-gray-950 font-mono">0378.274.136</p>
                <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                  Hỗ trợ CSKH toàn quốc & thắc mắc đơn hàng: <span className="font-bold text-gray-800">1900 3000</span> (Phục vụ 8:00 - 22:00 hàng ngày)
                </p>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-3 lg:border-l lg:border-gray-150 lg:pl-6">
              <div className="flex items-center gap-2 text-gray-800">
                <Mail className="h-4.5 w-4.5 text-gray-900 shrink-0" />
                <h4 className="text-xs font-black uppercase tracking-wider">Hòm Thư Điện Tử</h4>
              </div>
              <div className="space-y-1 font-medium text-[11px]">
                <p className="text-gray-900 font-bold">contact@esyshop.vn</p>
                <p className="text-gray-500">Đăng ký làm đại lý: agency@esyshop.vn</p>
                <p className="text-gray-500">Kỹ thuật viên driver: support@esyshop.vn</p>
              </div>
            </div>

            {/* Operating hours */}
            <div className="space-y-3 md:border-l lg:border-l md:border-gray-150 md:pl-6 lg:pl-6">
              <div className="flex items-center gap-2 text-gray-800">
                <Clock className="h-4.5 w-4.5 text-gray-900 shrink-0" />
                <h4 className="text-xs font-black uppercase tracking-wider">Thời Gian Hoạt Động</h4>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-black text-gray-950">08:00 Sáng — 21:00 Tối</p>
                <span className="inline-block text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                  Hoạt động cả Thứ 7 và Chủ Nhật
                </span>
              </div>
            </div>
          </div>
        </div>


        {/* 3. BẢN ĐỒ CHỈ ĐƯỜNG (BẢNG DÀI NGANG) */}
        <div className="w-full bg-white border border-gray-250 rounded-3xl shadow-xs overflow-hidden p-6 sm:p-8">
          <div className="border-b border-gray-100 pb-4 mb-5">
            <h3 className="text-sm font-black text-gray-950 uppercase tracking-widest flex items-center gap-2">
              <Map className="h-4.5 w-4.5 text-gray-900" />
              Bản Đồ Chỉ Đường Trực Quan
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Interactive map visualization */}
            <div className="lg:col-span-8 relative min-h-[300px] rounded-2xl bg-gray-50 border border-gray-200 overflow-hidden flex items-center justify-center">
              
              {/* Simulated Street Grids */}
              <div className="absolute inset-0 grid grid-cols-6 gap-6 opacity-10 pointer-events-none">
                {Array.from({ length: 36 }).map((_, i) => (
                  <div key={i} className="border-r border-b border-gray-300" />
                ))}
              </div>

              {/* Simulated Park & Lake Area */}
              <div className="absolute top-1/4 left-1/4 w-44 h-24 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
              <div className="absolute bottom-1/3 right-1/4 w-32 h-20 rounded-full bg-blue-500/10 blur-xl pointer-events-none" />
              {/* Simulated River */}
              <div className="absolute top-1/2 left-0 right-0 h-6 bg-blue-500/10 -rotate-6 blur-md pointer-events-none" />

              {/* Pin points - Hà Nội Main */}
              <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 2.5 }}
                  className="h-10 w-10 rounded-full bg-gray-950 text-white flex items-center justify-center shadow-lg border-2 border-white relative z-10"
                >
                  <Compass className="h-5 w-5 text-yellow-400 animate-spin" />
                </motion.div>
                
                {/* Pin label */}
                <div className="bg-gray-950 text-white text-[9px] font-black tracking-wider uppercase px-2.5 py-1 rounded-md shadow-md border border-gray-850 mt-2 whitespace-nowrap z-20">
                  📍 ESYSHOP (Showroom Hà Nội)
                </div>
              </div>

              {/* Pin points - TP.HCM Landmark */}
              <div className="absolute bottom-1/4 right-1/3 flex flex-col items-center">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 2.2, delay: 0.5 }}
                  className="h-9 w-9 rounded-full bg-blue-900 text-white flex items-center justify-center shadow-lg border-2 border-white relative z-10"
                >
                  <span className="text-xs">⭐</span>
                </motion.div>
                
                {/* Pin label */}
                <div className="bg-blue-950 text-white text-[9px] font-black tracking-wider uppercase px-2.5 py-1 rounded-md shadow-md border border-blue-900 mt-2 whitespace-nowrap z-20">
                  📍 ESYSHOP (Cơ sở Landmark 81)
                </div>
              </div>

              {/* Zoom buttons */}
              <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 z-30">
                <button className="h-8 w-8 rounded-xl bg-white border border-gray-250 text-sm font-black text-gray-900 hover:bg-gray-50 flex items-center justify-center cursor-pointer shadow-xs">
                  +
                </button>
                <button className="h-8 w-8 rounded-xl bg-white border border-gray-250 text-sm font-black text-gray-900 hover:bg-gray-50 flex items-center justify-center cursor-pointer shadow-xs">
                  -
                </button>
              </div>
            </div>

            {/* Directions tip box & Guide details */}
            <div className="lg:col-span-4 bg-gray-50 rounded-2xl p-6 border border-gray-150 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 text-xs font-black text-gray-900 uppercase tracking-wide">
                  <span>💡</span> Hướng Dẫn Đường Đi
                </div>
                
                <div className="space-y-3 text-[11px] text-gray-600 font-semibold leading-relaxed">
                  <p>
                    <strong className="text-gray-950">Showroom Hà Nội:</strong> Cách Đại học Bách Khoa Hà Nội và Công viên Thống Nhất chỉ 3 phút di chuyển. Có chỗ đỗ xe ô tô và xe máy rộng rãi, hoàn toàn miễn phí có nhân viên bảo vệ trông giữ.
                  </p>
                  <p>
                    <strong className="text-gray-950">Showroom Sài Gòn:</strong> Tọa lạc tại tòa tháp Landmark 81 sầm uất, thuận tiện cho quý khách đến trải nghiệm thực tế các dòng máy in nhiệt, máy chiếu đa năng cao cấp nhất.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 mt-4 text-[10px] text-gray-400 font-medium leading-normal">
                Quý khách có thể yêu cầu nhân viên kỹ thuật cài đặt driver hoặc hỗ trợ cấu hình máy trực tuyến thông qua công cụ hỗ trợ từ xa mà không cần trực tiếp đến showroom.
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
