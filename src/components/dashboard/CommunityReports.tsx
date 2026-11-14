import React, { useState } from 'react';
import { 
  MapPin, 
  User, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Trash2,
  ChevronDown,
  ShieldCheck,
  Search
} from 'lucide-react';
import { WasteReport, ReportStatus, AuthUser, User as AppUser } from '../../types';
import { iotService } from '../../services/iotService';
import { authService } from '../../services/authService';
import { SpotlightCard } from '../common/SpotlightCard';

interface CommunityReportsProps {
  reports: WasteReport[];
  currentUser?: AuthUser | AppUser | null;
}

export const CommunityReports: React.FC<CommunityReportsProps> = ({
  reports,
  currentUser = null,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModalReport, setActiveModalReport] = useState<WasteReport | null>(null);
  const [reportToDelete, setReportToDelete] = useState<WasteReport | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // RBAC: Check if current user is Administrator
  const isAdmin = currentUser?.role === 'admin' || authService.isAdmin();

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => {
      setFeedbackToast(null);
    }, 3500);
  };

  const filteredReports = reports.filter((r) => {
    const matchesStatus = selectedStatus === 'all' || r.status === selectedStatus;
    const matchesSearch =
      r.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reporterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.wasteType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const handleStatusChange = (reportId: string, newStatus: ReportStatus) => {
    const assignedTeam = isAdmin 
      ? `Disetujui oleh ${currentUser?.name || 'Administrator'}` 
      : 'Tim Reaksi Cepat UPK Badan Air';
    
    iotService.updateReportStatus(reportId, newStatus, assignedTeam);

    if (activeModalReport && activeModalReport.id === reportId) {
      setActiveModalReport({ ...activeModalReport, status: newStatus });
    }

    const report = reports.find((r) => r.id === reportId);
    const code = report ? report.ticketNumber : reportId;
    showToast(`Status laporan #${code} diperbarui ke "${newStatus}"`, 'success');
  };

  const promptDeleteReport = (report: WasteReport) => {
    if (!isAdmin) return;
    setReportToDelete(report);
  };

  const handleConfirmDelete = () => {
    if (!reportToDelete) return;

    const ticket = reportToDelete.ticketNumber;
    iotService.deleteReport(reportToDelete.id);

    if (activeModalReport && activeModalReport.id === reportToDelete.id) {
      setActiveModalReport(null);
    }

    setReportToDelete(null);
    showToast(`Laporan #${ticket} berhasil dihapus dari sistem.`, 'success');
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden box-border space-y-6">
      {/* Toast Feedback */}
      {feedbackToast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200 ${
          feedbackToast.type === 'error'
            ? 'bg-rose-50 text-rose-800 border-rose-200'
            : feedbackToast.type === 'info'
            ? 'bg-blue-50 text-blue-800 border-blue-200'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          {feedbackToast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{feedbackToast.message}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-lg sm:text-xl font-bold text-[#0f2942] tracking-tight">
              Manajemen Laporan Sampah Masyarakat
            </h2>
            {isAdmin ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Mode Admin: Kelola Status & Hapus Aktif</span>
              </span>
            ) : (
              <span className="text-xs font-semibold text-[#0284c7]">
                · Portal Petugas
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Daftar pengaduan titik tumpukan sampah plastik pesisir dari warga untuk ditindaklanjuti
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#f8fafc] px-3 py-2 rounded-xl border border-slate-200 self-start sm:self-auto">
          <span className="text-[11px] text-slate-500">Total Masuk:</span>
          <span className="text-xs font-bold font-mono text-[#0f2942] tabular-nums">
            {reports.length} Laporan
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-200 overflow-x-auto scrollbar-none no-scrollbar">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              selectedStatus === 'all'
                ? 'bg-[#0077B6] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua ({reports.length})
          </button>
          <button
            onClick={() => setSelectedStatus('Menunggu Verifikasi')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              selectedStatus === 'Menunggu Verifikasi'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Menunggu ({reports.filter((r) => r.status === 'Menunggu Verifikasi').length})
          </button>
          <button
            onClick={() => setSelectedStatus('Diproses')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              selectedStatus === 'Diproses'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Diproses ({reports.filter((r) => r.status === 'Diproses').length})
          </button>
          <button
            onClick={() => setSelectedStatus('Selesai')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              selectedStatus === 'Selesai'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Selesai ({reports.filter((r) => r.status === 'Selesai').length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari tiket, lokasi, pelapor, atau jenis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredReports.length > 0 ? (
          filteredReports.map((report) => {
            let statusBadgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
            if (report.status === 'Diproses') {
              statusBadgeClass = 'bg-cyan-50 text-cyan-800 border-cyan-200';
            } else if (report.status === 'Selesai') {
              statusBadgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
            }

            return (
              <SpotlightCard
                key={report.id}
                contentClassName="flex flex-col justify-between"
              >
                <div>
                  {/* Photo Header */}
                  <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={report.photoUrl}
                      alt={report.description}
                      className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover/card:scale-[1.02]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-slate-900/80 text-white backdrop-blur shadow-sm">
                        {report.ticketNumber}
                      </span>
                    </div>

                    {/* Status Badge / Admin Dropdown */}
                    <div className="absolute top-2.5 right-2.5">
                      {isAdmin ? (
                        /* Admin Interactive Status Dropdown */
                        <div className="relative group/status">
                          <select
                            value={report.status}
                            onChange={(e) => handleStatusChange(report.id, e.target.value as ReportStatus)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border focus:outline-none cursor-pointer appearance-none pr-5 backdrop-blur shadow-xs ${statusBadgeClass}`}
                            title="Ubah Status Laporan (Khusus Admin)"
                          >
                            <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                            <option value="Diproses">Diproses</option>
                            <option value="Selesai">Selesai</option>
                          </select>
                          <ChevronDown className="w-2.5 h-2.5 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                        </div>
                      ) : (
                        /* Read-only status tag for non-admin */
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border backdrop-blur shadow-xs ${statusBadgeClass}`}>
                          {report.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    <div>
                      <span className="text-[11px] font-bold text-[#0077B6] block">
                        {report.wasteType}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                        {report.locationName}
                      </h4>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      "{report.description}"
                    </p>

                    <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] text-slate-500">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <User className="w-3 h-3 text-slate-400" />
                          Pelapor: {report.reporterName}
                        </span>
                        <span>{report.date}</span>
                      </div>

                      {report.coordinates && (
                        <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
                          <MapPin className="w-3 h-3 text-[#0077B6]" />
                          <span>GPS: {report.coordinates[0].toFixed(4)}, {report.coordinates[1].toFixed(4)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Bottom Actions */}
                <div className="p-3 bg-[#f8fafc] border-t border-slate-200 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveModalReport(report)}
                    className="px-2.5 py-1.5 text-xs text-slate-700 font-semibold hover:text-[#0284c7] flex items-center gap-1 transition-all duration-200 ease-out active:scale-95 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Detail Foto</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {/* Admin Actions: Quick Status & Delete */}
                    {isAdmin ? (
                      <>
                        {report.status === 'Menunggu Verifikasi' && (
                          <button
                            onClick={() => handleStatusChange(report.id, 'Diproses')}
                            className="px-2.5 py-1 text-[11px] font-bold bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors cursor-pointer shadow-2xs"
                          >
                            Proses
                          </button>
                        )}
                        {report.status === 'Diproses' && (
                          <button
                            onClick={() => handleStatusChange(report.id, 'Selesai')}
                            className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer shadow-2xs"
                          >
                            Selesaikan
                          </button>
                        )}
                        {report.status === 'Selesai' && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold px-2 py-0.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Tuntas
                          </span>
                        )}

                        {/* Tombol Hapus Laporan Khusus Admin */}
                        <button
                          onClick={() => promptDeleteReport(report)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="Hapus laporan dari masyarakat ini"
                        >
                          <Trash2 className="w-3 h-3 text-rose-600" />
                          <span>Hapus</span>
                        </button>
                      </>
                    ) : (
                      /* Petugas Lapangan Standard Actions */
                      <>
                        {report.status === 'Menunggu Verifikasi' && (
                          <button
                            onClick={() => handleStatusChange(report.id, 'Diproses')}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors cursor-pointer shadow-2xs"
                          >
                            Proses Tiket
                          </button>
                        )}
                        {report.status === 'Diproses' && (
                          <button
                            onClick={() => handleStatusChange(report.id, 'Selesai')}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer shadow-2xs"
                          >
                            Tandai Selesai
                          </button>
                        )}
                        {report.status === 'Selesai' && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Tuntas
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </SpotlightCard>
            );
          })
        ) : (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-600">Tidak ada laporan yang sesuai dengan filter.</p>
            <p className="text-[11px] text-slate-400">Silakan sesuaikan status atau gunakan kata kunci lain pada kolom pencarian.</p>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL KONFIRMASI PENGHAPUSAN LAPORAN (KHUSUS ADMIN)          */}
      {/* ============================================================ */}
      {reportToDelete && (
        <div className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Modal Icon & Header */}
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 shadow-xs">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Hapus Laporan Masyarakat
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tindakan ini memerlukan otorisasi Administrator Sistem
                </p>
              </div>
            </div>

            {/* Context Details */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center gap-3">
                <img
                  src={reportToDelete.photoUrl}
                  alt="Preview"
                  className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                />
                <div className="text-xs space-y-0.5 min-w-0">
                  <span className="font-mono font-bold text-slate-900 block truncate">
                    {reportToDelete.ticketNumber}
                  </span>
                  <span className="text-[11px] text-[#0077B6] font-semibold block truncate">
                    {reportToDelete.wasteType}
                  </span>
                  <span className="text-[11px] text-slate-600 block truncate">
                    {reportToDelete.locationName}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    Pelapor: {reportToDelete.reporterName} · {reportToDelete.date}
                  </span>
                </div>
              </div>
              <div className="text-xs text-slate-700 font-medium pt-1.5 border-t border-slate-200/80 leading-relaxed">
                Apakah Anda yakin ingin menghapus laporan dari masyarakat ini?
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              *Catatan: Laporan yang dihapus akan dihilangkan permanen dari daftar tindak lanjut petugas di lapangan.
            </p>

            {/* Modal Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReportToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Laporan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Photo & GPS */}
      {activeModalReport && (
        <div className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl space-y-4 p-6 animate-in fade-in zoom-in-95 my-8 border border-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">
                    Detail Laporan Tiket #{activeModalReport.ticketNumber}
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    activeModalReport.status === 'Selesai'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : activeModalReport.status === 'Diproses'
                      ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {activeModalReport.status}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Tanggal Lapor: {activeModalReport.date}
                </span>
              </div>
              <button
                onClick={() => setActiveModalReport(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden h-60 bg-slate-100 border border-slate-200">
              <img
                src={activeModalReport.photoUrl}
                alt={activeModalReport.description}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-2 text-xs">
              <p><strong>Pelapor:</strong> <span className="text-slate-700">{activeModalReport.reporterName}</span></p>
              <p><strong>Lokasi:</strong> <span className="text-slate-700">{activeModalReport.locationName}</span></p>
              <p><strong>Jenis Sampah:</strong> <span className="text-[#0077B6] font-semibold">{activeModalReport.wasteType}</span></p>
              <p><strong>Keterangan:</strong> <span className="text-slate-700">"{activeModalReport.description}"</span></p>
              {activeModalReport.coordinates && (
                <p><strong>Koordinat GPS:</strong> <span className="font-mono text-slate-700">{activeModalReport.coordinates[0]}, {activeModalReport.coordinates[1]}</span></p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStatusChange(activeModalReport.id, 'Diproses')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                    activeModalReport.status === 'Diproses'
                      ? 'bg-cyan-700 text-white shadow-xs'
                      : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200'
                  }`}
                >
                  Set Diproses
                </button>
                <button
                  onClick={() => handleStatusChange(activeModalReport.id, 'Selesai')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                    activeModalReport.status === 'Selesai'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  Set Selesai
                </button>
                {isAdmin && (
                  <button
                    onClick={() => promptDeleteReport(activeModalReport)}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Hapus</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setActiveModalReport(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
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
