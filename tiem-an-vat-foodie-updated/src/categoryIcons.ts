import {
  Grid, BookOpen, Cpu, Printer, Scan, Tv, Package, ShoppingBag,
  Palette, Shirt, Home, Gift, Sparkles, type LucideIcon
} from 'lucide-react';

// Bảng tra cứu icon dùng cho Danh mục sản phẩm. Chỉ import ĐÚNG những icon cần dùng
// (thay vì "import * as Icons from 'lucide-react'" load toàn bộ ~1500 icon vào bundle,
// khiến file JS build ra nặng hơn nhiều lần một cách không cần thiết).
// Khi muốn bổ sung icon mới cho danh mục, chỉ cần thêm dòng import + entry vào đây.
export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  Grid,
  BookOpen,
  Cpu,
  Printer,
  Scan,
  Tv,
  Package,
  ShoppingBag,
  Palette,
  Shirt,
  Home,
  Gift,
  Sparkles
};

export const CATEGORY_ICON_OPTIONS = Object.keys(CATEGORY_ICON_MAP).filter(k => k !== 'Grid');

export function getCategoryIcon(iconName: string): LucideIcon {
  return CATEGORY_ICON_MAP[iconName] || Package;
}
