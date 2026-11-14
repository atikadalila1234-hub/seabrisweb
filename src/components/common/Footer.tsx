import React from 'react';
import { Cpu, MapPin, ShieldCheck } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full max-w-full bg-[#0f2942] text-slate-300 text-sm border-t border-slate-800 box-border overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 box-border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Mission */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5 text-white">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src="/assets/aistudio/1__1__22a3ff2f.png"
                  alt="SEABRIS Logo"
                  className="w-full h-full object-contain p-0.5"
                />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-white">SEABRIS</span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed max-w-md">
              SEABRIS — Smart Marine Debris Management System merupakan portal layanan publik dan sistem monitoring
              penangkap sampah plastik terapung berbasis IoT untuk kawasan pesisir Teluk Jakarta.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#38bdf8]" />
                Pesisir Teluk Jakarta, DKI Jakarta
              </span>
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#38bdf8]" />
                Arsitektur Telemetri ESP32
              </span>
            </div>
          </div>

          {/* Navigasi Utama */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white">
              Navigasi Layanan
            </h4>
             <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('landing')}
                  className="hover:text-[#38bdf8] transition-colors text-left cursor-pointer"
                >
                  Beranda
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('ai-scanner')}
                  className="hover:text-[#38bdf8] transition-colors text-left cursor-pointer"
                >
                  AI Waste Scanner
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('public-oceanography')}
                  className="hover:text-[#38bdf8] transition-colors text-left cursor-pointer"
                >
                  Oseanografi
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('public-report')}
                  className="hover:text-[#38bdf8] transition-colors text-left cursor-pointer"
                >
                  Laporkan Sampah
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('public-about')}
                  className="hover:text-[#38bdf8] transition-colors text-left cursor-pointer"
                >
                  Cara Kerja
                </button>
              </li>
            </ul>
             </div> 

          {/* Status Sistem & Standar */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white">
              Keterangan Sistem
            </h4>
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-[11px] leading-relaxed text-slate-300 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-[#38bdf8]">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Simulasi Monitoring Aktif</span>
              </div>
              <p>
                Data telemetri menggunakan simulasi sensor terkalibrasi untuk uji operasional, siap terhubung ke modul perangkat ESP32 fisik.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© 2026 SEABRIS — Smart Marine Debris Management System. Hak cipta dilindungi.</p>
          <p>Pelestarian Ekosistem Bahari Pesisir Teluk Jakarta</p>
        </div>
      </div>
    </footer>
  );
};
