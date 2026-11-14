import React, { useState } from 'react';
import { 
  Camera, 
  MapPin, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Send, 
  Calendar, 
  User, 
  Trash2,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';
import { WasteCategory, WasteReport } from '../../types';
import { iotService } from '../../services/iotService';

interface PublicReportPageProps {
  onBack: () => void;
  onReportSubmitted?: () => void;
  prefillData?: {
    photoUrl?: string;
    wasteType?: WasteCategory;
    description?: string;
  } | null;
}

const WASTE_TYPES: WasteCategory[] = [
  'Botol Plastik PET',
  'Kantong Kresek & Film Plastik',
  'Kemasan Sachet & Kemasan Multi-lapis',
  'Styrofoam / Busa Kemasan',
  'Jaring & Tali Nelayan',
  'Residu & Sampah Campuran',
];

export const PublicReportPage: React.FC<PublicReportPageProps> = ({
  onBack,
  onReportSubmitted,
  prefillData = null,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [reporterName, setReporterName] = useState('');
  const [locationName, setLocationName] = useState('');
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [wasteType, setWasteType] = useState<WasteCategory>(prefillData?.wasteType || 'Botol Plastik PET');
  const [description, setDescription] = useState(prefillData?.description || '');
  const [reportDate, setReportDate] = useState(todayStr);
  const [photoPreview, setPhotoPreview] = useState<string | null>(prefillData?.photoUrl || null);
  const [submittedTicket, setSubmittedTicket] = useState<WasteReport | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default sample photo options if user doesn't have an image file ready
  const samplePhotos = [
    { label: 'Tumpukan Sampah Mangrove', url: new URL('../../assets/images/jaksea_coastal_action_1793092523493.jpg', import.meta.url).href },
    { label: 'Limbah Plastik Muara Pesisir', url: new URL('../../assets/images/jaksea_floating_barrier_1793092523454.jpg', import.meta.url).href },
    { label: 'Jaring & Botol Terapung', url: new URL('../../assets/images/jaksea_sensor_device_1793092524411.jpg', import.meta.url).href },
  ];

  // Geolocation Handler
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Peramban Anda tidak mendukung deteksi lokasi Geolocation.');
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoordinates([pos.coords.latitude, pos.coords.longitude]);
        setGpsLoading(false);
        if (!locationName) {
          setLocationName(`Pesisir Jakarta (Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)})`);
        }
      },
      (err) => {
        setGpsLoading(false);
        setGpsError('Izin akses lokasi ditolak atau tidak tersedia. Anda tetap dapat mengisi nama lokasi secara manual.');
        // Set sample coordinates in Jakarta Bay if blocked in sandbox
        setCoordinates([-6.1085, 106.7725]);
        if (!locationName) {
          setLocationName('Kawasan Pesisir Teluk Jakarta (Koordinat Perkiraan)');
        }
      },
      { timeout: 8000 }
    );
  };

  // Image Upload Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!reporterName.trim()) {
      setValidationError('Mohon isi nama lengkap pelapor.');
      return;
    }
    if (!locationName.trim()) {
      setValidationError('Mohon isi lokasi penemuan sampah.');
      return;
    }
    if (!description.trim()) {
      setValidationError('Mohon isi deskripsi singkat kondisi sampah.');
      return;
    }

    // Fallback photo if none uploaded
    const photoToSave = photoPreview || samplePhotos[0].url;

    setValidationError(null);
    setIsSubmitting(true);
    try {
      const { report: newReport, saved } = await iotService.submitReport({
        reporterName: reporterName.trim(),
        locationName: locationName.trim(),
        coordinates,
        photoUrl: photoToSave,
        wasteType,
        description: description.trim(),
        estimatedVolume: 'Estimasi 2–4 karung',
      });

      if (!saved) {
        setValidationError('Laporan belum terkirim ke server. Periksa koneksi internet lalu coba lagi.');
        return;
      }

      setSubmittedTicket(newReport);
      if (onReportSubmitted) {
        onReportSubmitted();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 box-border overflow-x-hidden">
      {/* Back button */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>
      </div>

      {submittedTicket ? (
        /* Success & Status Card */
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">
              Laporan Sampah Berhasil Dikirim!
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Terima kasih atas kepedulian Anda terhadap kebersihan pesisir Teluk Jakarta.
            </p>
          </div>

          {/* Ticket Information */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                  Nomor Tiket Pengaduan
                </span>
                <span className="text-lg font-bold font-mono text-[#0077B6]">
                  {submittedTicket.ticketNumber}
                </span>
              </div>
              <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                {submittedTicket.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Nama Pelapor:</span>
                <span className="font-semibold text-slate-800">{submittedTicket.reporterName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Jenis Sampah:</span>
                <span className="font-semibold text-slate-800">{submittedTicket.wasteType}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Lokasi:</span>
                <span className="font-semibold text-slate-800">{submittedTicket.locationName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Tanggal Laporan:</span>
                <span className="font-semibold text-slate-800">{submittedTicket.date}</span>
              </div>
            </div>

            {submittedTicket.coordinates && (
              <div className="text-xs text-slate-500 pt-1">
                <span>Koordinat GPS: </span>
                <span className="font-mono text-slate-700">
                  {submittedTicket.coordinates[0].toFixed(5)}, {submittedTicket.coordinates[1].toFixed(5)}
                </span>
              </div>
            )}
          </div>

          {/* Demonstration Notice */}
          <div className="p-3.5 bg-cyan-50 border border-cyan-200 rounded-xl text-xs text-slate-700 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#0077B6] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Catatan Versi Demo:</strong> Laporan Anda disimpan secara lokal sementara pada peramban ini dan telah diteruskan ke daftar antrean petugas di dashboard. Pengiriman ke database online cloud terpusat belum aktif pada versi awal prototipe.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={() => {
                setSubmittedTicket(null);
                setReporterName('');
                setLocationName('');
                setDescription('');
                setPhotoPreview(null);
                setCoordinates(null);
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-xs font-semibold bg-[#0077B6] hover:bg-[#023E8A] text-white transition-colors"
            >
              Kirim Laporan Lainnya
            </button>
            <button
              onClick={onBack}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      ) : (
        /* Report Form */
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0077B6]">
              Partisipasi Masyarakat Pesisir
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Formulir Laporan Sampah Plastik Terapung
            </h1>
            <p className="text-xs text-slate-500">
              Laporkan titik tumpukan sampah plastik di muara sungai atau perairan pesisir Jakarta agar dapat segera ditangani tim SEABRIS.
            </p>
          </div>

          {validationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            {/* Nama Pelapor */}
            <div className="space-y-1.5">
              <label htmlFor="name-input" className="font-semibold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Nama Lengkap Pelapor *</span>
              </label>
              <input
                id="name-input"
                type="text"
                placeholder="Contoh: Hendra Wijaya / Komunitas Nelayan Pluit"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
              />
            </div>

            {/* Lokasi & GPS */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="loc-input" className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#0077B6]" />
                  <span>Lokasi Penemuan Sampah *</span>
                </label>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={gpsLoading}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0077B6] hover:underline"
                >
                  <MapPin className="w-3 h-3" />
                  <span>{gpsLoading ? 'Mendeteksi...' : 'Dapatkan Lokasi GPS Saya'}</span>
                </button>
              </div>

              <input
                id="loc-input"
                type="text"
                placeholder="Contoh: Muara Karang dekat jembatan apung / Kali Adem"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
              />

              {coordinates && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800 flex items-center gap-1.5 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Koordinat Terdeteksi: {coordinates[0].toFixed(5)}, {coordinates[1].toFixed(5)}</span>
                </div>
              )}

              {gpsError && (
                <p className="text-[11px] text-amber-700">{gpsError}</p>
              )}
            </div>

            {/* Jenis Sampah & Tanggal Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="waste-type" className="font-semibold text-slate-700">Jenis Sampah Dominan *</label>
                <select
                  id="waste-type"
                  value={wasteType}
                  onChange={(e) => setWasteType(e.target.value as WasteCategory)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                >
                  {WASTE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="report-date" className="font-semibold text-slate-700">Tanggal Pelaporan *</label>
                <input
                  id="report-date"
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                  required
                />
              </div>
            </div>

            {/* Foto Sampah (Upload & Pratinjau) */}
            <div className="space-y-2">
              <label className="font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-slate-400" />
                  <span>Foto Sampah (Pratinjau Sebelum Kirim)</span>
                </span>
                <span className="text-[11px] text-slate-400">Unggah file atau pilih contoh</span>
              </label>

              {/* Photo Preview Container */}
              {photoPreview ? (
                <div className="relative rounded-2xl overflow-hidden h-48 bg-slate-100 border border-slate-200">
                  <img
                    src={photoPreview}
                    alt="Pratinjau foto sampah"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setPhotoPreview(null)}
                    className="absolute top-2 right-2 px-2 py-1 rounded bg-slate-900/80 text-white text-[10px] font-semibold hover:bg-red-600 transition-colors"
                  >
                    Ganti Foto
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-5 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3">
                  <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                  <div>
                    <label className="inline-flex px-3.5 py-1.5 rounded-lg bg-[#0077B6] hover:bg-[#023E8A] text-white font-semibold text-xs cursor-pointer shadow-sm transition-colors">
                      <span>Pilih Foto dari Galeri / Kamera</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Format JPG, PNG, atau WebP (Maks. 5 MB)
                    </p>
                  </div>

                  {/* Sample selection for demo */}
                  <div className="pt-2 border-t border-slate-200 text-left">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                      Atau pilih foto contoh demo:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {samplePhotos.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPhotoPreview(item.url)}
                          className="px-2 py-1 text-[10px] font-medium rounded-md bg-white border border-slate-200 hover:border-cyan-400 text-slate-700"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Deskripsi Laporan */}
            <div className="space-y-1.5">
              <label htmlFor="desc-input" className="font-semibold text-slate-700">
                Deskripsi Tambahan / Kronologi Temuan *
              </label>
              <textarea
                id="desc-input"
                rows={3}
                placeholder="Jelaskan kondisi tumpukan sampah, potensi penyumbatan, atau arah arus air..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
              ></textarea>
            </div>

            {/* Disclaimer of demo storage */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500">
              <p>
                <strong>Catatan Demonstrasi:</strong> Data laporan Anda disimpan secara lokal sementara pada peramban untuk keperluan demonstrasi prototipe. Pengiriman ke database online cloud terpusat belum aktif pada versi awal.
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-[#0077B6] hover:bg-[#023E8A] text-white font-bold text-xs shadow-md hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Mengirim laporan...' : 'Kirim Laporan Sampah Pesisir'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};