import React from 'react';
import { 
  X, 
  HelpCircle, 
  AlertTriangle, 
  Recycle, 
  Leaf, 
  Waves, 
  CheckCircle2, 
  Fish,
  Info
} from 'lucide-react';

interface EducationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EducationDetailModal: React.FC<EducationDetailModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0077B6] flex items-center justify-center text-white">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Edukasi Material & Ekosistem Bahari
              </h3>
              <p className="text-[11px] text-slate-500">
                Panduan Ilmiah Penguraian, Fragmentasi, dan Pengelolaan Sampah Pesisir
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

        <div className="space-y-4 text-xs text-slate-600 leading-relaxed overflow-y-auto max-h-[65vh] pr-1">
          {/* Section 1: Perbedaan Biodegradasi vs Fragmentasi */}
          <div className="p-4 rounded-2xl bg-cyan-50/70 border border-cyan-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
              <Waves className="w-4 h-4 text-[#0077B6]" />
              <span>Penting: Membedakan Biodegradasi, Fragmentasi, dan Daur Ulang</span>
            </div>
            <ul className="space-y-1.5 text-slate-700 list-disc list-inside">
              <li>
                <strong>Biodegradasi Alami:</strong> Proses biologis di mana mikroorganisme (bakteri atau fungi) memecah struktur molekul organik menjadi air, karbon dioksida, dan biomassa alami.
              </li>
              <li>
                <strong>Fragmentasi (Bukan Penguraian Sejati):</strong> Plastik sintetis di laut tidak terurai secara biologis, melainkan rapuh akibat sinar UV matahari dan ombak, pecah menjadi serpihan mikroplastik (&lt;5 mm) yang tetap beracun bagi biota laut.
              </li>
              <li>
                <strong>Mitos Plastik Biodegradable di Laut:</strong> Banyak plastik berlabel <em>biodegradable</em> atau <em>oxodegradable</em> hanya dapat terurai pada fasilitas komposting industri bersuhu tinggi (&gt;55°C), dan sering kali tetap bertahan sangat lama di air laut yang bersuhu dingin.
              </li>
            </ul>
          </div>

          {/* Section 2: 4 Klasifikasi Penguraian */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-[#0077B6]">
              4 Kategori Potensi Penguraian Material
            </h4>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center gap-2 font-semibold text-emerald-800">
                <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                <span>A. Berpotensi Terurai Secara Biologis</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Contoh: Daun, pelepah kelapa, sisa makanan alami, dan kayu lapuk. Kecepatan penguraian sangat bergantung pada kadar oksigen terlarut, kelembapan, dan aktivitas mikroba muara.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center gap-2 font-semibold text-red-800">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                <span>B. Sulit Terurai Secara Biologis</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Contoh: Botol PET, kantong kresek LDPE, styrofoam (EPS), tali nilon, dan jaring ikan sintetis. Material ini bertahan puluhan hingga ratusan tahun dan berisiko tinggi membentuk mikroplastik sedimen.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center gap-2 font-semibold text-amber-800">
                <Recycle className="w-3.5 h-3.5 text-amber-600" />
                <span>C. Tidak Terurai Biologis, tapi Mengalami Perubahan Fisik/Kimia</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Contoh: Kaleng aluminium, seng, dan pecahan botol kaca. Kaleng akan teroksidasi dan berkarat karena salinitas tinggi, sementara kaca terkikis menjadi butiran pasir kaca halus.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <Info className="w-3.5 h-3.5 text-slate-600" />
                <span>D. Perlu Identifikasi Material Lebih Lanjut</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Digunakan ketika foto visual terhalang lumpur, material terlapisi biofilm alga, atau tersusun atas komposit campuran yang memerlukan uji laboratorium atau pemeriksaan fisik langsung.
              </p>
            </div>
          </div>

          {/* Section 3: Referensi Ilmiah */}
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
            <span className="font-semibold text-slate-700 block">Dasar Rujukan Edukasi:</span>
            <p>
              Prinsip klasifikasi ini mengacu pada panduan penanganan sampah laut dari <em>UN Environment Programme (UNEP) Marine Litter Guidelines</em>, publikasi <em>NOAA Marine Debris Program</em>, serta studi karakteristik sampah muara Teluk Jakarta.
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#0077B6] hover:bg-[#023E8A] text-white transition-colors"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
