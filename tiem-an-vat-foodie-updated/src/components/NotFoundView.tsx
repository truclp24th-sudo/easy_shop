import { PackageSearch, Home, ShoppingBag } from 'lucide-react';

interface NotFoundViewProps {
  onGoHome: () => void;
  onBrowseProducts: () => void;
}

export default function NotFoundView({ onGoHome, onBrowseProducts }: NotFoundViewProps) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 py-20">
      <div className="p-6 rounded-full bg-gray-100 text-gray-400 mb-6">
        <PackageSearch className="h-16 w-16" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-black text-gray-950 mb-2">404 — Không tìm thấy sản phẩm</h1>
      <p className="text-sm text-gray-500 max-w-md mb-8">
        Rất tiếc, đường dẫn bạn truy cập tới sản phẩm này không còn tồn tại — có thể sản phẩm đã bị gỡ bỏ
        hoặc đường dẫn không chính xác. Hãy thử tìm sản phẩm khác nhé!
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onGoHome}
          className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gray-950 hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
        >
          <Home className="h-4 w-4" /> Về trang chủ
        </button>
        <button
          onClick={onBrowseProducts}
          className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
        >
          <ShoppingBag className="h-4 w-4" /> Xem tất cả sản phẩm
        </button>
      </div>
    </div>
  );
}
