import React, { useState, useEffect, useRef } from 'react';
import { 
  LandingCmsContent, 
  DEFAULT_LANDING_CONTENT, 
  PRESET_IMAGE_OPTIONS, 
  landingCmsService 
} from '../../services/landingCmsService';
import { AuthUser, User } from '../../types';
import { 
  LayoutTemplate, 
  Save, 
  RotateCcw, 
  Upload, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  ExternalLink, 
  Sparkles, 
  Cpu, 
  Users, 
  ShieldAlert, 
  Clock, 
  Trash2,
  Layers,
  FileText,
  RefreshCw
} from 'lucide-react';

interface LandingContentManagerProps {
  currentUser?: AuthUser | User | null;
  onNavigateToLanding?: () => void;
  isModalView?: boolean;
  onCloseModal?: () => void;
}

export const LandingContentManager: React.FC<LandingContentManagerProps> = ({
  currentUser,
  onNavigateToLanding,
  isModalView = false,
  onCloseModal
}) => {
  const [content, setContent] = useState<LandingCmsContent>(() => landingCmsService.getContent());
  const [activeSection, setActiveSection] = useState<'hero' | 'features' | 'urgency'>('hero');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [showLivePreview, setShowLivePreview] = useState<boolean>(false);

  // File input refs for uploading images
  const heroFileRef = useRef<HTMLInputElement>(null);
  const sensorFileRef = useRef<HTMLInputElement>(null);
  const actionFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = landingCmsService.subscribe((updated) => {
      setContent(updated);
    });
    return () => unsubscribe();
  }, []);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  };

  const handleInputChange = (field: keyof LandingCmsContent, value: string) => {
    setContent((prev: LandingCmsContent) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = async (
    field: 'heroImage' | 'sensorImage' | 'actionImage',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Silakan pilih file gambar yang valid (JPEG, PNG, WebP).');
      return;
    }

    try {
      showToast('info', 'Mengompres dan memuat pratinjau gambar...');
      const base64 = await landingCmsService.compressAndReadFile(file, 1280, 0.82);
      setContent((prev: LandingCmsContent) => ({
        ...prev,
        [field]: base64
      }));
      showToast('success', 'Gambar berhasil dimuat ke pratinjau. Klik "Simpan Perubahan" untuk menerapkan.');
    } catch (err: any) {
      showToast('error', err?.message || 'Gagal memproses file gambar.');
    } finally {
      // Reset input value so same file can be selected again
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const userName = currentUser ? `${currentUser.name} (${currentUser.role})` : 'Admin SEABRIS';
      const saved = await landingCmsService.saveContent(content, userName);
      setContent(saved); // foto yang diunggah kini berupa URL penyimpanan
      showToast('success', 'Konten dan foto beranda berhasil disimpan dan langsung aktif di web publik!');
    } catch (err: any) {
      showToast('error', err?.message || 'Gagal menyimpan perubahan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Apakah Anda yakin ingin mereset seluruh teks headline dan foto di Beranda ke kondisi bawaan (default)? Perubahan Anda sebelumnya akan dihapus.')) {
      const userName = currentUser ? currentUser.name : 'Admin';
      try {
        const resetData = await landingCmsService.resetToDefault(userName);
        setContent(resetData);
        showToast('info', 'Seluruh konten dan aset foto telah dikembalikan ke kondisi default proyek.');
      } catch (err: any) {
        showToast('error', err?.message || 'Gagal mereset konten.');
      }
    }
  };

  return (
    <div className={`space-y-6 ${isModalView ? 'p-1' : 'max-w-7xl mx-auto w-full'}`}>
      {/* Toast Notification Banner */}
      {notification && (
        <div 
          className={`p-4 rounded-xl flex items-center justify-between gap-3 text-sm font-medium shadow-md transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${
            notification.type === 'success' 
              ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
              : notification.type === 'error'
              ? 'bg-rose-600 text-white shadow-rose-600/20'
              : 'bg-cyan-600 text-white shadow-cyan-600/20'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
            {notification.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0" />}
            {notification.type === 'info' && <RefreshCw className="w-5 h-5 shrink-0 animate-spin" />}
            <span>{notification.message}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setNotification(null)}
            className="text-white/80 hover:text-white px-2 py-0.5 rounded text-xs cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Main Top Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-50 text-[#0077B6] border border-cyan-200">
              <LayoutTemplate className="w-3.5 h-3.5" />
              <span>CMS Beranda &amp; Aset Visual</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono text-slate-500 bg-slate-100 border border-slate-200">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Diperbarui: {new Date(content.lastUpdated || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB</span>
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Manajemen Konten &amp; Visual Landing Page
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
            Kelola judul headline, deskripsi pengantar, dan ganti seluruh foto instalasi atau dokumentasi lapangan pada halaman utama publik SEABRIS secara langsung dan real-time.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto shrink-0">
          {onNavigateToLanding && (
            <button
              type="button"
              onClick={onNavigateToLanding}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
              title="Lihat tampilan live di Beranda"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Lihat Beranda Publik</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
            title="Reset seluruh foto dan teks ke kondisi bawaan"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#0077B6] to-[#0284C7] hover:opacity-95 shadow-md shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Simpan Perubahan</span>
          </button>

          {isModalView && onCloseModal && (
            <button
              type="button"
              onClick={onCloseModal}
              className="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Tutup
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs for CMS Sections */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveSection('hero')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === 'hero'
                ? 'bg-[#0077B6] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>1. Hero Banner &amp; Headline Utama</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('features')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === 'features'
                ? 'bg-[#0077B6] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2. Foto &amp; Deskripsi Fitur Unggulan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('urgency')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === 'urgency'
                ? 'bg-[#0077B6] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>3. Teks Banner Urgensi Lingkungan</span>
          </button>
        </div>

        {/* Live Preview Toggle */}
        <button
          type="button"
          onClick={() => setShowLivePreview(!showLivePreview)}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
            showLivePreview 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' 
              : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{showLivePreview ? 'Sembunyikan Pratinjau' : 'Buka Pratinjau Cepat'}</span>
        </button>
      </div>

      {/* Mini Interactive Live Preview Box */}
      {showLivePreview && (
        <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                Pratinjau Langsung (Live Preview Beranda)
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Hasil simulasi tampilan hero
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7 space-y-3">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {content.heroTagline}
              </span>
              <h3 className="text-2xl font-extrabold text-white leading-tight">
                {content.heroHeadline}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                {content.heroSubheadline}
              </p>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-xl overflow-hidden border border-slate-800 relative h-48 bg-slate-950">
                <img 
                  src={content.heroImage} 
                  alt={content.heroImageTitle} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="text-[10px] font-mono uppercase text-cyan-400 block font-bold">
                    {content.heroImageBadge}
                  </span>
                  <div className="text-xs font-bold truncate">
                    {content.heroImageTitle}
                  </div>
                  <div className="text-[10px] text-slate-300">
                    {content.heroImageSubtitle}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: HERO SECTION & MAIN HEADLINE                                   */}
      {/* ========================================================================= */}
      {activeSection === 'hero' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: Text Inputs */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0077B6]" />
                <span>Headline &amp; Deskripsi Hero Section</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Teks utama yang pertama kali dilihat oleh pengunjung web publik SEABRIS.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tagline / Badge Kategori (Atas)
                </label>
                <input
                  type="text"
                  value={content.heroTagline}
                  onChange={(e) => handleInputChange('heroTagline', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0077B6] focus:border-transparent text-sm text-slate-900 font-medium"
                  placeholder="Contoh: Inovasi Smart City & Konservasi Bahari Teluk Jakarta"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Headline Utama (Judul H1)
                </label>
                <input
                  type="text"
                  value={content.heroHeadline}
                  onChange={(e) => handleInputChange('heroHeadline', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0077B6] focus:border-transparent text-sm sm:text-base text-slate-900 font-bold"
                  placeholder="Contoh: SEABRIS — Smart Marine Debris Management System"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Sub-Headline / Deskripsi Utama
                </label>
                <textarea
                  rows={4}
                  value={content.heroSubheadline}
                  onChange={(e) => handleInputChange('heroSubheadline', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0077B6] focus:border-transparent text-sm text-slate-800 leading-relaxed resize-none"
                  placeholder="Deskripsi singkat sistem SEABRIS..."
                />
              </div>

              {/* Sub-card details */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Badge Foto Hero
                  </label>
                  <input
                    type="text"
                    value={content.heroImageBadge}
                    onChange={(e) => handleInputChange('heroImageBadge', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800"
                    placeholder="Instalasi Lapangan"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Judul Overlay Foto
                  </label>
                  <input
                    type="text"
                    value={content.heroImageTitle}
                    onChange={(e) => handleInputChange('heroImageTitle', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800"
                    placeholder="Penghalang Terapung & Keranjang..."
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Lokasi Foto
                  </label>
                  <input
                    type="text"
                    value={content.heroImageSubtitle}
                    onChange={(e) => handleInputChange('heroImageSubtitle', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800"
                    placeholder="Muara Angke · Teluk Jakarta"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Form: Visual Photo Management */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#0077B6]" />
                <span>Foto Utama Hero (Visual Banner)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pratinjau dan ganti foto instalasi utama di sebelah kanan teks hero.
              </p>
            </div>

            {/* Current Image Preview */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 h-56 sm:h-64 shadow-inner group">
              <img
                src={content.heroImage}
                alt={content.heroImageTitle}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/20 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 text-white">
                <span className="text-[10px] font-mono uppercase text-cyan-300 font-bold">
                  {content.heroImageBadge}
                </span>
                <h4 className="text-sm font-bold truncate">
                  {content.heroImageTitle}
                </h4>
                <p className="text-[11px] text-slate-300">
                  {content.heroImageSubtitle}
                </p>
              </div>
            </div>

            {/* Upload Button & File Input */}
            <div className="space-y-3">
              <input
                ref={heroFileRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload('heroImage', e)}
                className="hidden"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => heroFileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#0077B6] hover:bg-[#0284C7] shadow-sm transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Foto dari PC</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const url = window.prompt('Masukkan URL gambar (HTTP / HTTPS):', content.heroImage);
                    if (url && url.trim()) {
                      handleInputChange('heroImage', url.trim());
                      showToast('success', 'URL gambar foto hero diperbarui.');
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
                >
                  <span>Input Link URL</span>
                </button>
              </div>

              {/* Quick Preset Selector */}
              <div>
                <span className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                  Atau Pilih Foto Preset Bawaan:
                </span>
                <div className="space-y-1.5">
                  {PRESET_IMAGE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        handleInputChange('heroImage', opt.url);
                        showToast('info', `Foto hero diganti ke preset: ${opt.label}`);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between border cursor-pointer ${
                        content.heroImage === opt.url
                          ? 'bg-cyan-50 text-[#0077B6] border-cyan-300 font-bold'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                      {content.heroImage === opt.url && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0077B6] shrink-0 ml-2" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: VISUAL FEATURES SPOTLIGHT (SENSOR & COMMUNITY ACTION)           */}
      {/* ========================================================================= */}
      {activeSection === 'features' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Sensor & Hardware Spotlight */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#0077B6]" />
                  <span>Fitur 1: Teknologi Sensor &amp; IoT</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kolom kiri pada bagian visual spotlight beranda.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tagline Kategori
                </label>
                <input
                  type="text"
                  value={content.sensorTagline}
                  onChange={(e) => handleInputChange('sensorTagline', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Judul Fitur Sensor
                </label>
                <input
                  type="text"
                  value={content.sensorTitle}
                  onChange={(e) => handleInputChange('sensorTitle', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Deskripsi Lengkap
                </label>
                <textarea
                  rows={3}
                  value={content.sensorDescription}
                  onChange={(e) => handleInputChange('sensorDescription', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 leading-relaxed resize-none"
                />
              </div>

              {/* Image Preview & Upload */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Foto Perangkat / Hardware:
                </span>

                <div className="h-44 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                  <img
                    src={content.sensorImage}
                    alt={content.sensorImageAlt}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <input
                  ref={sensorFileRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload('sensorImage', e)}
                  className="hidden"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => sensorFileRef.current?.click()}
                    className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-white bg-[#0077B6] hover:bg-[#0284C7] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Foto Sensor</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const url = window.prompt('Masukkan URL gambar sensor:', content.sensorImage);
                      if (url && url.trim()) handleInputChange('sensorImage', url.trim());
                    }}
                    className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 cursor-pointer"
                  >
                    Link URL
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Community & Coastal Action Spotlight */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#0077B6]" />
                  <span>Fitur 2: Kolaborasi &amp; Aksi Pesisir</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kolom kanan pada bagian visual spotlight beranda.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tagline Kategori
                </label>
                <input
                  type="text"
                  value={content.actionTagline}
                  onChange={(e) => handleInputChange('actionTagline', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Judul Fitur Kolaborasi
                </label>
                <input
                  type="text"
                  value={content.actionTitle}
                  onChange={(e) => handleInputChange('actionTitle', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Deskripsi Lengkap
                </label>
                <textarea
                  rows={3}
                  value={content.actionDescription}
                  onChange={(e) => handleInputChange('actionDescription', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 leading-relaxed resize-none"
                />
              </div>

              {/* Image Preview & Upload */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Foto Patroli / Aksi Pesisir:
                </span>

                <div className="h-44 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                  <img
                    src={content.actionImage}
                    alt={content.actionImageAlt}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <input
                  ref={actionFileRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload('actionImage', e)}
                  className="hidden"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => actionFileRef.current?.click()}
                    className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-white bg-[#0077B6] hover:bg-[#0284C7] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Foto Kegiatan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const url = window.prompt('Masukkan URL gambar kegiatan:', content.actionImage);
                      if (url && url.trim()) handleInputChange('actionImage', url.trim());
                    }}
                    className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 cursor-pointer"
                  >
                    Link URL
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: URGENSI LINGKUNGAN HIDUP BANNER                                 */}
      {/* ========================================================================= */}
      {activeSection === 'urgency' && (
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#0077B6]" />
              <span>Teks Banner Urgensi Lingkungan Teluk Jakarta</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Bagian banner biru gradien di bagian bawah beranda mengenai konservasi Teluk Jakarta.
            </p>
          </div>

          <div className="space-y-4 max-w-3xl">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Badge / Tagline Atas
              </label>
              <input
                type="text"
                value={content.urgencyTagline}
                onChange={(e) => handleInputChange('urgencyTagline', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900"
                placeholder="Urgensi Lingkungan Hidup"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Judul Utama Banner
              </label>
              <input
                type="text"
                value={content.urgencyTitle}
                onChange={(e) => handleInputChange('urgencyTitle', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base font-bold text-slate-900"
                placeholder="Mengapa Teluk Jakarta Membutuhkan Aksi Cepat?"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Paragraf Deskripsi
              </label>
              <textarea
                rows={4}
                value={content.urgencyDescription}
                onChange={(e) => handleInputChange('urgencyDescription', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 leading-relaxed resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating Save Reminder Bar if changes are active */}
      <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between gap-4 border border-slate-800 shadow-lg">
        <div className="flex items-center gap-2.5 text-xs">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-slate-300">
            Perubahan teks &amp; gambar yang disimpan akan langsung tampak pada semua pengunjung Beranda secara permanen (tersimpan di browser).
          </span>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors shadow-sm cursor-pointer shrink-0"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Simpan Sekarang</span>
        </button>
      </div>
    </div>
  );
};

export default LandingContentManager;