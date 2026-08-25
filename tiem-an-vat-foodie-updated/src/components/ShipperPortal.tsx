import { useState, useEffect } from 'react';
import {
  Truck, MapPin, Phone, User, LogOut, Store, Pencil, X, Plus, MapPinned,
  CheckCircle2, Info
} from 'lucide-react';
import { Order, Shipper } from '../types';

interface ShipperPortalProps {
  shippers: Shipper[];
  onSaveShipperAreas: (phone: string, name: string, areas: string[]) => void;
  onGoHome: () => void;
  syncError?: string | null;
}

const SHIPPER_IDENTITY_KEY = 'esyshop_shipper_identity';

// Bỏ dấu tiếng Việt + về chữ thường để so khớp địa chỉ - khu vực không phân biệt hoa/thường,
// có dấu/không dấu (VD: "Quận 3" vẫn khớp với địa chỉ ghi "quan 3" hoặc "Q3 Quận 3").
export const normalizeVN = (str: string) =>
  str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim();

// Một đơn hàng được xem là "thuộc khu vực" của shipper nếu địa chỉ giao hàng của đơn
// chứa ít nhất MỘT trong các khu vực mà shipper đã đăng ký. Dùng chung ở mục
// "Quản lý Shipper" bên Admin để biết đơn nào nên gợi ý cho shipper nào.
export const isOrderInShipperAreas = (order: Order, areas: string[]) => {
  if (areas.length === 0) return false;
  const normalizedAddress = normalizeVN(order.customerAddress || '');
  return areas.some(area => {
    const normalizedArea = normalizeVN(area);
    return normalizedArea.length > 0 && normalizedAddress.includes(normalizedArea);
  });
};

// Ô nhập khu vực dạng "thẻ" (tag input): gõ tên khu vực rồi Enter/dấu phẩy để thêm,
// bấm x trên từng thẻ để xoá. Dùng chung cho cả màn hình đăng ký ở "Shipper" lẫn
// mục "Quản lý Shipper" bên Admin.
export function AreaTagInput({ areas, onChange, autoFocus }: { areas: string[]; onChange: (areas: string[]) => void; autoFocus?: boolean }) {
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

// ================= Trang "Shipper" =================
// Trang này CHỈ dùng để shipper tự đăng ký thông tin (họ tên, SĐT, khu vực nhận đơn) -
// không còn chức năng tự nhận/giao đơn tại đây nữa. Toàn bộ việc gán đơn cho shipper theo
// đúng khu vực đã đăng ký (và đánh dấu đã giao) giờ được nhân viên quản lý thực hiện ngay
// trong mục "Quản lý Shipper" của Bảng Quản Trị.
export default function ShipperPortal({
  shippers,
  onSaveShipperAreas,
  onGoHome,
  syncError
}: ShipperPortalProps) {
  const [identity, setIdentity] = useState<{ name: string; phone: string; areas: string[] } | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [areasInput, setAreasInput] = useState<string[]>([]);
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

  // Nếu Firestore đã có hồ sơ khu vực cho SĐT này (VD: admin vừa chỉnh khu vực giúp shipper,
  // hoặc shipper từng đăng ký trên máy khác), luôn ưu tiên đồng bộ khu vực MỚI NHẤT từ
  // Firestore về, tránh trường hợp máy hiện tại đang hiển thị dữ liệu khu vực cũ.
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

  const handleRegisterSubmit = (e: React.FormEvent) => {
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
    setNameInput('');
    setPhoneInput('');
    setAreasInput([]);
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

  // ================= Chưa đăng ký -> hiện form đăng ký =================
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
            <h1 className="text-lg font-black text-gray-950">Đăng ký Shipper</h1>
            <p className="text-xs text-gray-500 mt-1">Nhập thông tin và đăng ký khu vực giao hàng. Nhân viên cửa hàng sẽ gán đơn phù hợp cho bạn.</p>
          </div>
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
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
                <p className="text-[10px] text-amber-600 font-semibold mt-1">Cần thêm ít nhất 1 khu vực để hoàn tất đăng ký.</p>
              )}
            </div>
            <button
              type="submit"
              disabled={areasInput.length === 0}
              className="w-full py-3 rounded-xl bg-gray-950 hover:bg-black text-white text-sm font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Hoàn tất đăng ký
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

  // ================= Đã đăng ký -> hiện màn hình xác nhận hồ sơ =================
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12">
      {syncError && (
        <div className="w-full max-w-sm mb-4 bg-red-600 text-white text-xs font-bold text-center py-2.5 px-4 rounded-xl">
          ⚠️ {syncError}
        </div>
      )}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-14 w-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-4">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="text-lg font-black text-gray-950">Đăng ký thành công!</h1>
          <p className="text-xs text-gray-500 mt-1">Thông tin của bạn đã được lưu. Nhân viên cửa hàng sẽ gán đơn khớp khu vực cho bạn.</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-150 rounded-xl px-3 py-2.5">
            <div className="h-9 w-9 rounded-xl bg-gray-950 text-white flex items-center justify-center shrink-0">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-gray-950 leading-tight truncate">{identity.name}</p>
              <p className="text-[11px] text-gray-500 font-semibold flex items-center gap-1">
                <Phone className="h-3 w-3" /> {identity.phone}
              </p>
            </div>
          </div>

          <button
            onClick={openEditAreas}
            className="w-full flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-150 rounded-xl px-3 py-2.5 cursor-pointer text-left"
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

          <div className="flex items-start gap-1.5 text-[11px] text-gray-400 px-1">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>Bạn có thể quay lại trang này bất cứ lúc nào để cập nhật khu vực nhận đơn.</span>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={onGoHome}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Store className="h-3.5 w-3.5" /> Trang chủ
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 hover:bg-red-50 hover:border-red-200 text-gray-600 hover:text-red-600 text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5"
          >
            <LogOut className="h-3.5 w-3.5" /> Đổi shipper
          </button>
        </div>
      </div>

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
