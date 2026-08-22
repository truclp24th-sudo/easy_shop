import { useState, useEffect } from 'react';
import {
  Truck, Package, MapPin, Phone, User, LogOut, CheckCircle2,
  RotateCcw, Store, Wallet, Clock, History
} from 'lucide-react';
import { Order } from '../types';

interface ShipperPortalProps {
  orders: Order[];
  onClaimOrder: (orderId: string, shipperName: string, shipperPhone: string) => void;
  onCompleteDelivery: (orderId: string) => void;
  onReleaseOrder: (orderId: string) => void;
  onGoHome: () => void;
  syncError?: string | null;
}

const SHIPPER_IDENTITY_KEY = 'esyshop_shipper_identity';

export default function ShipperPortal({
  orders,
  onClaimOrder,
  onCompleteDelivery,
  onReleaseOrder,
  onGoHome,
  syncError
}: ShipperPortalProps) {
  const [identity, setIdentity] = useState<{ name: string; phone: string } | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [tab, setTab] = useState<'available' | 'mine' | 'history'>('available');

  useEffect(() => {
    const saved = localStorage.getItem(SHIPPER_IDENTITY_KEY);
    if (saved) {
      try {
        setIdentity(JSON.parse(saved));
      } catch {
        // dữ liệu hỏng, bỏ qua
      }
    }
  }, []);

  const formatPrice = (value: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !phoneInput.trim()) return;
    const newIdentity = { name: nameInput.trim(), phone: phoneInput.trim() };
    localStorage.setItem(SHIPPER_IDENTITY_KEY, JSON.stringify(newIdentity));
    setIdentity(newIdentity);
  };

  const handleLogout = () => {
    localStorage.removeItem(SHIPPER_IDENTITY_KEY);
    setIdentity(null);
  };

  // Chưa có thông tin shipper -> yêu cầu nhập tên + SĐT (lưu vào máy, không cần đăng ký phức tạp)
  if (!identity) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12">
        {syncError && (
          <div className="w-full max-w-sm mb-4 bg-red-600 text-white text-xs font-bold text-center py-2.5 px-4 rounded-xl">
            ⚠️ {syncError}
          </div>
        )}
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="h-14 w-14 rounded-2xl bg-gray-950 text-white flex items-center justify-center mb-4">
              <Truck className="h-7 w-7" />
            </div>
            <h1 className="text-lg font-black text-gray-950">Cổng Shipper</h1>
            <p className="text-xs text-gray-500 mt-1">Nhập tên và số điện thoại để bắt đầu nhận đơn giao hàng.</p>
          </div>
          <form onSubmit={handleLoginSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Họ và tên *</label>
              <input
                type="text"
                required
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn A"
                className="w-full p-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-gray-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Số điện thoại *</label>
              <input
                type="tel"
                required
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="09xxxxxxxx"
                className="w-full p-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-gray-400"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gray-950 hover:bg-black text-white text-sm font-bold transition-colors cursor-pointer"
            >
              Bắt đầu nhận đơn
            </button>
          </form>
          <button
            onClick={onGoHome}
            className="w-full mt-3 py-2 text-xs text-gray-400 hover:text-gray-700 font-semibold cursor-pointer"
          >
            ← Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  const availableOrders = orders.filter(o => o.orderStatus === 'PREPARING' && !o.shipperName);
  const myDeliveringOrders = orders.filter(o => o.orderStatus === 'DELIVERING' && o.shipperName === identity.name);
  const myHistoryOrders = orders
    .filter(o => o.orderStatus === 'COMPLETED' && o.shipperName === identity.name)
    .slice(0, 30);

  const tabs: { key: typeof tab; label: string; count: number; icon: any }[] = [
    { key: 'available', label: 'Đơn sẵn sàng', count: availableOrders.length, icon: Package },
    { key: 'mine', label: 'Đang giao', count: myDeliveringOrders.length, icon: Truck },
    { key: 'history', label: 'Đã giao', count: myHistoryOrders.length, icon: History }
  ];

  const renderOrderCard = (order: Order, variant: 'available' | 'mine' | 'history') => (
    <div key={order.id} className="bg-white rounded-2xl border border-gray-150 p-4 space-y-3 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-gray-950">#{order.id}</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          order.paymentMethod === 'COD' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
        }`}>
          {order.paymentMethod === 'COD' ? 'Thu hộ COD' : 'Đã thanh toán online'}
        </span>
      </div>

      <div className="space-y-1.5 text-xs text-gray-700">
        <div className="flex items-center gap-1.5 font-bold">
          <User className="h-3.5 w-3.5 text-gray-400" /> {order.customerName}
        </div>
        <a href={`tel:${order.customerPhone}`} className="flex items-center gap-1.5 text-gray-600 hover:text-gray-950 w-fit">
          <Phone className="h-3.5 w-3.5 text-gray-400" /> {order.customerPhone}
        </a>
        <div className="flex items-start gap-1.5 text-gray-600">
          <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
          <span>{order.customerAddress}</span>
        </div>
        {order.customerNotes && (
          <p className="text-[11px] text-gray-400 italic">Ghi chú: {order.customerNotes}</p>
        )}
      </div>

      <div className="border-t border-gray-100 pt-2 space-y-1">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex justify-between text-[11px] text-gray-600">
            <span className="truncate pr-2">{item.quantity}x {item.productName}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 pt-2">
        <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1">
          <Wallet className="h-3.5 w-3.5" /> Tổng thu:
        </span>
        <span className="text-sm font-black text-gray-950">{formatPrice(order.total)}</span>
      </div>

      {variant === 'available' && (
        <button
          onClick={() => onClaimOrder(order.id, identity.name, identity.phone)}
          className="w-full py-2.5 rounded-xl bg-gray-950 hover:bg-black text-white text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Truck className="h-4 w-4" /> Nhận đơn này
        </button>
      )}

      {variant === 'mine' && (
        <div className="flex gap-2">
          <button
            onClick={() => onReleaseOrder(order.id)}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Trả đơn
          </button>
          <button
            onClick={() => {
              if (window.confirm('Xác nhận bạn ĐÃ GIAO thành công đơn này?')) {
                onCompleteDelivery(order.id);
              }
            }}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Đã giao
          </button>
        </div>
      )}

      {variant === 'history' && (
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
          <CheckCircle2 className="h-3.5 w-3.5" /> Đã giao thành công
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {syncError && (
        <div className="bg-red-600 text-white text-xs font-bold text-center py-2 px-4">
          ⚠️ {syncError}
        </div>
      )}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gray-950 text-white flex items-center justify-center">
              <Truck className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-sm font-black text-gray-950 leading-tight">{identity.name}</p>
              <p className="text-[10px] text-gray-400 font-semibold">{identity.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onGoHome}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"
              title="Về trang chủ"
            >
              <Store className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"
              title="Đổi shipper"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 flex gap-1.5 pb-3 overflow-x-auto no-scrollbar">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                tab === t.key ? 'bg-gray-950 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <t.icon className="h-3.5 w-3.5" /> {t.label} ({t.count})
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-3">
        {tab === 'available' && (
          availableOrders.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Clock className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-bold">Hiện chưa có đơn nào sẵn sàng để nhận.</p>
              <p className="text-xs mt-1">Đơn mới sẽ hiện ở đây ngay khi kho chuẩn bị xong hàng.</p>
            </div>
          ) : availableOrders.map(o => renderOrderCard(o, 'available'))
        )}

        {tab === 'mine' && (
          myDeliveringOrders.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Truck className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-bold">Bạn chưa nhận đơn nào để giao.</p>
              <p className="text-xs mt-1">Qua tab "Đơn sẵn sàng" để nhận đơn mới nhé.</p>
            </div>
          ) : myDeliveringOrders.map(o => renderOrderCard(o, 'mine'))
        )}

        {tab === 'history' && (
          myHistoryOrders.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <History className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-bold">Chưa có đơn nào trong lịch sử giao hàng.</p>
            </div>
          ) : myHistoryOrders.map(o => renderOrderCard(o, 'history'))
        )}
      </main>
    </div>
  );
}
