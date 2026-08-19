import { useState } from 'react';
import { X, Search, PackageSearch, MapPin, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order } from '../types';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
}

const STATUS_LABELS: Record<Order['orderStatus'], string> = {
  RECEIVED: 'Chờ xác nhận',
  PREPARING: 'Chờ lấy hàng',
  DELIVERING: 'Đang giao hàng',
  COMPLETED: 'Đã giao thành công',
  CANCELLED: 'Đã hủy'
};

const STATUS_STEPS: Order['orderStatus'][] = ['RECEIVED', 'PREPARING', 'DELIVERING', 'COMPLETED'];

export default function OrderTrackingModal({ isOpen, onClose, orders }: OrderTrackingModalProps) {
  const [orderId, setOrderId] = useState('');
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState<Order | null | 'not_found'>(null);

  const formatPrice = (value: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const found = orders.find(
      o => o.id.trim().toLowerCase() === orderId.trim().toLowerCase() &&
           o.customerPhone.replace(/\s/g, '') === phone.trim().replace(/\s/g, '')
    );
    setResult(found || 'not_found');
  };

  const handleClose = () => {
    setOrderId('');
    setPhone('');
    setResult(null);
    onClose();
  };

  const currentStepIdx = result && result !== 'not_found' ? STATUS_STEPS.indexOf(result.orderStatus) : -1;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-modal="true" role="dialog">
          <div className="flex items-center justify-center min-h-screen px-4 py-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8"
            >
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex flex-col items-center text-center mb-6">
                <div className="h-12 w-12 rounded-2xl bg-gray-950 text-white flex items-center justify-center mb-3">
                  <PackageSearch className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-black text-gray-950">Tra cứu đơn hàng</h2>
                <p className="text-xs text-gray-500 mt-1">Nhập mã đơn hàng và số điện thoại đã đặt để xem trạng thái - không cần đăng nhập.</p>
              </div>

              <form onSubmit={handleSearch} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Mã đơn hàng *</label>
                  <input
                    type="text"
                    required
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="Ví dụ: ORD-9670"
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-gray-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Số điện thoại đã đặt hàng *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09xxxxxxxx"
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-gray-400"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gray-950 hover:bg-black text-white text-sm font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Search className="h-4 w-4" /> Tra cứu
                </button>
              </form>

              {result === 'not_found' && (
                <div className="mt-5 p-4 rounded-xl bg-red-50 border border-red-100 text-center">
                  <p className="text-xs font-bold text-red-700">Không tìm thấy đơn hàng khớp với thông tin bạn nhập.</p>
                  <p className="text-[11px] text-red-500 mt-1">Vui lòng kiểm tra lại mã đơn và số điện thoại.</p>
                </div>
              )}

              {result && result !== 'not_found' && (
                <div className="mt-5 border-t border-gray-100 pt-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-gray-950">#{result.id}</span>
                    <span className="text-[10px] font-bold text-gray-400">
                      {new Date(result.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  {result.orderStatus === 'CANCELLED' ? (
                    <div className="p-3 rounded-xl bg-gray-100 text-center">
                      <p className="text-xs font-bold text-gray-600">Đơn hàng này đã bị hủy.</p>
                    </div>
                  ) : (
                    <div className="relative flex justify-between text-[10px] text-gray-400 font-bold text-center">
                      <div className="absolute top-2.5 left-0 right-0 h-0.5 bg-gray-150 -z-0" />
                      <div
                        className="absolute top-2.5 left-0 h-0.5 bg-gray-950 -z-0 transition-all duration-500"
                        style={{ width: `${(currentStepIdx / (STATUS_STEPS.length - 1)) * 100}%` }}
                      />
                      {STATUS_STEPS.map((step, idx) => (
                        <div key={step} className="relative z-10 flex flex-col items-center gap-1 flex-1">
                          <div className={`h-5 w-5 rounded-full flex items-center justify-center border text-[9px] ${
                            idx <= currentStepIdx
                              ? 'bg-gray-950 border-gray-950 text-white'
                              : 'bg-white border-gray-250 text-gray-400'
                          }`}>
                            {idx < currentStepIdx ? '✓' : idx + 1}
                          </div>
                          <span className={idx <= currentStepIdx ? 'text-gray-950 font-extrabold' : ''}>
                            {STATUS_LABELS[step]}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {result.orderStatus === 'DELIVERING' && result.shipperName && (
                    <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                      <Truck className="h-4 w-4 text-blue-600 shrink-0" />
                      <p className="text-[11px] text-blue-800 font-semibold">
                        Shipper <span className="font-black">{result.shipperName}</span> đang giao hàng cho bạn
                        {result.shipperPhone && (
                          <> · <a href={`tel:${result.shipperPhone}`} className="underline">{result.shipperPhone}</a></>
                        )}
                      </p>
                    </div>
                  )}

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-start gap-1.5 text-gray-600">
                      <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
                      <span>{result.customerAddress}</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-3 space-y-1">
                    {result.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-[11px] text-gray-600">
                        <span className="truncate pr-2">{item.quantity}x {item.productName}</span>
                        <span className="font-mono">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-xs font-black text-gray-950 pt-1">
                      <span>Tổng thanh toán:</span>
                      <span>{formatPrice(result.total)}</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
