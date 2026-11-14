import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Trash2,
  PieChart,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Layers,
  Recycle,
  Info,
  Search,
  Filter,
  Eye,
  Check,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  CheckSquare,
  Square,
  X,
} from 'lucide-react';
import { iotService } from '../../services/iotService';
import { authService } from '../../services/authService';
import { WasteScanResult, AuthUser, User } from '../../types';
import { SpotlightCard } from '../common/SpotlightCard';

interface WasteAnalyticsAndHistoryProps {
  scans: WasteScanResult[];
  currentUser?: AuthUser | User | null;
  onOpenScanner: () => void;
}

type DeleteConfirmState = {
  isOpen: boolean;
  type: 'single' | 'multiple' | 'all';
  targetScan?: WasteScanResult;
  count?: number;
};

export const WasteAnalyticsAndHistory: React.FC<WasteAnalyticsAndHistoryProps> = ({
  scans,
  currentUser = null,
  onOpenScanner,
}) => {
  // Filter & Search States
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModalScan, setActiveModalScan] = useState<WasteScanResult | null>(null);
  const [correctionOpen, setCorrectionOpen] = useState<boolean>(false);
  const [correctionNote, setCorrectionNote] = useState<string>('');

  // Admin Management & Bulk Actions State
  const [selectedScanIds, setSelectedScanIds] = useState<string[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<{
    message: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

  const isAdmin = currentUser?.role === 'admin' || authService.isAdmin();

  const stats = iotService.getWasteStatistics();
  const plasticPercentage =
    stats.totalScans > 0 ? Math.round((stats.plasticCount / stats.totalScans) * 100) : 0;
  const categories = Object.entries(stats.categoryDistribution).filter(
    ([, count]) => count > 0
  );

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => {
      setFeedbackToast(null);
    }, 3500);
  };

  // Chronological sorting (newest first) + Filtering
  const filteredScans = useMemo(() => {
    const sorted = [...scans].sort((a, b) => {
      const dateA = new Date(a.scannedAt || `${a.date} ${a.time}`).getTime() || 0;
      const dateB = new Date(b.scannedAt || `${b.date} ${b.time}`).getTime() || 0;
      return dateB - dateA;
    });

    return sorted.filter((scan) => {
      const matchesCategory =
        selectedCategory === 'all' || scan.primaryCategory === selectedCategory;
      const matchesStatus =
        selectedStatus === 'all' || scan.verificationStatus === selectedStatus;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        scan.ticketCode.toLowerCase().includes(q) ||
        scan.primaryMaterial.toLowerCase().includes(q) ||
        scan.primaryCategory.toLowerCase().includes(q) ||
        scan.detectedObjects.some((o) => o.name.toLowerCase().includes(q));

      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [scans, selectedCategory, selectedStatus, searchQuery]);

  // Verification update handler
  const handleUpdateVerification = (
    id: string,
    status: 'Belum Diverifikasi' | 'Terverifikasi Petugas' | 'Perlu Koreksi',
    notes?: string
  ) => {
    const verifierName = currentUser?.name
      ? `${currentUser.name} (${isAdmin ? 'Admin' : 'Petugas'})`
      : 'Petugas Pos Muara Angke';
    iotService.updateScanVerification(id, status, verifierName, notes);

    if (activeModalScan && activeModalScan.id === id) {
      setActiveModalScan({
        ...activeModalScan,
        verificationStatus: status,
        verifiedBy: verifierName,
        verifiedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        notes,
      });
    }

    showToast(`Status pemindaian diubah menjadi "${status}"`, 'success');
  };

  const handleToggleVerification = (scan: WasteScanResult) => {
    if (!isAdmin) return;
    const newStatus =
      scan.verificationStatus === 'Terverifikasi Petugas'
        ? 'Belum Diverifikasi'
        : 'Terverifikasi Petugas';
    handleUpdateVerification(scan.id, newStatus);
  };

  // Delete prompts (Admin only)
  const promptDeleteSingle = (scan: WasteScanResult) => {
    if (!isAdmin) return;
    setDeleteConfirm({ isOpen: true, type: 'single', targetScan: scan });
  };

  const promptDeleteMultiple = () => {
    if (!isAdmin || selectedScanIds.length === 0) return;
    setDeleteConfirm({ isOpen: true, type: 'multiple', count: selectedScanIds.length });
  };

  const promptDeleteAll = () => {
    if (!isAdmin || scans.length === 0) return;
    setDeleteConfirm({ isOpen: true, type: 'all', count: scans.length });
  };

  const handleExecuteDelete = () => {
    if (!deleteConfirm) return;

    if (deleteConfirm.type === 'single' && deleteConfirm.targetScan) {
      const code = deleteConfirm.targetScan.ticketCode;
      iotService.deleteScan(deleteConfirm.targetScan.id);
      setSelectedScanIds((prev) =>
        prev.filter((id) => id !== deleteConfirm.targetScan!.id)
      );
      if (activeModalScan?.id === deleteConfirm.targetScan.id) {
        setActiveModalScan(null);
      }
      showToast(`Data pemindaian #${code} berhasil dihapus.`, 'success');
    } else if (deleteConfirm.type === 'multiple') {
      const count = selectedScanIds.length;
      iotService.deleteMultipleScans(selectedScanIds);
      setSelectedScanIds([]);
      if (activeModalScan && selectedScanIds.includes(activeModalScan.id)) {
        setActiveModalScan(null);
      }
      showToast(`${count} data pemindaian terpilih berhasil dihapus.`, 'success');
    } else if (deleteConfirm.type === 'all') {
      const total = scans.length;
      iotService.deleteAllScans();
      setSelectedScanIds([]);
      setActiveModalScan(null);
      showToast(`Seluruh arsip (${total} entri) telah dibersihkan.`, 'success');
    }

    setDeleteConfirm(null);
  };

  const toggleSelectScan = (id: string) => {
    setSelectedScanIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllVisible = () => {
    const visibleIds = filteredScans.map((s) => s.id);
    const allSelected =
      visibleIds.length > 0 && visibleIds.every((id) => selectedScanIds.includes(id));

    if (allSelected) {
      setSelectedScanIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedScanIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleBulkVerify = () => {
    if (!isAdmin || selectedScanIds.length === 0) return;
    const verifierName = currentUser?.name
      ? `${currentUser.name} (Admin)`
      : 'Administrator Utama';
    selectedScanIds.forEach((id) => {
      iotService.updateScanVerification(id, 'Terverifikasi Petugas', verifierName);
    });
    showToast(`${selectedScanIds.length} data pemindaian berhasil diverifikasi.`, 'success');
    setSelectedScanIds([]);
  };

  const isAllVisibleSelected =
    filteredScans.length > 0 &&
    filteredScans.every((s) => selectedScanIds.includes(s.id));

  return (
    <div className="w-full max-w-full overflow-x-hidden box-border space-y-8">
      {/* Toast Feedback */}
      {feedbackToast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2.5 text-xs font-semibold ${
            feedbackToast.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : feedbackToast.type === 'info'
              ? 'bg-sky-50 text-[#0f2942] border-sky-200'
              : 'bg-emerald-50 text-emerald-900 border-emerald-200'
          }`}
        >
          {feedbackToast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{feedbackToast.message}</span>
        </div>
      )}

      {/* ================================================================ */}
      {/* BAGIAN ATAS: STATISTIK & ANALITIK IDENTIFIKASI SAMPAH AI          */}
      {/* ================================================================ */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#0284c7]">
              Analitik & Log Pemindaian Visual
            </p>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0f2942] tracking-tight">
              Statistik & Riwayat Scan Sampah
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ringkasan distribusi polimer sampah terdeteksi beserta catatan kronologis hasil pemindaian kamera
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenScanner}
            className="group inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-[#0f2942] hover:bg-[#1e3a8a] text-white transition-all duration-200 ease-out active:scale-95 hover:shadow-sm cursor-pointer whitespace-nowrap self-start sm:self-auto"
          >
            <Sparkles className="w-4 h-4 text-[#38bdf8] transition-transform duration-200 ease-out group-hover:scale-110" />
            <span>Buka AI Waste Scanner</span>
          </button>
        </div>

        {/* Transparency Disclaimer Notice */}
        <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-xl flex items-start gap-3">
          <Info className="w-5 h-5 text-[#0284c7] shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 space-y-1">
            <p className="font-semibold text-[#0f2942]">
              Transparansi Data & Batasan Metrik
            </p>
            <p className="leading-relaxed">
              Statistik dihitung langsung dari akumulasi sampel foto sampah yang telah dipindai dan tersimpan di sistem, bukan klaim total timbulan sampah keseluruhan perairan Teluk Jakarta.
            </p>
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SpotlightCard contentClassName="p-5 space-y-1.5">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Total Pemindaian</span>
              <Layers className="w-4 h-4 text-[#0284c7]" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-[#0f2942] tabular-nums">
              {stats.totalScans}
            </div>
            <p className="text-[11px] text-slate-500">Sampel tersimpan di basis data</p>
          </SpotlightCard>

          <SpotlightCard contentClassName="p-5 space-y-1.5">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Sampah Plastik</span>
              <Trash2 className="w-4 h-4 text-[#0284c7]" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-[#0f2942] tabular-nums">
              {stats.plasticCount}{' '}
              <span className="text-xs font-sans font-semibold text-[#0284c7]">
                ({plasticPercentage}%)
              </span>
            </div>
            <p className="text-[11px] text-slate-500">PET, film, dan alat tangkap</p>
          </SpotlightCard>

          <SpotlightCard contentClassName="p-5 space-y-1.5">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Sampah Non-Plastik</span>
              <Recycle className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-[#0f2942] tabular-nums">
              {stats.nonPlasticCount}
            </div>
            <p className="text-[11px] text-slate-500">Logam, kaca, dan organik</p>
          </SpotlightCard>

          <SpotlightCard contentClassName="p-5 space-y-1.5">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Menunggu Verifikasi</span>
              <AlertCircle
                className={`w-4 h-4 ${
                  stats.unverifiedCount > 0 ? 'text-amber-600' : 'text-slate-400'
                }`}
              />
            </div>
            <div
              className={`text-2xl font-extrabold font-mono tabular-nums ${
                stats.unverifiedCount > 0 ? 'text-amber-700' : 'text-[#0f2942]'
              }`}
            >
              {stats.unverifiedCount}
            </div>
            <p className="text-[11px] text-slate-500">Perlu tinjauan petugas</p>
          </SpotlightCard>
        </div>

        {/* Analytics Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <SpotlightCard
            className="lg:col-span-7"
            hoverLift={false}
            contentClassName="p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[#0f2942] text-sm">
                  Distribusi Kategori Sampah Terpindai
                </h3>
                <p className="text-xs text-slate-500">
                  Proporsi klasifikasi material berdasarkan riwayat pemindaian aktif
                </p>
              </div>
              <BarChart3 className="w-4 h-4 text-[#0284c7]" />
            </div>

            <div className="space-y-3 pt-1">
              {categories.length > 0 ? (
                categories.map(([catName, count]) => {
                  const pct =
                    stats.totalScans > 0
                      ? Math.round((count / stats.totalScans) * 100)
                      : 0;
                  let barColor = 'bg-[#0f2942]';
                  if (catName === 'Plastik') barColor = 'bg-[#0284c7]';
                  else if (catName === 'Alat Tangkap Perikanan') barColor = 'bg-[#1e3a8a]';
                  else if (catName === 'Logam') barColor = 'bg-amber-500';
                  else if (catName === 'Sampah Organik') barColor = 'bg-emerald-600';

                  return (
                    <div key={catName} className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-[#0f2942]">{catName}</span>
                        <span className="font-mono text-slate-600 tabular-nums">
                          {count} entri ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${barColor} rounded-full transition-all duration-300`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center py-8 text-slate-400 text-xs">
                  Belum ada data pemindaian tersimpan.
                </p>
              )}
            </div>
          </SpotlightCard>

          <SpotlightCard
            className="lg:col-span-5"
            hoverLift={false}
            contentClassName="p-6 space-y-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[#0f2942] text-sm">
                  Rasio Plastik vs Non-Plastik
                </h3>
                <p className="text-xs text-slate-500">
                  Dominasi polimer sintetis dan progres verifikasi lapangan
                </p>
              </div>
              <PieChart className="w-4 h-4 text-[#0284c7]" />
            </div>

            <div className="p-4 bg-[#f8fafc] rounded-xl border border-slate-200 flex items-center justify-around">
              <div className="text-center">
                <span className="text-3xl font-extrabold font-mono text-[#0f2942] tabular-nums block">
                  {plasticPercentage}%
                </span>
                <span className="text-xs font-semibold text-slate-700">Polimer Plastik</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">Sulit Terurai</span>
              </div>

              <div className="h-12 w-px bg-slate-200" />

              <div className="text-center">
                <span className="text-3xl font-extrabold font-mono text-emerald-700 tabular-nums block">
                  {stats.totalScans > 0 ? 100 - plasticPercentage : 0}%
                </span>
                <span className="text-xs font-semibold text-slate-700">Non-Plastik</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">Organik & Logam</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Status Verifikasi Petugas</span>
                <span className="font-bold font-mono text-[#0f2942] tabular-nums">
                  {stats.verifiedCount} / {stats.totalScans}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      stats.totalScans > 0
                        ? (stats.verifiedCount / stats.totalScans) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Petugas dan admin dapat memverifikasi atau mengoreksi jenis material pada log kronologis di bawah.
              </p>
            </div>
          </SpotlightCard>
        </div>
      </section>

      {/* ================================================================ */}
      {/* BAGIAN BAWAH: LOG RIWAYAT SCAN KRONOLOGIS & FILTER PRAKTIS       */}
      {/* ================================================================ */}
      <section className="space-y-4 pt-2 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-[#0f2942] tracking-tight">
                Log Riwayat Scan Kronologis
              </h3>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0284c7]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Kelola & Verifikasi Admin</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Menampilkan {filteredScans.length} dari {scans.length} arsip pemindaian terbaru hingga terlama
            </p>
          </div>

          {isAdmin && scans.length > 0 && (
            <button
              type="button"
              onClick={promptDeleteAll}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer self-start sm:self-auto"
              title="Hapus seluruh arsip log riwayat pemindaian"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Semua Arsip</span>
            </button>
          )}
        </div>

        {/* Admin Bulk Action Bar */}
        {isAdmin && selectedScanIds.length > 0 && (
          <div className="p-3.5 rounded-xl bg-[#0f2942] text-white flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-[#38bdf8] shrink-0" />
              <span className="text-xs font-semibold tabular-nums">
                {selectedScanIds.length} entri riwayat scan dipilih
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBulkVerify}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verifikasi Terpilih</span>
              </button>

              <button
                type="button"
                onClick={promptDeleteMultiple}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus ({selectedScanIds.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedScanIds([])}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Batal</span>
              </button>
            </div>
          </div>
        )}

        {/* Filter and Search Toolbar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {isAdmin && filteredScans.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAllVisible}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                  isAllVisibleSelected
                    ? 'bg-sky-50 border-[#38bdf8] text-[#0f2942]'
                    : 'bg-[#f8fafc] border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {isAllVisibleSelected ? (
                  <CheckSquare className="w-3.5 h-3.5 text-[#0284c7]" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>{isAllVisibleSelected ? 'Batalkan Pilihan' : 'Pilih Semua'}</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-[#0f2942] font-medium focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Kategori</option>
                <option value="Plastik">Plastik</option>
                <option value="Logam">Logam</option>
                <option value="Alat Tangkap Perikanan">Alat Tangkap Perikanan</option>
                <option value="Sampah Organik">Sampah Organik</option>
                <option value="Kaca">Kaca</option>
                <option value="Kertas dan Karton">Kertas dan Karton</option>
                <option value="Sampah Campuran">Sampah Campuran</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2">
              <span className="text-slate-500">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent text-[#0f2942] font-medium focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Status</option>
                <option value="Belum Diverifikasi">Belum Diverifikasi</option>
                <option value="Terverifikasi Petugas">Terverifikasi Petugas</option>
                <option value="Perlu Koreksi">Perlu Koreksi</option>
              </select>
            </div>
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari kode tiket, objek, atau material..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-[#0f2942] focus:outline-none focus:ring-2 focus:ring-[#38bdf8]"
            />
          </div>
        </div>

        {/* Chronological Table Log */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {filteredScans.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#f8fafc] text-slate-600 font-semibold text-[11px] border-b border-slate-200">
                  <tr>
                    {isAdmin && <th className="py-3 px-3 w-10 text-center">Pilih</th>}
                    <th className="py-3 px-4">Waktu & Tiket</th>
                    <th className="py-3 px-4">Sampel & Objek Terdeteksi</th>
                    <th className="py-3 px-4">Material & Kategori</th>
                    <th className="py-3 px-4">Status Verifikasi</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredScans.map((scan) => {
                    const isSelected = selectedScanIds.includes(scan.id);
                    const dotColor =
                      scan.verificationStatus === 'Terverifikasi Petugas'
                        ? 'bg-emerald-500'
                        : scan.verificationStatus === 'Perlu Koreksi'
                        ? 'bg-rose-500'
                        : 'bg-amber-500';
                    const textColor =
                      scan.verificationStatus === 'Terverifikasi Petugas'
                        ? 'text-emerald-700'
                        : scan.verificationStatus === 'Perlu Koreksi'
                        ? 'text-rose-700'
                        : 'text-amber-700';

                    return (
                      <tr
                        key={scan.id}
                        className={`transition-colors ${
                          isSelected ? 'bg-sky-50/50' : 'hover:bg-[#f8fafc]'
                        }`}
                      >
                        {isAdmin && (
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => toggleSelectScan(scan.id)}
                              className="p-1 text-slate-500 hover:text-[#0f2942] cursor-pointer"
                              aria-label={`Pilih ${scan.ticketCode}`}
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-[#0284c7]" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                          </td>
                        )}

                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-mono font-bold text-[#0f2942]">{scan.ticketCode}</div>
                          <div className="text-[11px] font-mono text-slate-500 tabular-nums mt-0.5">
                            {scan.date} · {scan.time} WIB
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={scan.imageUrl}
                              alt={scan.primaryMaterial}
                              className="w-12 h-9 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100"
                              referrerPolicy="no-referrer"
                            />
                            <div className="min-w-0">
                              <div className="font-semibold text-[#0f2942] truncate max-w-[220px]">
                                {scan.detectedObjects[0]?.name || 'Limbah Pesisir'}
                              </div>
                              <div className="text-[11px] text-slate-500 truncate max-w-[220px]">
                                {scan.recommendationCategory}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#0284c7]">{scan.primaryCategory}</div>
                          <div className="text-[11px] text-slate-600 truncate max-w-[200px]">
                            {scan.primaryMaterial}
                          </div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          {isAdmin ? (
                            <div className="relative inline-block">
                              <select
                                value={scan.verificationStatus}
                                onChange={(e) =>
                                  handleUpdateVerification(scan.id, e.target.value as any)
                                }
                                className={`text-[11px] font-semibold pl-2.5 pr-6 py-1 rounded-lg border border-slate-200 bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#38bdf8] cursor-pointer appearance-none ${textColor}`}
                              >
                                <option value="Belum Diverifikasi">Belum Diverifikasi</option>
                                <option value="Terverifikasi Petugas">Terverifikasi Petugas</option>
                                <option value="Perlu Koreksi">Perlu Koreksi</option>
                              </select>
                              <ChevronDown className="w-3 h-3 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                          ) : (
                            <span className={`inline-flex items-center gap-1.5 font-semibold ${textColor}`}>
                              <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                              <span>{scan.verificationStatus}</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setActiveModalScan(scan)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[#0f2942] font-semibold transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#0284c7]" />
                              <span>Detail</span>
                            </button>

                            {isAdmin ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleToggleVerification(scan)}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                                    scan.verificationStatus === 'Terverifikasi Petugas'
                                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  }`}
                                >
                                  {scan.verificationStatus === 'Terverifikasi Petugas' ? (
                                    <>
                                      <RotateCcw className="w-3 h-3" />
                                      <span>Batal</span>
                                    </>
                                  ) : (
                                    <>
                                      <Check className="w-3 h-3" />
                                      <span>Verifikasi</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => promptDeleteSingle(scan)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-semibold transition-colors cursor-pointer"
                                  title="Hapus data scan ini"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </>
                            ) : (
                              scan.verificationStatus !== 'Terverifikasi Petugas' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateVerification(scan.id, 'Terverifikasi Petugas')
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-colors cursor-pointer"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Verifikasi</span>
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-14 text-center text-slate-500 text-xs space-y-2 px-4">
              <AlertCircle className="w-7 h-7 text-slate-300 mx-auto" />
              <p className="font-semibold text-[#0f2942]">
                Tidak ada riwayat pemindaian yang cocok dengan filter.
              </p>
              <p className="text-[11px] text-slate-500">
                Ubah kata kunci pencarian atau sesuaikan filter kategori dan status verifikasi.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Modal Konfirmasi Penghapusan Data (Admin Only) */}
      {deleteConfirm && deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-[70] bg-[#0f2942]/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-5 shadow-xl border border-slate-200">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#0f2942] text-base">
                  Konfirmasi Penghapusan Data
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tindakan ini memerlukan otorisasi Administrator Sistem
                </p>
              </div>
            </div>

            {deleteConfirm.type === 'single' && deleteConfirm.targetScan && (
              <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-slate-200 space-y-2.5">
                <div className="flex items-center gap-3">
                  <img
                    src={deleteConfirm.targetScan.imageUrl}
                    alt="Preview"
                    className="w-14 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                  />
                  <div className="text-xs space-y-0.5 min-w-0">
                    <span className="font-mono font-bold text-[#0f2942] block truncate">
                      {deleteConfirm.targetScan.ticketCode}
                    </span>
                    <span className="text-[11px] text-[#0284c7] font-semibold block truncate">
                      {deleteConfirm.targetScan.primaryCategory}
                    </span>
                    <span className="text-[11px] text-slate-500 block truncate">
                      {deleteConfirm.targetScan.detectedObjects[0]?.name || 'Limbah Pesisir'} ·{' '}
                      {deleteConfirm.targetScan.date}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-slate-700 font-medium pt-1 border-t border-slate-200">
                  Apakah Anda yakin ingin menghapus data scan ini?
                </div>
              </div>
            )}

            {deleteConfirm.type === 'multiple' && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Penghapusan Massal ({deleteConfirm.count} entri)</span>
                </div>
                <p>
                  Apakah Anda yakin ingin menghapus <strong>{deleteConfirm.count} data scan</strong> yang dipilih secara permanen?
                </p>
              </div>
            )}

            {deleteConfirm.type === 'all' && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1.5">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Kosongkan Seluruh Arsip</span>
                </div>
                <p>
                  Apakah Anda yakin ingin menghapus <strong>semua ({deleteConfirm.count}) riwayat pemindaian</strong>? Data yang dihapus tidak dapat dipulihkan.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleExecuteDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail & Koreksi */}
      {activeModalScan && (
        <div className="fixed inset-0 z-[70] bg-[#0f2942]/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 space-y-5 shadow-xl my-8 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-[#0f2942] text-sm">
                    Pemeriksaan Pemindaian #{activeModalScan.ticketCode}
                  </h3>
                  <span className="text-slate-300" aria-hidden="true">·</span>
                  <span className="text-xs font-semibold text-[#0284c7]">
                    {activeModalScan.verificationStatus}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  {activeModalScan.date} {activeModalScan.time} WIB
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalScan(null)}
                className="text-slate-400 hover:text-[#0f2942] p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden aspect-[16/9] bg-slate-100 border border-slate-200">
              <img
                src={activeModalScan.imageUrl}
                alt="Foto Sampah"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <strong className="text-[#0f2942]">Kategori & Objek:</strong>
                <p className="text-slate-600 mt-0.5">
                  {activeModalScan.primaryCategory} ·{' '}
                  {activeModalScan.detectedObjects.map((o) => o.name).join(', ')}
                </p>
              </div>

              <div>
                <strong className="text-[#0f2942]">Perkiraan Material:</strong>
                <p className="text-slate-600 mt-0.5">{activeModalScan.primaryMaterial}</p>
              </div>

              <div>
                <strong className="text-[#0f2942]">Potensi Penguraian:</strong>
                <p className="text-slate-600 mt-0.5">
                  {activeModalScan.biodegradationCategory} — {activeModalScan.biodegradationExplanation}
                </p>
              </div>

              <div>
                <strong className="text-[#0f2942]">Rekomendasi Penanganan:</strong>
                <p className="text-slate-600 mt-0.5">{activeModalScan.handlingRecommendation}</p>
              </div>

              {activeModalScan.verifiedBy && (
                <div className="p-3 rounded-xl bg-[#f8fafc] border border-slate-200 text-[11px] text-slate-600">
                  Diverifikasi oleh:{' '}
                  <strong className="text-[#0f2942]">{activeModalScan.verifiedBy}</strong> (
                  {activeModalScan.verifiedAt})
                  {activeModalScan.notes && (
                    <p className="mt-1 text-slate-500 italic">
                      Catatan: &ldquo;{activeModalScan.notes}&rdquo;
                    </p>
                  )}
                </div>
              )}
            </div>

            {correctionOpen && (
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2.5">
                <label className="text-xs font-semibold text-[#0f2942] block">
                  Catatan Koreksi Material / Klasifikasi
                </label>
                <textarea
                  rows={2}
                  value={correctionNote}
                  onChange={(e) => setCorrectionNote(e.target.value)}
                  placeholder="Tuliskan catatan koreksi untuk jenis material ini..."
                  className="w-full text-xs p-2.5 rounded-xl border border-amber-200 bg-white text-[#0f2942] focus:outline-none focus:ring-2 focus:ring-[#38bdf8] resize-none"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCorrectionOpen(false);
                      setCorrectionNote('');
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white rounded-lg cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!correctionNote.trim()) return;
                      handleUpdateVerification(
                        activeModalScan.id,
                        'Perlu Koreksi',
                        correctionNote.trim()
                      );
                      setCorrectionOpen(false);
                      setCorrectionNote('');
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg cursor-pointer"
                  >
                    Simpan Koreksi
                  </button>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleUpdateVerification(activeModalScan.id, 'Terverifikasi Petugas')
                  }
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                >
                  Setujui / Verifikasi
                </button>

                <button
                  type="button"
                  onClick={() => setCorrectionOpen((prev) => !prev)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-white cursor-pointer"
                >
                  Beri Koreksi
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => promptDeleteSingle(activeModalScan)}
                    className="px-3 py-2 text-xs font-semibold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveModalScan(null);
                  setCorrectionOpen(false);
                  setCorrectionNote('');
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
