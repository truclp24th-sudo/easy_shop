import { useState } from 'react';
import { ShoppingCart, Store, ShieldCheck, Menu, X, Sparkles, User, Award, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppUser } from '../types';

interface HeaderProps {
  currentView: 'client' | 'admin';
  onViewChange: (view: 'client' | 'admin') => void;
  cartCount: number;
  onCartClick: () => void;
  wishlistCount: number;
  onWishlistClick: () => void;
  activeSection: string;
  onSectionClick: (sectionId: string) => void;
  currentUser: AppUser | null;
  onAuthClick: () => void;
}

export default function Header({
  currentView,
  onViewChange,
  cartCount,
  onCartClick,
  wishlistCount,
  onWishlistClick,
  activeSection,
  onSectionClick,
  currentUser,
  onAuthClick
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', name: 'Trang chủ' },
    { id: 'products', name: 'Sản phẩm' },
    { id: 'news', name: 'Tin tức' },
    { id: 'contact', name: 'Liên hệ' }
  ];

  const handleNavClick = (sectionId: string) => {
    onSectionClick(sectionId);
    setMobileMenuOpen(false);
    // Scroll to section
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => onViewChange('client')}
            id="logo-container"
          >
            <div className="h-10 w-10 rounded-xl bg-gray-950 flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105 border border-gray-800">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-serif font-bold tracking-[0.15em] text-gray-950 uppercase block">
                ESYSHOP
              </span>
              <span className="block text-[9px] font-sans font-extrabold text-gray-400 uppercase tracking-[0.25em] mt-0.5">
                Thiết Bị Số
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          {currentView === 'client' && (
            <nav className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  id={`nav-item-${item.id}`}
                  className={`text-sm font-semibold transition-colors relative py-2 ${
                    activeSection === item.id 
                      ? 'text-gray-950 font-bold' 
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {item.name}
                  {activeSection === item.id && (
                    <motion.div 
                      layoutId="activeUnderline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-950 rounded-full"
                    />
                  )}
                </button>
              ))}
            </nav>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* View Switcher Button (Only visible in admin view to let admins go back) */}
            {currentView === 'admin' && (
              <button
                id="view-switcher-btn"
                onClick={() => {
                  onViewChange('client');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-xs border bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
              >
                <Store className="h-4 w-4 text-gray-600" />
                <span className="hidden sm:inline">Về Cửa Hàng</span>
                <span className="sm:hidden">Shop</span>
              </button>
            )}

            {/* Wishlist Trigger */}
            {currentView === 'client' && (
              <button
                id="wishlist-trigger-btn"
                onClick={onWishlistClick}
                className="relative p-2.5 rounded-xl bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors shadow-xs group"
              >
                <Heart className="h-5.5 w-5.5 transition-transform group-hover:scale-110" />
                <AnimatePresence>
                  {wishlistCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center shadow-md shadow-rose-200"
                    >
                      {wishlistCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            )}

            {/* Shopping Cart Trigger */}
            {currentView === 'client' && (
              <button
                id="cart-trigger-btn"
                onClick={onCartClick}
                className="relative p-2.5 rounded-xl bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors shadow-xs group"
              >
                <ShoppingCart className="h-5.5 w-5.5 transition-transform group-hover:scale-110" />
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 rounded-full bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center shadow-md shadow-gray-200"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            )}

            {/* Member Account Trigger */}
            {currentView === 'client' && (
              currentUser ? (
                <button
                  id="user-auth-btn"
                  onClick={onAuthClick}
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-gray-100 text-gray-800 hover:bg-gray-200 transition-all font-bold text-xs shadow-xs border border-gray-200 cursor-pointer"
                >
                  <div className="h-7 w-7 rounded-lg bg-gray-950 text-white flex items-center justify-center font-bold text-[10px]">
                    {currentUser.isMember ? '✨' : currentUser.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-[10px] font-black leading-none text-gray-900">{currentUser.name}</p>
                    <p className="text-[8px] text-gray-400 mt-0.5 leading-none font-bold">
                      {currentUser.isMember ? `${currentUser.memberPoints} Điểm` : 'Thành viên'}
                    </p>
                  </div>
                </button>
              ) : (
                <button
                  id="user-auth-btn"
                  onClick={onAuthClick}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gray-950 hover:bg-black text-white text-xs font-bold transition-all border border-gray-800 cursor-pointer"
                >
                  <User className="h-3.5 w-3.5" />
                  <span>Đăng Nhập</span>
                </button>
              )
            )}

            {/* Mobile Menu Button */}
            {currentView === 'client' && (
              <button
                id="mobile-menu-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2.5 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && currentView === 'client' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-white border-t border-gray-100 shadow-inner overflow-hidden"
          >
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  id={`mobile-nav-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
                    activeSection === item.id
                      ? 'bg-gray-50 text-gray-900'
                      : 'text-gray-500 hover:bg-gray-50/50 hover:text-gray-900'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
