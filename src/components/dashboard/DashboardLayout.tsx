import React, { useState } from 'react';
import {
  Activity,
  Map,
  FileText,
  Bell,
  Menu,
  X,
  BarChart3,
  Compass,
  LogOut,
  ShieldCheck,
  UserCheck,
  Box,
  LayoutTemplate,
  Globe,
} from 'lucide-react';
import { AppNotification, AuthUser, User as AppUser } from '../../types';

interface DashboardLayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onExitToPublic?: () => void;
  notifications: AppNotification[];
  currentUser?: AuthUser | AppUser | null;
  onLogout?: () => void;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  currentTab,
  onSelectTab,
  onExitToPublic,
  notifications,
  currentUser = null,
  onLogout,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadNotifs = notifications.filter((n) => !n.read).length;
  const isOperator = currentUser?.role === 'operator';

  const menuItems = isOperator
    ? [
        { id: 'device', label: 'Status Perangkap (50L/25kg)', icon: Activity },
        { id: 'map', label: 'Peta Lokasi Teluk Jakarta', icon: Map },
        { id: 'reports', label: 'Laporan Masyarakat', icon: FileText },
        { id: 'analytics', label: 'Statistik & Riwayat Scan', icon: BarChart3 },
        { id: 'notifications', label: 'Notifikasi Lapangan', icon: Bell, badge: unreadNotifs },
      ]
    : [
        { id: 'device', label: 'Monitoring Alat', icon: Activity },
        { id: 'digital-twin', label: 'Digital Twin 3D', icon: Box },
        { id: 'oceanography', label: 'Oseanografi Muara Angke', icon: Compass },
        { id: 'map', label: 'Peta Lokasi Teluk Jakarta', icon: Map },
        { id: 'reports', label: 'Laporan Masyarakat', icon: FileText },
        { id: 'analytics', label: 'Statistik & Riwayat Scan', icon: BarChart3 },
        { id: 'notifications', label: 'Notifikasi & Peringatan', icon: Bell, badge: unreadNotifs },
      ];

  const activeItem = menuItems.find((item) => item.id === currentTab) || menuItems[0];

  const handleSelect = (tabId: string) => {
    onSelectTab(tabId);
    setMobileMenuOpen(false);
  };

  const renderSidebarNav = () => (
    <div className="flex flex-col h-full">
      {/* Brand Block */}
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <button
          type="button"
          onClick={() => handleSelect('device')}
          className="flex items-center gap-3 text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-[#0284c7] rounded-lg"
        >
          <div className="w-9 h-9 rounded-xl bg-[#f8fafc] border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
            <img
              src="/assets/aistudio/1__1__22a3ff2f.png"
              alt="SEABRIS Logo"
              className="w-full h-full object-contain p-0.5"
            />
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight text-[#0f2942] block leading-tight">
              SEABRIS
            </span>
            <span className="text-[11px] font-semibold text-[#0284c7] block">
              {isOperator ? 'Portal Petugas' : 'Portal Admin'}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
          aria-label="Tutup menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-1.5 text-[11px] font-semibold text-slate-400">
          Menu Operasional
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              className={`group w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ease-out active:scale-[0.98] cursor-pointer text-left ${
                isActive
                  ? 'bg-[#0f2942] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#0f2942] hover:bg-sky-50/70'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors duration-200 ${
                    isActive
                      ? 'text-[#38bdf8]'
                      : 'text-slate-400 group-hover:text-[#0284c7]'
                  }`}
                />
                <span className="truncate transition-transform duration-200 ease-out group-hover:translate-x-0.5">
                  {item.label}
                </span>
              </span>

              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold tabular-nums shrink-0 ${
                    isActive ? 'bg-[#38bdf8] text-[#0f2942]' : 'bg-rose-600 text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Bottom: User Profile & Actions */}
      <div className="p-3 border-t border-slate-200 space-y-2 bg-[#f8fafc]">
        {currentUser && (
          <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0f2942] text-white flex items-center justify-center font-bold text-xs shrink-0">
              {currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-[#0f2942] truncate" title={currentUser.name}>
                {currentUser.name}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                {currentUser.role === 'admin' ? (
                  <>
                    <ShieldCheck className="w-3 h-3 text-[#1e3a8a]" />
                    <span>Admin Utama</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-3 h-3 text-[#0284c7]" />
                    <span>Petugas Lapangan</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          {onExitToPublic && (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onExitToPublic();
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-sky-50/60 text-[#0f2942] border border-slate-200 hover:border-sky-300 text-xs font-semibold transition-all duration-200 ease-out active:scale-95 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#0284c7]" />
              <span>Publik</span>
            </button>
          )}

          {onLogout && (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onLogout();
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 hover:border-rose-300 text-xs font-semibold transition-all duration-200 ease-out active:scale-95 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] flex text-[#0f2942] w-full max-w-full overflow-x-hidden box-border">
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-slate-200 z-40">
        {renderSidebarNav()}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#0f2942]/40 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-white border-r border-slate-200 h-full z-10 shadow-xl">
            {renderSidebarNav()}
          </aside>
        </div>
      )}

      {/* Main Column */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 text-[#0f2942] hover:bg-slate-50 cursor-pointer"
              aria-label="Buka menu samping"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>{isOperator ? 'Portal Petugas' : 'Portal Admin'}</span>
                <span aria-hidden="true">/</span>
                <span className="font-semibold text-[#0f2942] truncate">
                  {activeItem?.label}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f8fafc] border border-slate-200 text-xs font-semibold text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="hidden sm:inline">Telemetri Online</span>
              <span className="sm:hidden">Online</span>
            </div>
          </div>
        </header>

        {/* Main Content Viewport */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 box-border">
          {children}
        </main>

        {/* Quiet Footer */}
        <footer className="w-full py-4 px-4 sm:px-6 lg:px-8 border-t border-slate-200 bg-white text-center text-xs text-slate-500">
          SEABRIS · Smart Marine Debris Management System · Muara Angke, Teluk Jakarta
        </footer>
      </div>
    </div>
  );
};
