import React, { useState, useEffect } from 'react';
import {
  Menu,
  X,
  ShieldAlert,
  ArrowRight,
  UserCheck,
  LogIn,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { AuthUser, User as AppUser } from '../../types';

interface NavbarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  unreadCount?: number;
  currentUser?: AuthUser | AppUser | null;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  onNavigate,
  unreadCount = 0,
  currentUser = null,
  onOpenLogin,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isOperatorMode = activeView.startsWith('operator-');

  const handleNavClick = (view: string) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full max-w-full bg-white/95 backdrop-blur-sm border-b transition-shadow duration-200 box-border ${
        isScrolled ? 'border-slate-200 shadow-xs' : 'border-slate-200/80'
      }`}
    >
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 lg:px-8 py-3.5 box-border">
        {/* Zone 1: Clean single-line brand wordmark */}
        <button
          type="button"
          onClick={() => handleNavClick('landing')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#0284c7] rounded-lg cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-[#f8fafc] border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
            <img
              src="/assets/aistudio/1__1__22a3ff2f.png"
              alt="Logo SEABRIS"
              className="w-full h-full object-contain p-0.5"
            />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-[#0f2942] whitespace-nowrap">
            SEABRIS
          </span>
        </button>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            type="button"
            onClick={() => handleNavClick('landing')}
            className={`relative py-1.5 transition-colors duration-200 whitespace-nowrap shrink-0 cursor-pointer after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:rounded-full after:bg-[#0284c7] after:transition-all after:duration-200 after:ease-out ${
              activeView === 'landing'
                ? 'after:w-full text-[#0f2942] font-semibold'
                : 'after:w-0 hover:after:w-full hover:text-[#0f2942]'
            }`}
          >
            Beranda
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('ai-scanner')}
            className={`relative py-1.5 transition-colors duration-200 whitespace-nowrap shrink-0 cursor-pointer after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:rounded-full after:bg-[#0284c7] after:transition-all after:duration-200 after:ease-out ${
              activeView === 'ai-scanner'
                ? 'after:w-full text-[#0f2942] font-semibold'
                : 'after:w-0 hover:after:w-full hover:text-[#0f2942]'
            }`}
          >
            AI Waste Scanner
          </button>

          {currentUser ? (
            <>
              <button
                type="button"
                onClick={() => handleNavClick('operator-device')}
                className={`relative py-1.5 transition-colors duration-200 whitespace-nowrap shrink-0 cursor-pointer after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:rounded-full after:bg-[#0284c7] after:transition-all after:duration-200 after:ease-out ${
                  activeView === 'operator-device'
                    ? 'after:w-full text-[#0f2942] font-semibold'
                    : 'after:w-0 hover:after:w-full hover:text-[#0f2942]'
                }`}
              >
                Monitoring Alat
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('operator-oceanography')}
                className={`relative py-1.5 transition-colors duration-200 whitespace-nowrap shrink-0 cursor-pointer after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:rounded-full after:bg-[#0284c7] after:transition-all after:duration-200 after:ease-out ${
                  activeView === 'operator-oceanography'
                    ? 'after:w-full text-[#0f2942] font-semibold'
                    : 'after:w-0 hover:after:w-full hover:text-[#0f2942]'
                }`}
              >
                Oseanografi
              </button>
              {currentUser.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => handleNavClick('operator-map')}
                  className={`relative py-1.5 transition-colors duration-200 whitespace-nowrap shrink-0 cursor-pointer after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:rounded-full after:bg-[#0284c7] after:transition-all after:duration-200 after:ease-out ${
                    activeView === 'operator-map'
                      ? 'after:w-full text-[#0f2942] font-semibold'
                      : 'after:w-0 hover:after:w-full hover:text-[#0f2942]'
                  }`}
                >
                  Peta Lokasi
                </button>
              )}
              <button
                type="button"
                onClick={() => handleNavClick('operator-reports')}
                className={`relative py-1.5 transition-colors duration-200 whitespace-nowrap shrink-0 cursor-pointer after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:rounded-full after:bg-[#0284c7] after:transition-all after:duration-200 after:ease-out ${
                  activeView === 'operator-reports'
                    ? 'after:w-full text-[#0f2942] font-semibold'
                    : 'after:w-0 hover:after:w-full hover:text-[#0f2942]'
                }`}
              >
                Laporan Warga
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleNavClick('public-oceanography')}
                className={`relative py-1.5 transition-colors duration-200 whitespace-nowrap shrink-0 cursor-pointer after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:rounded-full after:bg-[#0284c7] after:transition-all after:duration-200 after:ease-out ${
                  activeView === 'public-oceanography' || activeView === 'oceanography'
                    ? 'after:w-full text-[#0f2942] font-semibold'
                    : 'after:w-0 hover:after:w-full hover:text-[#0f2942]'
                }`}
              >
                Oseanografi
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('public-report')}
                className={`relative py-1.5 transition-colors duration-200 whitespace-nowrap shrink-0 cursor-pointer after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:rounded-full after:bg-[#0284c7] after:transition-all after:duration-200 after:ease-out ${
                  activeView === 'public-report'
                    ? 'after:w-full text-[#0f2942] font-semibold'
                    : 'after:w-0 hover:after:w-full hover:text-[#0f2942]'
                }`}
              >
                Laporkan Sampah
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('public-about')}
                className={`relative py-1.5 transition-colors duration-200 whitespace-nowrap shrink-0 cursor-pointer after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:rounded-full after:bg-[#0284c7] after:transition-all after:duration-200 after:ease-out ${
                  activeView === 'public-about'
                    ? 'after:w-full text-[#0f2942] font-semibold'
                    : 'after:w-0 hover:after:w-full hover:text-[#0f2942]'
                }`}
              >
                Cara Kerja
              </button>
            </>
          )}
        </nav>

        {/* Zone 3: Primary Auth / Portal Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#f8fafc] border border-slate-200 text-xs">
                {currentUser.role === 'admin' ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-[#1e3a8a]" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5 text-[#0284c7]" />
                )}
                <span className="font-semibold text-[#0f2942] max-w-[110px] truncate" title={currentUser.name}>
                  {currentUser.name.split(' ')[0]}
                </span>
                <span className="text-slate-300" aria-hidden="true">·</span>
                <span className="text-slate-600 font-medium">
                  {currentUser.role === 'admin' ? 'Admin' : 'Petugas'}
                </span>
              </div>

              {isOperatorMode ? (
                <button
                  type="button"
                  onClick={() => handleNavClick('landing')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0f2942] bg-white hover:bg-sky-50/50 rounded-xl border border-slate-200 hover:border-sky-300 transition-all duration-200 ease-out active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Halaman Publik
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleNavClick('operator-device')}
                  className="group inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0f2942] hover:bg-[#1e3a8a] rounded-xl transition-all duration-200 ease-out active:scale-95 hover:shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-[#38bdf8] transition-transform duration-200 ease-out group-hover:scale-105" />
                  <span>Buka Dashboard</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-md bg-[#38bdf8] text-[#0f2942] text-[10px] font-bold tabular-nums">
                      {unreadCount}
                    </span>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-200 transition-all duration-200 ease-out active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
                title="Keluar dari sesi"
                aria-label="Keluar"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Keluar</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenLogin}
              className="group inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0f2942] hover:bg-[#1e3a8a] rounded-xl transition-all duration-200 ease-out active:scale-95 hover:shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
              title="Masuk ke Portal Petugas Lapangan atau Administrator"
            >
              <LogIn className="w-3.5 h-3.5 text-[#38bdf8] transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
              <span>Masuk Portal</span>
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-[#0f2942] hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            aria-label="Buka menu navigasi"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white w-full max-w-full px-4 pt-3 pb-5 space-y-1.5 box-border">
          {currentUser && (
            <div className="p-3 mb-2 rounded-xl bg-[#f8fafc] border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[#0f2942]">{currentUser.name}</div>
                <p className="text-[11px] text-slate-500 font-mono truncate">
                  {currentUser.role === 'admin' ? 'Administrator' : 'Petugas Lapangan'} · {currentUser.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="text-xs font-semibold text-rose-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => handleNavClick('landing')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium ${
              activeView === 'landing' ? 'bg-sky-50 text-[#0f2942] font-semibold' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            Beranda
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('ai-scanner')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between ${
              activeView === 'ai-scanner' ? 'bg-sky-50 text-[#0f2942] font-semibold' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>AI Waste Scanner</span>
            <span className="text-[11px] text-[#0284c7] font-semibold">Vision AI</span>
          </button>

          {currentUser ? (
            <>
              <button
                type="button"
                onClick={() => handleNavClick('operator-device')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                  activeView === 'operator-device' ? 'bg-sky-50 text-[#0f2942] font-semibold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Monitoring Alat (SEABRIS-01)
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('operator-oceanography')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                  activeView === 'operator-oceanography' ? 'bg-sky-50 text-[#0f2942] font-semibold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Oseanografi Muara Angke
              </button>
              {currentUser.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => handleNavClick('operator-map')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                    activeView === 'operator-map' ? 'bg-sky-50 text-[#0f2942] font-semibold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Peta Lokasi Teluk Jakarta
                </button>
              )}
              <button
                type="button"
                onClick={() => handleNavClick('operator-reports')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                  activeView === 'operator-reports' ? 'bg-sky-50 text-[#0f2942] font-semibold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Laporan Masyarakat
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('operator-device')}
                className="w-full mt-2 flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#0f2942] text-white text-sm font-semibold"
              >
                <span>Buka Dashboard Operasional</span>
                <ArrowRight className="w-4 h-4 text-[#38bdf8]" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleNavClick('public-oceanography')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                  activeView === 'public-oceanography' || activeView === 'oceanography'
                    ? 'bg-sky-50 text-[#0f2942] font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Oseanografi Muara Angke
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('public-report')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                  activeView === 'public-report' ? 'bg-sky-50 text-[#0f2942] font-semibold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Formulir Laporkan Sampah
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('public-about')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                  activeView === 'public-about' ? 'bg-sky-50 text-[#0f2942] font-semibold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Cara Kerja Sistem
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLogin();
                }}
                className="w-full mt-2 flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#0f2942] text-white text-sm font-semibold"
              >
                <span className="flex items-center gap-2">
                  <LogIn className="w-4 h-4 text-[#38bdf8]" />
                  <span>Masuk Portal (Petugas / Admin)</span>
                </span>
                <ArrowRight className="w-4 h-4 text-[#38bdf8]" />
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
};
