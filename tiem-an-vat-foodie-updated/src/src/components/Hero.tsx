import { Search, Sparkles, Trophy, ShieldCheck, Printer, Scan, Tv } from 'lucide-react';
import { CATEGORIES } from '../data';
import * as LucideIcons from 'lucide-react';

interface HeroProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

export default function Hero({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange
}: HeroProps) {
  
  // Dynamic icon renderer helper for categories
  const renderCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Grid': return <LucideIcons.Grid className="h-4 w-4" />;
      case 'BookOpen': return <LucideIcons.BookOpen className="h-4 w-4" />;
      case 'Cpu': return <LucideIcons.Cpu className="h-4 w-4" />;
      case 'Printer': return <LucideIcons.Printer className="h-4 w-4" />;
      case 'Scan': return <LucideIcons.Scan className="h-4 w-4" />;
      case 'Tv': return <LucideIcons.Tv className="h-4 w-4" />;
      default: return <LucideIcons.Sparkles className="h-4 w-4" />;
    }
  };

  return (
    <div className="relative overflow-hidden bg-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-gray-100/60">
      
      {/* 3D Smoky Satin Silk Wave Simulation Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Deep background mesh */}
        <div className="absolute inset-0 bg-smoky-silk opacity-80" />
        
        {/* Soft, floating, waving silk folds matching user's image */}
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] sm:w-[50vw] sm:h-[50vw] rounded-full bg-slate-200/40 blur-[100px] animate-wave-1 mix-blend-multiply" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[65vw] h-[65vw] sm:w-[45vw] sm:h-[45vw] rounded-full bg-neutral-200/50 blur-[120px] animate-wave-2 mix-blend-multiply" />
        <div className="absolute top-[20%] right-[10%] w-[55vw] h-[55vw] sm:w-[35vw] sm:h-[35vw] rounded-full bg-gray-150/60 blur-[90px] animate-wave-3 mix-blend-multiply" />
        <div className="absolute bottom-[10%] left-[20%] w-[60vw] h-[60vw] sm:w-[40vw] sm:h-[40vw] rounded-full bg-slate-100/50 blur-[110px] animate-wave-1 opacity-70 mix-blend-multiply" />
        
        {/* Subtle lighting overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-white/40" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          
          {/* Brand Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-md text-gray-800 border border-gray-200 text-[10px] sm:text-xs font-bold uppercase tracking-widest mx-auto shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-gray-950 animate-pulse" />
            Máy In Nhiệt & Thiết Bị Số Chính Hãng EsyShop
          </div>
 
          {/* Editorial Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-black text-gray-950 tracking-tight leading-none">
            <span className="block text-xl sm:text-2xl font-sans font-light tracking-[0.2em] text-gray-400 uppercase mb-3">
              Smart Office Solutions
            </span>
            Thiết Bị Số EsyShop <br/>
            <span className="italic font-light text-gray-800 block mt-2 text-3xl sm:text-4xl md:text-5xl tracking-normal">
              Bứt Phá Hiệu Suất, Nâng Tầm Công Việc
            </span>
          </h1>

          {/* Luxury Subheading */}
          <p className="text-xs sm:text-sm text-gray-500 font-medium max-w-xl mx-auto leading-relaxed tracking-wide font-sans">
            Hệ sinh thái thiết bị văn phòng chuyên nghiệp tại EsyShop: máy in nhiệt không cần mực siêu tiết kiệm, máy quét mã vạch tốc độ cao và máy chiếu thông minh độ nét vượt trội.
          </p>

          {/* Elegant Search Bar */}
          <div className="relative max-w-lg mx-auto mt-10 shadow-lg shadow-gray-150/40 rounded-full bg-white/80 backdrop-blur-md border border-gray-200 p-1 flex items-center gap-2 focus-within:border-gray-400 transition-all focus-within:shadow-xl focus-within:shadow-gray-200/50">
            <div className="flex items-center pl-4 text-gray-400">
              <Search className="h-4.5 w-4.5 text-gray-500" />
            </div>
            <input
              type="text"
              id="hero-search-input"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm kiếm máy in nhiệt, máy scan, máy chiếu..."
              className="w-full py-2.5 px-2 text-gray-800 placeholder-gray-400 bg-transparent border-0 focus:outline-hidden focus:ring-0 text-xs sm:text-sm font-semibold tracking-wide"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="p-1 px-3.5 text-xs text-gray-400 hover:text-gray-950 font-black tracking-wider uppercase transition-colors"
              >
                Xóa
              </button>
            )}
          </div>

          {/* Brand Integrity Badges */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-6 max-w-lg mx-auto text-[10px] sm:text-xs font-bold text-gray-600 uppercase tracking-wider">
            <div className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-full bg-white/50 backdrop-blur-xs border border-gray-150 shadow-2xs">
              <Trophy className="h-3.5 w-3.5 text-gray-900" />
              <span>Chính Hãng 100%</span>
            </div>
            <div className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-full bg-white/50 backdrop-blur-xs border border-gray-150 shadow-2xs">
              <ShieldCheck className="h-3.5 w-3.5 text-gray-900" />
              <span>Bảo Hành 12 Tháng</span>
            </div>
            <div className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-full bg-white/50 backdrop-blur-xs border border-gray-150 shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-gray-900 animate-pulse" />
              <span>Giao Hỏa Tốc 2h</span>
            </div>
          </div>

        </div>

        {/* Premium Categories Section */}
        <div className="mt-16">
          <div className="flex flex-col items-center gap-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
              Khám Phá Theo Nhóm Thiết Bị
            </span>
            
            {/* Fine Scrollable Badges */}
            <div className="flex items-center gap-3.5 max-w-full overflow-x-auto pb-4 pt-1 px-4 no-scrollbar">
              {CATEGORIES.map((category) => {
                const isActive = selectedCategory === category.id;
                return (
                  <button
                    key={category.id}
                    id={`cat-badge-${category.id}`}
                    onClick={() => onCategoryChange(category.id)}
                    className={`flex items-center gap-2 px-6 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all duration-300 border cursor-pointer select-none ${
                      isActive
                        ? 'bg-gray-950 border-gray-900 text-white shadow-lg shadow-gray-200 scale-105'
                        : 'bg-white/70 backdrop-blur-xs border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-950 hover:bg-white'
                    }`}
                  >
                    {renderCategoryIcon(category.icon)}
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
