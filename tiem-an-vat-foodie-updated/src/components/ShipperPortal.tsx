import { useState, useEffect } from 'react';
import {
  Truck, Package, MapPin, Phone, User, LogOut, CheckCircle2,
  RotateCcw, Store, Wallet, Clock, History, Pencil, X, Plus, MapPinned
} from 'lucide-react';
import { Order, Shipper } from '../types';

interface ShipperPortalProps {
  orders: Order[];
  shippers: Shipper[];
  onSaveShipperAreas: (phone: string, name: string, areas: string[]) => void;
  onClaimOrder: (orderId: string, shipperName: string, shipperPhone: string) => void;
  onCompleteDelivery: (orderId: string) => void;
  onReleaseOrder: (orderId: string) => void;
  onGoHome: () => void;
  syncError?: string | null;
}

const SHIPPER_IDENTITY_KEY = 'esyshop_shipper_identity';

// Bỏ dấu tiếng Việt + về chữ thường để so khớp địa chỉ - khu vực không phân biệt hoa/thường,
// có dấu/không dấu (VD: "Quận 3" vẫn khớp với địa chỉ ghi "quan 3" hoặc "Q3 Quận 3").
const normalizeVN = (str: string) =>
  str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim();

// Một đơn hàng được xem là "thuộc khu vực" của shipper nếu địa chỉ giao hàng của đơn
// chứa ít nhất MỘT trong các khu vực mà shipper đã đăng ký.
const isOrderInShipperAreas = (order: Order, areas: string[]) => {
  if (areas.length === 0) return false;
  const normalizedAddress = normalizeVN(order.customerAddress || '');
  return areas.some(area => {
    const normalizedArea = normalizeVN(area);
    return normalizedArea.length > 0 && normalizedAddress.includes(normalizedArea);
  });
};

// Ô nhập khu vực dạng "thẻ" (tag input): gõ tên khu vực rồi Enter/dấu phẩy để thêm,
// bấm x trên từng thẻ để xoá. Dùng chung cho cả màn hình đăng ký lẫn form chỉnh sửa sau này.
function AreaTagInput({ areas, onChange, autoFocus }: { areas: string[]; onChange: (areas: string[]) => void; autoFocus?: boolean }) {
  const [draft, setDraft] = useState('');

  const commitDraft = () => {
    const value = draft.trim().replace(/,+$/, '');
    if (!value) {
      setDraft('');
      return;
    }
    const exists = areas.some(a => normalizeVN(a) === normalizeVN(value));
    if (!exists) onChange([...areas, value]);
    setDraft('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commitDraft();
    } else if (e.key === 'Backspace' && draft === '' && areas.length > 0) {
      onChange(areas.slice(0, -1));
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {areas.map((area, idx) => (
          <span
            key={idx}
            className="flex items-center gap-1 bg-gray-950 text-white text-[11px] font-bold pl-2.5 pr-1.5 py-1 rounded-full"
          >
            {area}
            <button
              type="button"
              onClick={() => onChange(areas.filter((_, i) => i !== idx))}
              className="hover:bg-white/20 rounded-full p-0.5 cursor-pointer"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input
          type="text"
          autoFocus={autoFocus}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commitDraft}
          placeholder="VD: Quận 1, Bình Thạnh, Thủ Đức..."
          className="flex-1 p-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-gray-400"
        />
        <button
          type="button"
          onClick={commitDraft}
          className="px-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 cursor-pointer"
          title="Thêm khu vực"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <p className="text-[10px] text-gray-400 mt-1.5">Gõ tên khu vực rồi nhấn Enter hoặc dấu phẩy để thêm. Bạn có thể thêm nhiều khu vực.</p>
    </div>
  );
}

export default function ShipperPortal({
  orders,
  shippers,
  onSaveShipperAreas,
  onClaimOrder,
  onCompleteDelivery,
  onReleaseOrder,
  onGoHome,
  syncError
}: ShipperPortalProps) {
  const [identity, setIdentity] = useState<{ name: string; phone: string; areas: string[] } | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [areasInput, setAreasInput] = useState<string[]>([]);
  const [tab, setTab] = useState<'available' | 'mine' | 'history'>('available');
  const [editingAreas, setEditingAreas] = useState(false);
  const [editAreasDraft, setEditAreasDraft] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(SHIPPER_IDENTITY_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setIdentity({ name: parsed.name, phone: parsed.phone, areas: parsed.areas || [] });
      } catch {
        // dữ liệu hỏng, bỏ qua
      }
    }
  }, []);

  // Nếu Firestore đã có hồ sơ khu vực cho SĐT này (VD: shipper từng đăng ký trên máy khác),
  // luôn ưu tiên đồng bộ khu vực MỚI NHẤT từ Firestore về, tránh trường hợp máy hiện tại
  // đang hiển thị dữ liệu khu vực cũ/khác trên localStorage.
  useEffect(() => {
    if (!identity) return;
    const remote = shippers.find(s => s.phone === identity.phone);
    if (remote && JSON.stringify(remote.areas) !== JSON.stringify(identity.areas)) {
      const updated = { name: identity.name, phone: identity.phone, areas: remote.areas };
      setIdentity(updated);
      localStorage.setItem(SHIPPER_IDENTITY_KEY, JSON.stringify(updated));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shippers]);

  const formatPrice = (value: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !phoneInput.trim() || areasInput.length === 0) return;
    const name = nameInput.trim();
    const phone = phoneInput.trim();
    const newIdentity = { name, phone, areas: areasInput };
    localStorage.setItem(SHIPPER_IDENTITY_KEY, JSON.stringify(newIdentity));
    setIdentity(newIdentity);
    onSaveShipperAreas(phone, name, areasInput);
  };

  const handleLogout = () => {
    localStorage.removeItem(SHIPPER_IDENTITY_KEY);
    setIdentity(null);
  };

  const openEditAreas = () => {
    if (!identity) return;
    setEditAreasDraft(identity.areas);
    setEditingAreas(true);
  };

  const handleSaveAreas = () => {
    if (!identity || editAreasDraft.length === 0) return;
    const updated = { ...identity, areas: editAreasDraft };
    localStorage.setItem(SHIPPER_IDENTITY_KEY, JSON.stringify(updated));
    setIdentity(updated);
    onSaveShipperAreas(identity.phone, identity.name, editAreasDraft);
    setEditingAreas(false);
  };

  // Chưa có thông tin shipper -> yêu cầu nhập tên + SĐT + khu vực nhận đơn (lưu vào máy VÀ
  // đồng bộ lên Firestore, không cần đăng ký phức tạp qua admin).
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
            <p className="text-xs text-gray-500 mt-1">Nhập thông tin và đăng ký khu vực để bắt đầu nhận đơn giao hàng.</p>
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
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Khu vực nhận đơn *</label>
              <AreaTagInput areas={areasInput} onChange={setAreasInput} />
              {areasInput.length === 0 && (
                <p className="text-[10px] text-amber-600 font-semibold mt-1">Cần thêm ít nhất 1 khu vực để bắt đầu nhận đơn.</p>
              )}
            </div>
            <button
              type="submit"
              disabled={areasInput.length === 0}
              className="w-full py-3 rounded-xl bg-gray-950 hover:bg-black text-white text-sm font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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

  // Đơn "sẵn sàng" chỉ hiện những đơn CHƯA có shipper nhận VÀ có địa chỉ khớp khu vực đã đăng ký.
  const availableOrders = orders.filter(
    o => o.orderStatus === 'PREPARING' && !o.shipperName && isOrderInShipperAreas(o, identity.areas)
  );
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

        <div className="max-w-3xl mx-auto px-4 pb-3">
          <button
            onClick={openEditAreas}
            className="w-full flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-150 rounded-xl px-3 py-2 cursor-pointer text-left"
          >
            <MapPinned className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <div className="flex-1 flex flex-wrap gap-1 min-w-0">
              {identity.areas.map((area, idx) => (
                <span key={idx} className="text-[10px] font-bold bg-white border border-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                  {area}
                </span>
              ))}
            </div>
            <Pencil className="h-3 w-3 text-gray-400 shrink-0" />
          </button>
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
              <p className="text-sm font-bold">Hiện chưa có đơn nào sẵn sàng trong khu vực của bạn.</p>
              <p className="text-xs mt-1">
                Đang nhận đơn cho khu vực: <span className="font-bold text-gray-600">{identity.areas.join(', ')}</span>.
                Đơn mới khớp khu vực sẽ tự hiện ở đây.
              </p>
              <button
                onClick={openEditAreas}
                className="mt-3 text-xs font-bold text-gray-950 underline underline-offset-2 cursor-pointer"
              >
                Chỉnh sửa khu vực nhận đơn
              </button>
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

      {editingAreas && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-gray-950 flex items-center gap-1.5">
                <MapPinned className="h-4 w-4" /> Khu vực nhận đơn
              </h2>
              <button
                onClick={() => setEditingAreas(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <AreaTagInput areas={editAreasDraft} onChange={setEditAreasDraft} autoFocus />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setEditingAreas(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-bold cursor-pointer"
              >
                Huỷ
              </button>
              <button
                onClick={handleSaveAreas}
                disabled={editAreasDraft.length === 0}
                className="flex-1 py-2.5 rounded-xl bg-gray-950 hover:bg-black text-white text-xs font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
