import React, { useState, useEffect, useMemo } from 'react';
import { 
  Waves, 
  Compass, 
  Wind, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Download, 
  Play, 
  Pause, 
  Radio, 
  ChevronRight, 
  ShieldCheck, 
  Calendar,
  Info,
  Navigation
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend,
  Area,
  AreaChart,
  ReferenceLine
} from 'recharts';
import { 
  oceanographyService, 
  getCardinalDirection, 
  getShortCardinalDirection,
  fetchMonthlyRecords,
  formatMonth,
  MonthlyOceanRecord
} from '../../services/oceanographyService';
import { AuthUser, User, TideRecord, OceanCurrentRecord } from '../../types';

export interface MuaraAngkeOceanographyDashboardProps {
  onNavigateToDevice?: () => void;
  onNavigateToMap?: () => void;
  isPublicView?: boolean;
  currentUser?: AuthUser | User | null;
  onOpenLogin?: () => void;
}

export interface LiveTelemetryPoint {
  time: string;
  timestamp: number;
  waterLevel: number;
  currentSpeed: number;
  directionDeg: number;
  status: string;
}

export const MuaraAngkeOceanographyDashboard: React.FC<MuaraAngkeOceanographyDashboardProps> = ({
  onNavigateToDevice,
  onNavigateToMap,
  isPublicView = false,
  currentUser = null,
  onOpenLogin,
}) => {
  const stationInfo = oceanographyService.getStationInfo();

  // Active chart parameter toggle: 'tides' (Pasang Surut) | 'currents' (Kecepatan Arus) | 'waves' (Tinggi Gelombang) | 'both' (Gabungan)
  const [activeParameterTab, setActiveParameterTab] = useState<'tides' | 'currents' | 'waves' | 'both'>('tides');

  // Data bulanan dari backend (GET /api/oceanography/muara-angke/monthly)
  const [monthly, setMonthly] = useState<MonthlyOceanRecord[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetchMonthlyRecords()
      .then(setMonthly)
      .catch((err) => {
        console.error(err);
        setLoadError('Gagal memuat data dari server. Pastikan server berjalan.');
      });
  }, []);

  const WAVE_WARN = 1.25; // batas waspada Hs (m), sesuaikan sendiri

  const monthlyPoints = useMemo<LiveTelemetryPoint[]>(
    () =>
      monthly.map((r) => ({
        time: formatMonth(r.timestamp),
        timestamp: new Date(`${r.timestamp}-01`).getTime(),
        waterLevel: r.mean_sea_level,
        currentSpeed: r.current_speed,
        directionDeg: r.current_direction,
        status: '',
      })),
    [monthly]
  );

  const waveChartData = useMemo(
    () =>
      monthly.map((r) => ({
        bulan_tahun: formatMonth(r.timestamp),
        tinggi_gelombang_m: r.significant_wave_height,
        status_gelombang: r.significant_wave_height >= WAVE_WARN ? 'Waspada Sedang' : 'Tenang / Aman',
      })),
    [monthly]
  );

  const waveStats = useMemo(() => {
    if (monthly.length === 0) return { latest: 0, avg: 0, max: 0, maxLabel: '-' };
    const latest = monthly[monthly.length - 1].significant_wave_height;
    const avg = monthly.reduce((sum, r) => sum + r.significant_wave_height, 0) / monthly.length;
    const top = monthly.reduce((m, r) => (r.significant_wave_height > m.significant_wave_height ? r : m), monthly[0]);
    return { latest, avg, max: top.significant_wave_height, maxLabel: formatMonth(top.timestamp) };
  }, [monthly]);

  // Bulan terbaru dari JSON (menggantikan nilai "terkini" simulasi)
  const latestLive: LiveTelemetryPoint = monthlyPoints[monthlyPoints.length - 1] || {
    time: '-',
    timestamp: 0,
    waterLevel: 0,
    currentSpeed: 0,
    directionDeg: 0,
    status: '',
  };
  const activeChartData: LiveTelemetryPoint[] = monthlyPoints;

  // Perubahan terhadap bulan sebelumnya
  const previousPoint = monthlyPoints[monthlyPoints.length - 2];
  const isRising = previousPoint ? latestLive.waterLevel >= previousPoint.waterLevel : true;
  const deltaFromPrev = previousPoint ? Number((latestLive.waterLevel - previousPoint.waterLevel).toFixed(2)) : 0;

  const exportMonthlyCsv = () => {
    const headers = ['Periode', 'MSL (m)', 'Kecepatan Arus (m/s)', 'Arah Arus (deg)', 'Hs (m)', 'Periode Puncak (s)'];
    const rows = monthly.map((r) => [r.timestamp, r.mean_sea_level, r.current_speed, r.current_direction, r.significant_wave_height, r.peak_period]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'seabris-oseanografi-bulanan-muara-angke.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden box-border space-y-6 animate-in fade-in duration-200">
      {/* Top Section: Title & LIVE TELEMETRY ACTIVE Blinking Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/80 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0077B6]"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0077B6]">
              Stasiun Pantau STA-MA-01 · Muara Angke
            </span>
            {currentUser && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <ShieldCheck className="w-3 h-3 text-indigo-600" />
                {currentUser.role === 'admin' ? 'Administrator' : 'Petugas Lapangan'}
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Monitoring Oseanografi & Arus Laut Muara Angke
          </h2>
          <p className="text-xs text-slate-500">
            Dinamika hidrodinamika pesisir Teluk Jakarta untuk efektivitas penampung sampah SEABRIS
          </p>
        </div>

        {/* POJOK KANAN ATAS: INDIKATOR DATA BULANAN */}
        <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-cyan-50 border border-cyan-200 text-[#0077B6] shadow-sm">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-xs font-extrabold uppercase tracking-wider font-mono">
              DATA BULANAN · JAN 2025 – NOV 2026
            </span>
          </div>
        </div>
      </div>

      {/* 2. KARTU METRIK UTAMA (3 KOLOM BERDAMPINGAN: PASUT, ARUS, & GELOMBANG CMEMS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* CARD 1: PASANG SURUT TERKINI */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <span className="font-semibold text-slate-700 uppercase tracking-wide">
                  Muka Air Laut Rata-rata
                </span>
                <span className="text-slate-300">·</span>
                <span className="font-mono text-slate-400 text-[11px]">MSL Bulanan</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono text-[#0077B6] tracking-tight tabular-nums">
                  {latestLive.waterLevel.toFixed(2)}
                </span>
                <span className="text-base font-bold text-slate-500">meter (m)</span>
              </div>
            </div>

            <div className="w-11 h-11 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-[#0077B6] shrink-0 shadow-xs">
              <Waves className="w-5 h-5" />
            </div>
          </div>

          {/* Status & Trend Badges */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isRising 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {isRising ? <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> : <TrendingDown className="w-3.5 h-3.5 text-amber-600" />}
                <span>{isRising ? 'Naik dari bulan lalu' : 'Turun dari bulan lalu'}</span>
              </span>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono text-slate-600 bg-slate-50 border border-slate-100">
                <span>Selisih bln lalu:</span>
                <strong className={deltaFromPrev >= 0 ? 'text-[#0077B6]' : 'text-amber-700'}>
                  {deltaFromPrev >= 0 ? `+${deltaFromPrev}` : deltaFromPrev} m
                </strong>
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
              <span className="flex items-center gap-1.5 font-mono text-[11px]">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Rata-rata bulan {latestLive.time}</span>
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                Data bulanan
              </span>
            </div>
          </div>
        </div>

        {/* CARD 2: KECEPATAN & ARAH ARUS */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <span className="font-semibold text-slate-700 uppercase tracking-wide">
                  Kecepatan & Arah Arus Bulanan
                </span>
                <span className="text-slate-300">·</span>
                <span className="font-mono text-slate-400 text-[11px]">Vektor Hidrodinamika</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono text-cyan-800 tracking-tight tabular-nums">
                  {latestLive.currentSpeed.toFixed(2)}
                </span>
                <span className="text-base font-bold text-slate-500">m/s</span>
                <span className="text-[11px] font-mono text-slate-400 ml-1">
                  (~{(latestLive.currentSpeed * 1.94384).toFixed(1)} knot)
                </span>
              </div>
            </div>

            {/* Mini Compass Vector Visual */}
            <div
              className="w-11 h-11 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-[#0077B6] shrink-0 shadow-xs"
              title={`Rotasi Vektor Arus: ${latestLive.directionDeg}°`}
            >
              <Navigation
                className="w-5 h-5 transition-transform duration-500 ease-out"
                style={{ transform: `rotate(${latestLive.directionDeg - 45}deg)` }}
              />
            </div>
          </div> 

          {/* Direction & Status Details */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-900 border border-cyan-100">
                <Compass className="w-3.5 h-3.5 text-[#0077B6]" />
                <span>{getCardinalDirection(latestLive.directionDeg)}</span>
              </span>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-slate-50 text-slate-800 border border-slate-100">
                <span>{latestLive.directionDeg}°</span>
              </span>

              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700">
                {latestLive.currentSpeed > 0.30 ? 'Arus Kuat' : latestLive.currentSpeed > 0.20 ? 'Arus Sedang' : 'Arus Tenang'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
              <span className="text-[11px] text-slate-600 truncate max-w-[190px]">
                {latestLive.directionDeg >= 120 && latestLive.directionDeg <= 210
                  ? 'Arus dorong sampah ke SEABRIS'
                  : 'Arus lepas ke teluk'}
              </span>
              <span className="font-mono text-[10px] text-slate-400">
                Rata-rata bulanan
              </span>
            </div>
          </div>
        </div>

        {/* CARD 3: TINGGI GELOMBANG SIGNIFIKAN */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <span className="font-semibold text-slate-700 uppercase tracking-wide">
                  Tinggi Gelombang (Hs)
                </span>
                <span className="text-slate-300">·</span>
                <span className="font-mono text-slate-400 text-[11px]">Bulanan</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono text-[#0077B6] tracking-tight tabular-nums">
                  {waveStats.latest.toFixed(2)}
                </span>
                <span className="text-base font-bold text-slate-500">meter (m)</span>
              </div>
            </div>

            <div className="w-11 h-11 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-[#0077B6] shrink-0 shadow-xs">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          {/* Status & Wave Details */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{waveStats.latest >= WAVE_WARN ? 'Waspada Sedang' : 'Tenang / Aman'}</span>
              </span>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono text-slate-600 bg-slate-50 border border-slate-100">
                <span>Rata-rata:</span>
                <strong className="text-[#0077B6] font-semibold">{waveStats.avg.toFixed(2)} m</strong>
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
              <span className="text-[11px] text-slate-600">
                Puncak ({waveStats.maxLabel}): <strong className="text-amber-700 font-mono">{waveStats.max.toFixed(2)} m</strong>
              </span>
              <button
                type="button"
                onClick={() => setActiveParameterTab('waves')}
                className="text-[#0077B6] hover:text-[#023E8A] font-semibold text-[11px] flex items-center gap-0.5 transition-colors cursor-pointer"
              >
                <span>Lihat Tren</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. GRAFIK UTAMA TIME-SERIES (RECHARTS - MEMENUHI AREA BAWAH KARTU METRIK) */}
      <section className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-100 shadow-xs space-y-5">
        {/* Navigation & Controls Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#0077B6]" />
              <span>Grafik Deret Waktu Oseanografi (Time-Series)</span>
            </h3>
            <p className="text-xs text-slate-500">
             Rata-rata bulanan Jan 2025 – Nov 2026
            </p>
            <div className="mt-1.5 space-y-0.5 text-[11px] text-slate-500 leading-relaxed">
  <p>
    <strong className="text-slate-700">Pasang Surut (MSL):</strong> Badan Informasi Geospasial (BIG).
  </p>
  <p>
    <strong className="text-slate-700">Arus Laut:</strong> Data reanalisis CMEMS dan BMKG.
  </p>
  <p>
    <strong className="text-slate-700">Gelombang:</strong> BMKG Stasiun Meteorologi Maritim.
  </p>
</div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-cyan-50/80 border border-cyan-200/80 rounded-xl px-3 py-1.5 text-xs text-[#0077B6] font-semibold">
              <Calendar className="w-3.5 h-3.5 text-[#0077B6]" />
              <span>{monthly.length} bulan (Jan 2025 – Nov 2026)</span>
            </div>

            {/* Parameter Tab Selector: Pasang Surut | Kecepatan Arus | Gelombang Hs (CMEMS) | Dual-Axis */}
            <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveParameterTab('tides')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeParameterTab === 'tides'
                    ? 'bg-[#0077B6] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Waves className="w-3.5 h-3.5" />
                <span>Pasang Surut (m)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveParameterTab('currents')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeParameterTab === 'currents'
                    ? 'bg-[#0077B6] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Wind className="w-3.5 h-3.5" />
                <span>Kecepatan Arus (m/s)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveParameterTab('waves')}
                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeParameterTab === 'waves'
                    ? 'bg-[#0077B6] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Tinggi Gelombang (Hs)</span>
                </button>
            </div>
          </div>
        </div>

        {/* EXPANDED RECHARTS CHART CONTAINER (AREA LUAS & BERSIH) */}
        <div className="w-full h-[360px] sm:h-[400px] bg-gradient-to-b from-slate-50/60 to-white p-3 sm:p-5 rounded-2xl border border-slate-200 shadow-inner">
          <ResponsiveContainer width="100%" height="100%">
            {activeParameterTab === 'tides' ? (
              /* TAB 1: GRAFIK PASANG SURUT (m) - WARNA BIRU LAUT #0077B6 DENGAN GRADIENT */
              <AreaChart data={activeChartData} margin={{ top: 15, right: 25, left: -5, bottom: 5 }}>
                <defs>
                  <linearGradient id="tideAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0077B6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0077B6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 10, fill: '#64748B', fontFamily: 'Poppins, sans-serif' }} 
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={['dataMin - 0.05', 'dataMax + 0.05']} 
                  tick={{ fontSize: 10, fill: '#0077B6', fontFamily: 'Poppins, sans-serif' }}
                  unit="m"
                  width={46}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0]?.payload;
                      return (
                        <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-slate-200 text-xs space-y-1.5 font-sans min-w-[210px]">
                          <div className="font-mono font-bold text-slate-800 text-[11px] pb-1 border-b border-slate-100 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-[#0077B6]" />
                              <span>Periode: {label}</span>
                            </span>
                          </div>
                          <div className="text-[#0077B6] font-medium flex items-center justify-between gap-4 font-mono text-sm">
                            <span>Tinggi Pasut:</span>
                            <strong>{payload[0]?.value} m</strong>
                          </div>
                          <div className="text-[11px] text-slate-500 pt-0.5">
                            Rata-rata bulanan (MSL)
                          </div>
                          <div className="text-[10px] text-cyan-800 bg-cyan-50 p-1.5 rounded-lg border border-cyan-100">
                            Muka air laut rata-rata pada periode ini
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="waterLevel" 
                  name="Tinggi Muka Air Laut (m)" 
                  stroke="#0077B6" 
                  strokeWidth={3}
                  fill="url(#tideAreaGradient)"
                  dot={{ r: 3, fill: '#0077B6' }}
                  activeDot={{ r: 6, fill: '#023E8A' }}
                  isAnimationActive={true}
                />
              </AreaChart>
            ) : activeParameterTab === 'currents' ? (
              /* TAB 2: GRAFIK KECEPATAN ARUS (m/s) - WARNA CYAN TEAL #0891B2 */
              <AreaChart data={activeChartData} margin={{ top: 15, right: 25, left: -5, bottom: 5 }}>
                <defs>
                  <linearGradient id="currentAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0891B2" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0891B2" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 10, fill: '#64748B', fontFamily: 'Poppins, sans-serif' }} 
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={['dataMin - 0.05', 'dataMax + 0.05']} 
                  tick={{ fontSize: 10, fill: '#0891B2', fontFamily: 'Poppins, sans-serif' }}
                  unit="m/s"
                  width={52}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0]?.payload;
                      return (
                        <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-slate-200 text-xs space-y-1.5 font-sans min-w-[210px]">
                          <div className="font-mono font-bold text-slate-800 text-[11px] pb-1 border-b border-slate-100 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-cyan-600" />
                              <span>Periode: {label}</span>
                            </span>
                          </div>
                          <div className="text-cyan-800 font-medium flex items-center justify-between gap-4 font-mono text-sm">
                            <span>Kecepatan Arus:</span>
                            <strong>{payload[0]?.value} m/s</strong>
                          </div>
                          <div className="text-[11px] text-slate-600">
                            Arah: <strong className="text-slate-800">{data?.directionDeg || 165}° ({getShortCardinalDirection(data?.directionDeg || 165)})</strong>
                          </div>
                          <div className="text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                            Kecepatan ~{(Number(payload[0]?.value) * 1.944).toFixed(1)} knot
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="currentSpeed" 
                  name="Kecepatan Arus Laut (m/s)" 
                  stroke="#0891B2" 
                  strokeWidth={3}
                  fill="url(#currentAreaGradient)"
                  dot={{ r: 3, fill: '#0891B2' }}
                  activeDot={{ r: 6, fill: '#0e7490' }}
                  isAnimationActive={true}
                />
              </AreaChart>
            ) : activeParameterTab === 'waves' ? (
              /* TAB 3: GRAFIK TINGGI GELOMBANG SIGNIFIKAN (Hs) */
              <AreaChart data={waveChartData} margin={{ top: 15, right: 25, left: -5, bottom: 5 }}>
                <defs>
                  <linearGradient id="waveAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0891B2" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#0891B2" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis 
                  dataKey="bulan_tahun" 
                  tick={{ fontSize: 10, fill: '#64748B', fontFamily: 'Poppins, sans-serif' }} 
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={[0, 'auto']} 
                  tick={{ fontSize: 10, fill: '#0891B2', fontFamily: 'Poppins, sans-serif' }}
                  unit=" m"
                  width={48}
                />
                <ReferenceLine 
                  y={WAVE_WARN} 
                  stroke="#F59E0B" 
                  strokeDasharray="4 4" 
                  strokeWidth={1.5}
                  label={{ 
                    value: 'Batas Waspada Sedang (1.25m)', 
                    fill: '#D97706', 
                    fontSize: 10, 
                    position: 'insideTopRight' 
                  }} 
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0]?.payload;
                      const isWarning = Number(payload[0]?.value) >= WAVE_WARN;
                      return (
                        <div className="bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-slate-800 text-xs space-y-1.5 font-sans min-w-[230px] text-white">
                          <div className="font-mono font-bold text-slate-200 text-[11px] pb-1 border-b border-slate-800 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Periode: {label}</span>
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                              isWarning 
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            }`}>
                              {data?.status_gelombang || 'Aman'}
                            </span>
                          </div>
                          <div className="text-cyan-400 font-medium flex items-center justify-between gap-4 font-mono text-sm">
                            <span>Tinggi Gelombang (Hs):</span>
                            <strong className="text-white text-base">{payload[0]?.value} m</strong>
                          </div>
                          <div className="text-[10px] text-slate-300 bg-slate-800/80 p-2 rounded-lg border border-slate-700/80 leading-relaxed">
                            {isWarning 
                              ? 'Periode Musim Barat (Des–Feb): Waspada beban hidrodinamika terhadap floating barrier SEABRIS.'
                              : 'Kondisi perairan tenang: Dinamika gelombang rendah, penangkapan sampah optimal.'}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="tinggi_gelombang_m" 
                  name="Tinggi Gelombang Signifikan (Hs)" 
                  stroke="#0891B2" 
                  strokeWidth={3}
                  fill="url(#waveAreaGradient)"
                  dot={{ r: 3, fill: '#0891B2' }}
                  activeDot={{ r: 6, fill: '#0077B6' }}
                  isAnimationActive={true}
                />
              </AreaChart>
            ) : (
              /* TAB 4: DUAL-AXIS (KEDUANYA BERSAMAAN) */
              <LineChart data={activeChartData} margin={{ top: 15, right: 25, left: -5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 10, fill: '#64748B', fontFamily: 'Poppins, sans-serif' }} 
                  interval="preserveStartEnd"
                />
                <YAxis 
                  yAxisId="left" 
                  domain={['dataMin - 0.05', 'dataMax + 0.05']} 
                  tick={{ fontSize: 10, fill: '#0077B6', fontFamily: 'Poppins, sans-serif' }}
                  unit="m"
                  width={46}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  domain={['dataMin - 0.05', 'dataMax + 0.05']} 
                  tick={{ fontSize: 10, fill: '#0891B2', fontFamily: 'Poppins, sans-serif' }}
                  unit="m/s"
                  width={52}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-slate-200 text-xs space-y-1.5 font-sans min-w-[210px]">
                          <div className="font-mono font-bold text-slate-800 text-[11px] pb-1 border-b border-slate-100 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-[#0077B6]" />
                              <span>Periode: {label}</span>
                            </span>
                          </div>
                          <div className="text-[#0077B6] font-medium flex items-center justify-between gap-4 font-mono">
                            <span>Tinggi Pasut:</span>
                            <strong>{payload[0]?.value} m</strong>
                          </div>
                          <div className="text-cyan-800 font-medium flex items-center justify-between gap-4 font-mono">
                            <span>Kecepatan Arus:</span>
                            <strong>{payload[1]?.value} m/s</strong>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  formatter={(value) => <span className="font-bold text-slate-700">{value}</span>}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="waterLevel" 
                  name="Tinggi Muka Air (m)" 
                  stroke="#0077B6" 
                  strokeWidth={2.5}
                  dot={{ r: 2.5, fill: '#0077B6' }}
                  activeDot={{ r: 5, fill: '#023E8A' }}
                  isAnimationActive={false}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="currentSpeed" 
                  name="Kecepatan Arus (m/s)" 
                  stroke="#0891B2" 
                  strokeWidth={2.5}
                  dot={{ r: 2.5, fill: '#0891B2' }}
                  activeDot={{ r: 5, fill: '#0e7490' }}
                  isAnimationActive={false}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Informative Footer Bar below chart */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-500 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0077B6]"></span>
            <span>
              {activeParameterTab === 'waves' ? (
                <>
                  Tinggi Gelombang Signifikan (Hs) <strong className="text-cyan-800">#0891B2</strong> · Sumber: data simulasi bulanan 2025–2026
                </>
              ) : (
                <>
                  Warna Biru Laut <strong className="text-slate-800">#0077B6</strong> (Pasang Surut) & <strong className="text-cyan-800">#0891B2</strong> (Kecepatan Arus)
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {!isPublicView && (
              <button
                type="button"
                onClick={exportMonthlyCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors font-medium cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#0077B6]" />
                <span>Unduh CSV Bulanan</span>
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export const OceanographyView = MuaraAngkeOceanographyDashboard;
export default MuaraAngkeOceanographyDashboard;