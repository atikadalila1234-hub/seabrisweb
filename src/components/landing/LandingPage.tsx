import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Compass, 
  SunMedium, 
  AlertTriangle, 
  Users, 
  ShieldCheck, 
  CheckCircle2, 
  Trash2, 
  Fish, 
  Trees, 
  LayoutTemplate, 
  Edit3 
} from 'lucide-react';
import { Device, AuthUser, User, LandingCmsContent } from '../../types';
import { AngkeDebrisEducation } from './AngkeDebrisEducation';
import { landingCmsService } from '../../services/landingCmsService';
import { HeroSlider, HeroSlide } from './HeroSlider';
import { motion } from 'motion/react';

interface LandingPageProps {
  onNavigate: (view: string) => void;
  primaryDevice: Device;
  currentUser?: AuthUser | User | null;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    image: new URL('../../assets/images/lapangan_01_panorama_kota.jpg', import.meta.url).href,
    alt: 'Perahu dan tumpukan sampah di perairan pelabuhan dengan latar gedung tinggi',
    badge: 'Kondisi Lapangan',
    title: 'Sampah Menumpuk di Tepi Pelabuhan',
  },
  {
    image: new URL('../../assets/images/lapangan_02_tepi_dermaga.jpg', import.meta.url).href,
    alt: 'Sampah plastik dan styrofoam terkumpul di tepi dermaga',
    badge: 'Kondisi Lapangan',
    title: 'Botol Plastik & Styrofoam di Tepi Dermaga',
  },
  {
    image: new URL('../../assets/images/lapangan_03_bawah_dermaga.jpg', import.meta.url).href,
    alt: 'Sampah plastik tersangkut di bawah dermaga kayu',
    badge: 'Kondisi Lapangan',
    title: 'Sampah Tersangkut di Bawah Dermaga',
  },
  {
    image: new URL('../../assets/images/lapangan_04_sampah_terapung.jpg', import.meta.url).href,
    alt: 'Sampah terapung di permukaan air dekat dermaga',
    badge: 'Kondisi Lapangan',
    title: 'Sampah Terapung yang Terbawa Arus',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  primaryDevice,
  currentUser,
}) => {
  const [cmsContent, setCmsContent] = useState<LandingCmsContent>(() => landingCmsService.getContent());

  useEffect(() => {
    const unsubscribe = landingCmsService.subscribe((updated) => {
      setCmsContent(updated);
    });
    return () => unsubscribe();
  }, []);

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-16 sm:space-y-24 pb-16 box-border relative">
      {/* Admin CMS Notice Banner if logged in as Admin */}
      {isAdmin && (
        <div className="w-full bg-gradient-to-r from-indigo-900 via-slate-900 to-cyan-950 text-white px-4 py-2.5 border-b border-indigo-500/30 sticky top-0 z-30 shadow-xs">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-semibold text-cyan-300">Mode Admin Aktif:</span>
              <span className="text-slate-200">
                Konten teks dan foto halaman beranda ini dapat diedit langsung secara dinamis melalui CMS.
              </span>
            </div>
            <button
              onClick={() => onNavigate('operator-cms')}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#00B4D8] hover:bg-[#0096C7] text-slate-950 font-bold transition-colors cursor-pointer shadow-xs text-[11px]"
            >
              <LayoutTemplate className="w-3.5 h-3.5 text-slate-950" />
              <span>Buka Editor CMS Beranda</span>
            </button>
          </div>
        </div>
      )}

      {/* Hero Section: foto lapangan sebagai background yang bergeser otomatis */}
      <HeroSlider slides={HERO_SLIDES} intervalMs={3000}>
        <div className="max-w-4xl mx-auto text-center space-y-6">
  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur border border-white/30 text-xs sm:text-sm font-semibold text-white">
    <span className="w-2 h-2 rounded-full bg-cyan-300"></span>
    <span>Krisis Sampah Pesisir & Konservasi Teluk Jakarta</span>
  </div>

  <h1
    className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.15]"
    style={{ textWrap: 'balance' }}
  >
    Darurat Sampah Laut Indonesia, Berujung di Muara Angke.
  </h1>

  <p className="text-sm sm:text-base lg:text-lg text-slate-200 font-normal leading-relaxed max-w-3xl mx-auto">
    Indonesia menyumbang jutaan ton sampah plastik ke laut setiap tahunnya. Situasi ini
    berdampak nyata pada ekosistem pesisir kita seperti yang terlihat jelas di kawasan
    perairan dan pelabuhan Muara Angke, di mana tumpukan botol plastik, jaring, dan limbah
    domestik mendominasi garis pantai serta mengancam aktivitas nelayan.
  </p>
</div>
      </HeroSlider>

      {/* Section Edukasi & Transparansi Data Krisis Sampah Muara Angke (Di Atas Alur Kerja Terintegrasi) */}
      <AngkeDebrisEducation
        onExploreScanner={() => onNavigate('ai-scanner')}
      />

            {/* Banner foto: Solusi SEABRIS (card melengkung) */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 box-border">
        <section className="relative isolate w-full overflow-hidden rounded-3xl bg-slate-900 min-h-[560px] lg:min-h-[640px] flex items-center box-border shadow-xl">
          <img
            src={new URL('../../assets/images/bg_seabris.jpeg', import.meta.url).href}
            alt="Kapal nelayan bersandar di pelabuhan Muara Angke dengan latar gedung tinggi"
            className="absolute inset-0 -z-10 w-full h-full object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-950/70 via-slate-950/60 to-slate-950/80" />

          <div className="w-full px-6 sm:px-10 lg:px-14 py-16">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8 lg:gap-14">
              {/* Logo (kiri) */}
              <motion.img
                src={new URL('../../assets/images/logo_seabris.jpeg', import.meta.url).href}
                alt="Logo SEABRIS"
                className="w-36 sm:w-48 lg:w-72 shrink-0 object-contain mix-blend-screen"
                initial={{ opacity: 0, x: -120 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
              />

              {/* Teks (kanan, rata kiri) */}
              <motion.div
                className="max-w-3xl space-y-6 text-left"
                initial={{ opacity: 0, x: 60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.9, delay: 0.2, ease: 'easeOut' }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur border border-white/30 text-xs sm:text-sm font-semibold text-white uppercase tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-cyan-300"></span>
                  <span>Inovasi Smart City & Konservasi Bahari</span>
                </div>

                <h2
                  className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.15]"
                  style={{ textWrap: 'balance' }}
                >
                  SEABRIS Hadir Sebagai Solusi Nyata Pembersihan & Pemantauan Pesisir Berbasis IoT.
                </h2>

                <p className="text-sm sm:text-base lg:text-lg text-slate-200 font-normal leading-relaxed">
                  Di tengah tantangan darurat sampah plastik di Teluk Jakarta, SEABRIS (Smart Marine
                  Debris Management System) memadukan teknologi kecerdasan buatan, sistem perangkat
                  keras penangkap sampah terapung otomatis (Marine Trash Trap), dan platform
                  dashboard pemantauan. Kami mentransformasi cara pengelolaan limbah pesisir di
                  Muara Angke agar lebih efektif, terukur, dan berkelanjutan.
                </p>
              </motion.div>
            </div>
          </div>
        </section>
      </div>

      {/* Cara Kerja Sistem Section */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 box-border">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0077B6]">
            Alur Kerja Terintegrasi
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Bagaimana Sistem SEABRIS Menghentikan Sampah Plastik?
          </h2>
          <p className="text-sm text-slate-600">
            Kombinasi mekanika hidrologis terapung dan kecerdasan sensor IoT untuk mencegah limbah perkotaan lepas ke laut dalam.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Step 1 */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow transition-shadow space-y-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-100 text-[#0077B6] flex items-center justify-center font-bold text-sm">
              01
            </div>
            <h3 className="font-bold text-slate-900 text-sm">
              Floating Barrier Boom
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pelampung bersayap jaring hidrolis menangkap dan mengarahkan sampah plastik terapung yang terbawa arus sungai tanpa menghambat aliran air alami.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow transition-shadow space-y-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-100 text-[#0077B6] flex items-center justify-center font-bold text-sm">
              02
            </div>
            <h3 className="font-bold text-slate-900 text-sm">
              Keranjang Penampung
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Limbah diarahkan menuju sangkar penampung baja galvanis tahan korosi air laut (kapasitas 1.200–1.800 Liter) dengan jaring penahan arus balik.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow transition-shadow space-y-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-100 text-[#0077B6] flex items-center justify-center font-bold text-sm">
              03
            </div>
            <h3 className="font-bold text-slate-900 text-sm">
              Sensor Ultrasonik IoT
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sensor tahan air JSN-SR04T memancarkan gelombang sonik berkala ke tumpukan sampah untuk memperkirakan ketinggian dan volume ruang kosong.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow transition-shadow space-y-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-100 text-[#0077B6] flex items-center justify-center font-bold text-sm">
              04
            </div>
            <h3 className="font-bold text-slate-900 text-sm">
              Monitoring & Peringatan
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mikrokontroler ESP32 mentransmisikan data tingkat keterisian ke sistem cloud. Ketika mencapai ambang batas 80% & 90%, notifikasi otomatis dikirim.
            </p>
          </div>

          {/* Step 5 */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow transition-shadow space-y-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-100 text-[#0077B6] flex items-center justify-center font-bold text-sm">
              05
            </div>
            <h3 className="font-bold text-slate-900 text-sm">
              Evakuasi Cepat Tim
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Petugas kebersihan air dan perahu penjemput sampah langsung menuju titik alat sebelum keranjang meluap, memilah dan mendaur ulang limbah di darat.
            </p>
          </div>
        </div>
      </section>

      {/* Visual Feature Spotlight (2-column layout) - Dynamic from CMS */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 box-border">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Card 1: Hardware & Sensor */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between group">
            <div className="p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0077B6]">
                  <Cpu className="w-4 h-4" />
                  <span>{cmsContent.sensorTagline || 'Teknologi Sensor & Arsitektur'}</span>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => onNavigate('operator-cms')}
                    className="text-[11px] font-medium text-cyan-700 hover:text-cyan-900 flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit di CMS</span>
                  </button>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                {cmsContent.sensorTitle}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {cmsContent.sensorDescription}
              </p>
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" />
                  <span>Ambang batas peringatan bertingkat (80% Waspada, 90% Kritis)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" />
                  <span>Mekanisme hemat daya dengan interval transmisi adaptif</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" />
                  <span>Dukungan konektivitas hybrid (Wi-Fi, GSM 4G, & LoRaWAN)</span>
                </li>
              </ul>
            </div>
            <div className="px-6 pb-6 relative">
              <div className="rounded-xl overflow-hidden h-52 bg-slate-100 border border-slate-200 relative">
                <img
                  src={cmsContent.sensorImage}
                  alt={cmsContent.sensorImageAlt || "Modul Sensor Ultrasonik IoT SEABRIS"}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                  referrerPolicy="no-referrer"
                />
                {isAdmin && (
                  <button
                    onClick={() => onNavigate('operator-cms')}
                    title="Ganti Foto Sensor di CMS"
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur border border-white/20 transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[11px] font-medium cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3 text-cyan-300" />
                    <span>Ganti Foto</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Kolaborasi & Dampak Lapangan */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between group">
            <div className="p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0077B6]">
                  <Users className="w-4 h-4" />
                  <span>{cmsContent.actionTagline || 'Kolaborasi Petugas & Partisipasi Publik'}</span>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => onNavigate('operator-cms')}
                    className="text-[11px] font-medium text-cyan-700 hover:text-cyan-900 flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit di CMS</span>
                  </button>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                {cmsContent.actionTitle}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {cmsContent.actionDescription}
              </p>
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Deteksi lokasi otomatis berbasis GPS peramban web pengguna</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Verifikasi foto sampah dan klasifikasi jenis polimer plastik</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Pelacakan status penanganan (Menunggu Verifikasi → Diproses → Selesai)</span>
                </li>
              </ul>
            </div>
            <div className="px-6 pb-6 relative">
              <div className="rounded-xl overflow-hidden h-52 bg-slate-100 border border-slate-200 relative">
                <img
                  src={cmsContent.actionImage}
                  alt={cmsContent.actionImageAlt || "Aksi Pembersihan dan Patroli Tim Lingkungan"}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                  referrerPolicy="no-referrer"
                />
                 <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/55 backdrop-blur-sm text-[10px] font-medium text-white/90">
              Sumber: Katadata
            </span>
                {isAdmin && (
                  <button
                    onClick={() => onNavigate('operator-cms')}
                    title="Ganti Foto Aksi di CMS"
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur border border-white/20 transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[11px] font-medium cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3 text-cyan-300" />
                    <span>Ganti Foto</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Keunggulan Inovasi Grid */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 box-border">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0077B6]">
            Keunggulan Inovasi
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Mengapa Pendekatan SEABRIS Lebih Efektif?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Mencegah sampah lolos ke laut lepas jauh lebih murah dan efisien dibandingkan membersihkan sampah yang sudah menyebar di kepulauan.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 hover:border-cyan-300 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-cyan-100 text-[#0077B6] flex items-center justify-center mb-3">
              <Compass className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm mb-1.5">Intersepsi di Hulu Muara</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Menahan sampah di 13 aliran muara sungai Jakarta sebelum menyebar ke perairan Kepulauan Seribu dan laut Jawa.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 hover:border-cyan-300 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-cyan-100 text-[#0077B6] flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm mb-1.5">Early Warning System</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mencegah keranjang penampung meluap saat hujan deras atau banjir kiriman berkat notifikasi keterisian bertingkat.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 hover:border-cyan-300 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-cyan-100 text-[#0077B6] flex items-center justify-center mb-3">
              <SunMedium className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm mb-1.5">Zero Carbon Footprint</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Perangkat beroperasi secara mandiri 100% menggunakan energi surya terbarukan, tanpa memerlukan kabel daya darat.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 hover:border-cyan-300 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-cyan-100 text-[#0077B6] flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm mb-1.5">Arsitektur Modular</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dirancang modular sehingga mudah dipindahkan, diservis, dan diperbanyak ke berbagai muara kanal strategis lainnya.
            </p>
          </div>
        </div>
      </section>

      {/* Floating Admin CMS Shortcut Trigger (Floating Action Button) */}
      {isAdmin && (
        <aside aria-label="Aksi Pintas Admin" className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => onNavigate('operator-cms')}
            className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-slate-900/95 hover:bg-slate-900 text-white border border-cyan-400/40 shadow-xl backdrop-blur-md transition-all hover:scale-105 group cursor-pointer"
            title="Kelola Konten Beranda di CMS"
          >
            <div className="w-6 h-6 rounded-full bg-[#00B4D8] text-slate-950 flex items-center justify-center">
              <LayoutTemplate className="w-3.5 h-3.5" />
            </div>
            <div className="text-left text-xs">
              <div className="font-bold text-white group-hover:text-cyan-300 transition-colors">
                Kelola Konten CMS
              </div>
              <div className="text-[10px] text-slate-400">
                Ganti Foto & Teks Headline
              </div>
            </div>
          </button>
        </aside>
      )}
    </div>
  );
};