import React from 'react';
import { 
  X, 
  Cpu, 
  Waves, 
  SunMedium, 
  ShieldCheck, 
  ArrowRight,
  Fish,
  Compass,
  CheckCircle2
} from 'lucide-react';

interface SystemWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMonitoring: () => void;
}

export const SystemWorkflowModal: React.FC<SystemWorkflowModalProps> = ({
  isOpen,
  onClose,
  onOpenMonitoring,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
              <img src="/assets/aistudio/1__1__22a3ff2f.png" alt="SEABRIS" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Cara Kerja Sistem SEABRIS
              </h3>
              <p className="text-[11px] text-slate-500">
                SEABRIS — Smart Marine Debris Management System
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
          <p>
            SEABRIS memadukan penghalang mekanis terapung (floating boom barrier) dengan sensor ketinggian ultrasonik cerdas untuk menangani sampah plastik di muara sungai sebelum mencapai perairan laut lepas Teluk Jakarta.
          </p>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-[#0077B6]" />
                <span>1. Intersepsi Sampah Terapung</span>
              </h4>
              <p>
                Pelampung silindris terangkai melintang di muara secara diagonal, memanfaatkan arus alami air sungai untuk menggiring botol plastik, styrofoam, dan kemasan terapung ke mulut keranjang penampung.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-[#0077B6]" />
                <span>2. Pengukuran Volume Sensor Ultrasonik</span>
              </h4>
              <p>
                Modul sensor tahan air memancarkan gelombang suara ke dasar keranjang untuk mengukur jarak ruang kosong. Mikrokontroler menghitung persentase keterisian keranjang (0–100%) dan mengonversinya menjadi estimasi berat timbulan sampah (kg).
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <SunMedium className="w-4 h-4 text-[#0077B6]" />
                <span>3. Mandiri Energi & Transmisi Telemetri</span>
              </h4>
              <p>
                Perangkat bertenaga surya 20W dengan baterai LiFePO4 mengirimkan paket data telemetri berkala ke dashboard monitoring. Saat keterisian mencapai 80% (Waspada) dan 90% (Kritis), sistem otomatis mengeluarkan sinyal evakuasi armada petugas.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
