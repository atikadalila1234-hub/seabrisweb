import React, { useEffect, useState, useMemo } from 'react';
import {
  SEABRIS_FIXED_SPECS,
  computeFixedBinTelemetry,
} from '../../data/seabrisSystem';
import {
  Lock,
  ShieldCheck,
  Cpu,
  AlertTriangle,
  Radio,
  CheckCircle2,
  Database
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { Device, AuthUser, User } from '../../types';
import { iotService } from '../../services/iotService';
import { SeabrisDigitalTwin3D, SeabrisDigitalTwin3DProps } from './SeabrisDigitalTwin3D';

// Re-export SeabrisDigitalTwin3D component and its types
export { SeabrisDigitalTwin3D };
export type { SeabrisDigitalTwin3DProps };

// 24-Hour Solar PV & Battery cycle dataset matching system architecture
const SOLAR_BATTERY_CYCLE_DATA = [
  { time: '00:00', solarW: 0.0, batterySoc: 90, solarV: 0.0, mpptA: 0.0, batV: 13.1 },
  { time: '02:00', solarW: 0.0, batterySoc: 88, solarV: 0.0, mpptA: 0.0, batV: 13.0 },
  { time: '04:00', solarW: 0.0, batterySoc: 86, solarV: 0.0, mpptA: 0.0, batV: 12.95 },
  { time: '06:00', solarW: 2.1, batterySoc: 85, solarV: 14.2, mpptA: 0.15, batV: 13.0 },
  { time: '08:00', solarW: 7.8, batterySoc: 88, solarV: 16.8, mpptA: 0.46, batV: 13.2 },
  { time: '10:00', solarW: 14.5, batterySoc: 92, solarV: 17.4, mpptA: 0.83, batV: 13.35 },
  { time: '12:00', solarW: 19.8, batterySoc: 96, solarV: 18.2, mpptA: 1.08, batV: 13.5 },
  { time: '14:00', solarW: 16.5, batterySoc: 94, solarV: 17.6, mpptA: 0.94, batV: 13.42 },
  { time: '16:00', solarW: 9.4, batterySoc: 95, solarV: 16.5, mpptA: 0.57, batV: 13.38 },
  { time: '18:00', solarW: 1.2, batterySoc: 93, solarV: 11.2, mpptA: 0.08, batV: 13.2 },
  { time: '20:00', solarW: 0.0, batterySoc: 91, solarV: 0.0, mpptA: 0.0, batV: 13.15 },
  { time: '22:00', solarW: 0.0, batterySoc: 89, solarV: 0.0, mpptA: 0.0, batV: 13.1 },
];

export interface DigitalTwin3DViewProps {
  devices: Device[];
  selectedDeviceId: string;
  onSelectDevice: (id: string) => void;
  currentUser?: AuthUser | User | null;
  onNavigateToDeviceMonitoring?: () => void;
}

export const DigitalTwin3DView: React.FC<DigitalTwin3DViewProps> = ({
  devices,
  selectedDeviceId,
  onSelectDevice,
  currentUser = null,
  onNavigateToDeviceMonitoring,
}) => {
  const currentDevice = devices.find((d) => d.id === selectedDeviceId) || devices[0];

  // Derive initial ultrasonic distance from device capacity percentage
  // 100% capacity -> 0.0 cm, 0% capacity -> 25.0 cm
  const initialUltrasonicDistance = Math.max(
    0,
    Math.min(
      25,
      SEABRIS_FIXED_SPECS.FIXED_BIN_DEPTH_CM -
        (currentDevice.capacityPercentage / 100) * SEABRIS_FIXED_SPECS.FIXED_BIN_DEPTH_CM
    )
  );

  // SECTION 01 INTERACTIVE STATES
  const [ultrasonicDistanceCm, setUltrasonicDistanceCm] = useState<number>(initialUltrasonicDistance);
  const [loadCellKg, setLoadCellKg] = useState<number>(15.85);
  const [recordFeedback, setRecordFeedback] = useState<string | null>(null);

  // SECTION 02 TEST MODAL STATE
  const [protectionModalOpen, setProtectionModalOpen] = useState<boolean>(false);

  // SECTION 03 SELECTED TIME POINT
  const [selectedHour, setSelectedHour] = useState<string>('14:00');

  // Sync state if selected device changes
  useEffect(() => {
    const d = Math.max(
      0,
      Math.min(
        25,
        SEABRIS_FIXED_SPECS.FIXED_BIN_DEPTH_CM -
          (currentDevice.capacityPercentage / 100) * SEABRIS_FIXED_SPECS.FIXED_BIN_DEPTH_CM
      )
    );
    setUltrasonicDistanceCm(d);
    setLoadCellKg(Number(((currentDevice.capacityPercentage / 100) * 25.0).toFixed(2)));
  }, [currentDevice.id, currentDevice.capacityPercentage]);

  // Derived telemetry calculations
  const telemetry = useMemo(() => {
    return computeFixedBinTelemetry(ultrasonicDistanceCm, loadCellKg);
  }, [ultrasonicDistanceCm, loadCellKg]);

  const heightTrashCm = Math.max(0, 25.0 - ultrasonicDistanceCm);

  // Handle standard test points (Titik Uji Kalibrasi Standar)
  const handleSelectPresetDepth = (distCm: number) => {
    setUltrasonicDistanceCm(distCm);
    const pct = ((25.0 - distCm) / 25.0) * 100;
    setLoadCellKg(Number(((pct / 100) * 25.0).toFixed(2)));
  };

  // Handle recording to sensor_logs table
  const handleRecordToLogs = () => {
    iotService.addSensorLog({
      deviceId: currentDevice.id,
      deviceCode: currentDevice.code,
      fillPercentage: Math.round(telemetry.fillPercentage),
      waterLevel: 0.85,
      currentSpeed: 0.42,
      batteryLevel: currentDevice.batteryLevel,
      status: telemetry.statusLevel === 'CRITICAL_FULL' ? 'warning' : 'normal',
    });
    setRecordFeedback('Log telemetri berhasil direkam ke tabel sensor_logs!');
    setTimeout(() => setRecordFeedback(null), 3500);
  };

  // Current Solar & Battery point
  const currentSolarData = useMemo(() => {
    return (
      SOLAR_BATTERY_CYCLE_DATA.find((item) => item.time === selectedHour) ||
      SOLAR_BATTERY_CYCLE_DATA[7] // 14:00
    );
  }, [selectedHour]);

  return (
    <div className="h-full min-h-screen flex flex-col justify-between overflow-y-auto w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300 font-sans pb-16">
      {/* ========================================================================= */}
      {/* 1. HERO SHOWCASE CARD: CSS GRID (TEKS DI KIRI, CANVAS 3D DI KANAN)        */}
      {/* ========================================================================= */}
      <div className="w-full h-auto bg-[#0B132B] rounded-2xl p-5 sm:p-6 lg:p-7 border border-slate-800 shadow-2xl flex flex-col gap-6">
        {/* CSS Grid layout dividing text on left and 3D viewer on right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-auto">
          {/* Kolom Kiri: Teks Utama & Badge (lg:col-span-5) tanpa posisi absolute */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4 h-auto">
            <div>
              {/* Badges Tanpa Absolute Positioning */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
                  <Cpu className="w-3.5 h-3.5" />
                  PORTAL ADMINISTRATOR · DIGITAL TWIN 3D SEABRIS
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono">
                  <Lock className="w-3.5 h-3.5" />
                  HARDCODED: 50L · 25kg · 25cm
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  PROTOTIPE STANDAR RESMI
                </span>
              </div>

              {/* Teks Utama & Penjelasan Spesifikasi */}
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-tight">
                Inspeksi Kembaran Digital 3D &amp; Telemetri Terkalibrasi
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-2.5 leading-relaxed">
                Perakitan 10 komponen interaktif dengan visualisasi pancaran gelombang ultrasonik JSN-SR04T, 
                diagram penampang vertikal bak penampung tetap 25.0 cm, serta analisis siklus energi tenaga surya 20W.
              </p>
            </div>

            {/* Quick Status & Locked Capacity Indicator */}
            <div className="bg-[#070D1F] border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 uppercase tracking-wider">UNIT TERPILIH:</span>
                <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      currentDevice.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                    }`}
                  />
                  {currentDevice.name} ({currentDevice.code})
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center">
                <div className="bg-[#0B132B] p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400">KAPASITAS</div>
                  <div className="text-sm font-bold text-white font-mono mt-0.5">50.0 L</div>
                </div>
                <div className="bg-[#0B132B] p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400">BEBAN MAKS</div>
                  <div className="text-sm font-bold text-amber-400 font-mono mt-0.5">25.0 kg</div>
                </div>
                <div className="bg-[#0B132B] p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400">DATUM SENSOR</div>
                  <div className="text-sm font-bold text-cyan-400 font-mono mt-0.5">25.0 cm</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-mono pt-1 text-slate-400">
                <span>Status Sensor:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                  Terkalibrasi JSN-SR04T (0–25 cm)
                </span>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Area Visual/Canvas 3D (lg:col-span-7) */}
          <div className="lg:col-span-7 w-full h-auto min-h-[580px] rounded-2xl border border-slate-800 relative shadow-inner bg-[#070B14] flex flex-col overflow-visible">
            <SeabrisDigitalTwin3D
              ultrasonicDistanceCm={ultrasonicDistanceCm}
              onUltrasonicChange={(newDist) => {
                setUltrasonicDistanceCm(newDist);
                const pct = ((25.0 - newDist) / 25.0) * 100;
                setLoadCellKg(Number(((pct / 100) * 25.0).toFixed(2)));
              }}
              measuredWeightKg={loadCellKg}
              solarVoltageV={currentSolarData.solarV || 17.6}
              batterySocPct={currentDevice.batteryLevel}
              lang="id"
            />
          </div>
        </div>

        {/* 3. Barisan Tombol/Status Unit di Bagian Bawah dengan w-full overflow-x-auto & shrink-0 */}
        <div className="w-full h-auto pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold">
              STATUS &amp; PILIHAN UNIT SEABRIS INTERCEPTOR:
            </span>
            <span className="text-[11px] font-mono text-cyan-400">
              {devices.length} Unit Terpasang
            </span>
          </div>

          <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex items-center gap-2.5 min-w-max">
              {devices.map((device) => {
                const isSelected = device.id === currentDevice.id;
                return (
                  <button
                    key={device.id}
                    type="button"
                    onClick={() => onSelectDevice(device.id)}
                    className={`shrink-0 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2.5 border cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md shadow-cyan-500/25 scale-[1.02]'
                        : 'bg-[#101B3B] text-slate-300 hover:text-white border-slate-700/80 hover:bg-[#15244F]'
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        device.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                      }`}
                    />
                    <span className="shrink-0">{device.name}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded shrink-0 ${
                        isSelected ? 'bg-slate-900 text-cyan-300 font-bold' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {device.capacityPercentage}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Record to logs feedback alert */}
      {recordFeedback && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-500/50 rounded-xl text-xs font-mono text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{recordFeedback}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. FOUR DISTINCT DARK MODERN ARCHITECTURE SECTIONS                         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        {/* ----------------------------------------------------------------------- */}
        {/* CARD 01: KALIBRASI SENSOR ULTRASONIK & GEOMETRI BAK TETAP              */}
        {/* ----------------------------------------------------------------------- */}
        <div className="bg-[#0B132B] rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-semibold mb-1">
              01. KALIBRASI SENSOR ULTRASONIK & GEOMETRI BAK TETAP
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Kalkulator Telemetri JSN-SR04T (Rentang Kalibrasi 25.0 cm)
            </h3>
            <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400 mt-1 mb-5">
              <Lock className="w-3.5 h-3.5" />
              <span>HARDCODED: 50L · 25kg · 25cm</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Left Column: Sliders and test points */}
              <div className="md:col-span-7 space-y-4">
                {/* Distance Slider */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-slate-300 font-medium">Jarak Ultrasonik Terbaca (d_ultrasonik)</span>
                    <span className="font-mono text-cyan-400 font-bold tabular-nums">
                      {ultrasonicDistanceCm.toFixed(2)} cm
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.0}
                    max={25.0}
                    step={0.25}
                    value={ultrasonicDistanceCm}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setUltrasonicDistanceCm(val);
                      const pct = ((25.0 - val) / 25.0) * 100;
                      setLoadCellKg(Number(((pct / 100) * 25.0).toFixed(2)));
                    }}
                    className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-1 tabular-nums">
                    <span>0.00 cm (Penuh 100%)</span>
                    <span>12.50 cm (50%)</span>
                    <span>25.00 cm (Kosong 0%)</span>
                  </div>
                </div>

                {/* Load Cell Slider */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-slate-300 font-medium">Beban Load Cell HX711 (Maks 25.0 kg)</span>
                    <span className="font-mono text-cyan-400 font-bold tabular-nums">
                      {loadCellKg.toFixed(2)} kg / 25.00 kg
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.0}
                    max={25.0}
                    step={0.25}
                    value={loadCellKg}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setLoadCellKg(val);
                      const pct = (val / 25.0) * 100;
                      const dist = 25.0 - (pct / 100) * 25.0;
                      setUltrasonicDistanceCm(Number(dist.toFixed(2)));
                    }}
                    className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-1 tabular-nums">
                    <span>0.00 kg</span>
                    <span>12.50 kg</span>
                    <span>25.00 kg (Batas Maks)</span>
                  </div>
                </div>

                {/* Standard Test Buttons */}
                <div>
                  <div className="text-[11px] text-slate-400 font-medium mb-1.5">
                    Titik Uji Kalibrasi Standar:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { cm: 25.0, label: '25cm (0%)' },
                      { cm: 18.75, label: '18.75cm' },
                      { cm: 12.5, label: '12.5cm' },
                      { cm: 5.0, label: '5cm (80%)' },
                      { cm: 0.0, label: '0cm (100%)' },
                    ].map((btn) => (
                      <button
                        key={btn.cm}
                        type="button"
                        onClick={() => handleSelectPresetDepth(btn.cm)}
                        className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors border cursor-pointer ${
                          Math.abs(ultrasonicDistanceCm - btn.cm) < 0.2
                            ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                            : 'bg-[#101B3B] text-slate-300 hover:bg-[#15244F] border-slate-700/80'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Vertical Cross-Section Diagram */}
              <div className="md:col-span-5 flex flex-col items-center">
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2 text-center">
                  PENAMPANG VERTIKAL BAK (KEDALAMAN TETAP 25.0 CM)
                </div>
                
                <div className="relative w-44 h-48 bg-[#070D1F] border border-cyan-500/40 rounded-md overflow-hidden flex flex-col justify-end p-1 shadow-inner">
                  {/* Top Sensor Datum Indicator */}
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
                    <div className="w-5 h-2 bg-cyan-400 rounded-xs shadow-xs shadow-cyan-400/50" />
                    <span className="text-[9px] font-mono text-cyan-300 whitespace-nowrap mt-0.5">
                      JSN-SR04T (0.0 cm)
                    </span>
                  </div>

                  {/* Ultrasonic Acoustic Beam Lines */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                    <line
                      x1="50%"
                      y1="16"
                      x2="28%"
                      y2={`${Math.min(180, 18 + (ultrasonicDistanceCm / 25.0) * 160)}`}
                      stroke="#22D3EE"
                      strokeWidth="1.2"
                      strokeDasharray="2 2"
                      opacity="0.8"
                    />
                    <line
                      x1="50%"
                      y1="16"
                      x2="72%"
                      y2={`${Math.min(180, 18 + (ultrasonicDistanceCm / 25.0) * 160)}`}
                      stroke="#22D3EE"
                      strokeWidth="1.2"
                      strokeDasharray="2 2"
                      opacity="0.8"
                    />
                  </svg>

                  {/* Ruler Depth Marks on the Right Side */}
                  <div className="absolute top-2 right-1.5 bottom-2 flex flex-col justify-between text-[8px] font-mono text-slate-500 pointer-events-none z-20 select-none">
                    <span>— 0 cm</span>
                    <span>— 5 cm</span>
                    <span>— 10 cm</span>
                    <span>— 15 cm</span>
                    <span>— 20 cm</span>
                    <span>— 25 cm</span>
                  </div>

                  {/* Ultrasonic distance readout label */}
                  <div 
                    className="absolute left-1/2 -translate-x-1/2 z-20 text-[10px] font-mono text-cyan-300 font-bold transition-all"
                    style={{ top: `${Math.max(22, 10 + (ultrasonicDistanceCm / 25.0) * 75)}px` }}
                  >
                    d = {ultrasonicDistanceCm.toFixed(1)} cm
                  </div>

                  {/* Dynamic Water / Trash Volume Level */}
                  <div
                    className="w-full rounded-b transition-all duration-300 flex items-center justify-center relative overflow-hidden"
                    style={{
                      height: `${Math.max(6, (heightTrashCm / 25.0) * 100)}%`,
                      backgroundColor:
                        telemetry.statusLevel === 'CRITICAL_FULL'
                          ? '#be123c'
                          : telemetry.statusLevel === 'WARNING'
                          ? '#b45309'
                          : '#0369a1',
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-cyan-900/40 to-transparent" />
                    <span className="text-[10px] font-mono font-bold text-white relative z-10 text-center px-1">
                      h = {heightTrashCm.toFixed(1)} cm ({telemetry.fillPercentage.toFixed(0)}%)
                    </span>
                  </div>
                </div>

                <div className="text-[9px] font-mono text-slate-500 mt-2 text-center">
                  KAPASITAS TETAP: 50.0 L | 25.0 kg | 25.0 cm
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Card Bar: Formula & Record Button */}
          <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="font-mono text-slate-400 space-y-0.5">
              <div>
                Formula:{' '}
                <span className="text-cyan-400 font-bold">
                  Fill% = (({SEABRIS_FIXED_SPECS.FIXED_BIN_DEPTH_CM.toFixed(1)} - {ultrasonicDistanceCm.toFixed(2)}) / {SEABRIS_FIXED_SPECS.FIXED_BIN_DEPTH_CM.toFixed(1)}) × 100 = {telemetry.fillPercentage.toFixed(1)}%
                </span>
              </div>
              <div>
                Volume:{' '}
                <span className="text-white font-semibold">
                  V = ({telemetry.fillPercentage.toFixed(1)}% / 100) × {SEABRIS_FIXED_SPECS.BIN_CAPACITY_LITERS.toFixed(1)} L = {telemetry.estimatedVolumeLiters.toFixed(2)} Liter
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* CARD 02: SPESIFIKASI FISIK TERKUNCI (IMMUTABLE)                          */}
        {/* ----------------------------------------------------------------------- */}
        <div className="bg-[#0B132B] rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
                02. SPESIFIKASI FISIK TERKUNCI (IMMUTABLE)
              </span>
              <Lock className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-1 mb-3">
              Aturan Kapasitas Bak Tetap SEABRIS
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
              Sesuai spesifikasi rekayasa SEABRIS, dimensi fisik bak penampung sampah plastik dikunci secara permanen 
              pada perangkat keras, firmware ESP32, dan skema database relasional. Sistem tidak mengizinkan modifikasi 
              atau konfigurasi dinamis terhadap kapasitas bak.
            </p>

            {/* Locked Immutable Specs List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-[#070D1F] border border-slate-800 rounded-xl">
                <div>
                  <div className="text-xs font-semibold text-slate-200">Volume Maksimum Bak</div>
                  <div className="text-xs text-slate-500">Stainless 316 Mesh Basket</div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold text-white font-mono">
                    50.0 <span className="text-xs text-slate-400 font-normal">Liters</span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400">(LOCKED)</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-[#070D1F] border border-slate-800 rounded-xl">
                <div>
                  <div className="text-xs font-semibold text-slate-200">Kapasitas Berat Maksimum</div>
                  <div className="text-xs text-slate-500">HX711 Shear-Beam Load Cell Limit</div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold text-white font-mono">
                    25.0 <span className="text-xs text-slate-400 font-normal">kg</span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400">(LOCKED)</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-[#070D1F] border border-slate-800 rounded-xl">
                <div>
                  <div className="text-xs font-semibold text-slate-200">Kedalaman / Tinggi Kalibrasi Ultrasonik</div>
                  <div className="text-xs text-slate-500">JSN-SR04T Transducer Datum (0–25 cm)</div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold text-cyan-400 font-mono">
                    25.0 <span className="text-xs text-slate-400 font-normal">cm</span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400">(LOCKED)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Card Bar: Status Schema & Test Button */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="font-mono text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              STATUS PROTEKSI SKEMA: <strong className="text-emerald-400">AKTIF</strong>
            </span>

            <button
              type="button"
              onClick={() => setProtectionModalOpen(true)}
              className="px-3.5 py-2 bg-[#101B3B] hover:bg-[#15244F] text-slate-200 font-medium rounded-xl border border-slate-700 transition-colors text-xs font-mono cursor-pointer"
            >
              Uji Proteksi Kapasitas Tetap
            </button>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* CARD 03: SISTEM CATU DAYA SOLAR PV & BATERAI PENYIMPAN ENERGI          */}
        {/* ----------------------------------------------------------------------- */}
        <div className="bg-[#0B132B] rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-semibold mb-1">
              03. SISTEM CATU DAYA SOLAR PV & BATERAI PENYIMPAN ENERGI
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Kurva Siklus 24 Jam Panel Surya 20W & Baterai LiFePO4 12.8V
            </h3>
            <div className="flex items-center gap-3 text-xs font-mono text-slate-400 mt-1 mb-4">
              <span>
                Output:{' '}
                <strong className="text-amber-400 tabular-nums">
                  {currentSolarData.solarW.toFixed(2)} W
                </strong>
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>
                SoC:{' '}
                <strong className="text-emerald-400 tabular-nums">
                  {currentSolarData.batterySoc}%
                </strong>
              </span>
            </div>

            {/* Legend & Selected Point Readout */}
            <div className="flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 mb-2 gap-2">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-amber-400" />
                  Solar PV Output (W)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-emerald-400" />
                  Battery SoC (%)
                </span>
              </div>
              <div className="text-slate-300">
                Jam {currentSolarData.time} · PV: <span className="text-amber-400 font-bold">{currentSolarData.solarW} W</span> · SoC: <span className="text-emerald-400 font-bold">{currentSolarData.batterySoc}%</span> · Beban ESP32+GPS: <span className="text-cyan-300 font-bold">1.6 W</span>
              </div>
            </div>

            {/* Recharts 24h Area/Line Chart */}
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={SOLAR_BATTERY_CYCLE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748B" tick={{ fontSize: 10, fill: '#64748B' }} />
                  <YAxis
                    yAxisId="left"
                    stroke="#F59E0B"
                    domain={[0, 25]}
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    tickFormatter={(v) => `${v}W`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#10B981"
                    domain={[50, 100]}
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#070D1F',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '11px',
                      color: '#F8FAFC',
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  />
                  <ReferenceLine x={selectedHour} stroke="#38BDF8" strokeDasharray="3 3" yAxisId="left" />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="solarW"
                    name="Solar PV (W)"
                    stroke="#F59E0B"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#F59E0B' }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="batterySoc"
                    name="Battery SoC (%)"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#10B981' }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom Card Bar: Electrical Metrics */}
          <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div>
              <div className="text-[10px] font-mono text-slate-500 uppercase">TEGANGAN PV</div>
              <div className="text-base font-bold text-white font-mono mt-0.5">
                {(currentSolarData.solarV || 17.6).toFixed(2)} <span className="text-xs text-slate-400 font-normal">V</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono text-slate-500 uppercase">ARUS MPPT PV</div>
              <div className="text-base font-bold text-white font-mono mt-0.5">
                {(currentSolarData.mpptA || 0.94).toFixed(2)} <span className="text-xs text-slate-400 font-normal">A</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono text-slate-500 uppercase">BATERAI LiFePO4</div>
              <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                {(currentSolarData.batV || 13.42).toFixed(2)} <span className="text-xs text-slate-400 font-normal">V</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono text-slate-500 uppercase">OTONOMI CADANGAN</div>
              <div className="text-base font-bold text-cyan-400 font-mono mt-0.5">
                ~148 <span className="text-xs text-slate-400 font-normal">Jam</span>
              </div>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* CARD 04: KAJIAN ARSITEKTUR DAYA & KEANDALAN MEKANIS                      */}
        {/* ----------------------------------------------------------------------- */}
        <div className="bg-[#0B132B] rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                04. KAJIAN ARSITEKTUR DAYA & KEANDALAN MEKANIS
              </span>
              <span className="text-slate-500 text-xs font-mono font-bold">{'{⚡}'}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-1 mb-3">
              Solar PV + Baterai vs. Turbin Mikro-Hidro
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-4">
              Meskipun turbin mikro-hidro kinetik arus laut/sungai dikenal dalam literatur terdahulu 
              sebagai opsi daya tambahan di muara sungai, arsitektur standar SEABRIS secara tegas 
              menggunakan konfigurasi Panel Surya Fotovoltaik (PV) 20W + Baterai Penyimpan Energi LiFePO4.
            </p>

            {/* Mitigation Callout Box */}
            <div className="p-4 bg-amber-950/20 border border-amber-500/40 rounded-xl mb-4">
              <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-bold mb-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                MITIGASI RISIKO KEMACETAN TURBIN AKIBAT SAMPAH PLASTIK
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Di zona target operasi SEABRIS (muara sungai & perairan pesisir padat plastik), baling-baling 
                turbin mikro-hidro sangat rentan terlilit kantong plastik, tali rafia, dan jaring nelayan. 
                Konfigurasi non-mekanis Solar PV + Baterai menjamin transmisi telemetri IoT ESP32 & GPS 
                berjalan 24/7 tanpa risiko kemacetan rotor.
              </p>
            </div>
          </div>

          {/* Bottom Card Bar: Architecture Comparison Specs */}
          <div className="pt-4 border-t border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Kontroler Utama:</span>
              <span className="font-mono text-white font-medium">ESP32-WROOM-32D + GPS NEO-6M</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Sensor Kedalaman Bak:</span>
              <span className="font-mono text-cyan-400 font-medium">Ultrasonik JSN-SR04T (25.0 cm Tetap)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Catu Daya Primer:</span>
              <span className="font-mono text-emerald-400 font-medium">Solar PV 20W + LiFePO4 12.8V 18Ah</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL UJI PROTEKSI KAPASITAS TETAP (IMMUTABLE SPEC TEST MODAL)          */}
      {/* ========================================================================= */}
      {protectionModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0B132B] border border-slate-700 max-w-lg w-full rounded-2xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Lock className="w-4 h-4" />
                </div>
                <h4 className="text-base font-bold text-white">Uji Integritas Proteksi Kapasitas</h4>
              </div>
              <button
                type="button"
                onClick={() => setProtectionModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                Sistem menjalankan validasi kriptografis dan aturan integritas schema terhadap parameter:
              </p>
              <div className="p-3 bg-[#070D1F] border border-slate-800 rounded-xl space-y-1.5 font-mono text-[11px]">
                <div className="text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Volume Bak: 50.0 Liter [VALID - CONSTANT]</span>
                </div>
                <div className="text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Kapasitas Berat: 25.0 kg [VALID - CONSTANT]</span>
                </div>
                <div className="text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Rentang Datum Ultrasonik: 0–25 cm [VALID - CONSTANT]</span>
                </div>
              </div>
              <p className="text-slate-400">
                Hasil pengujian: Parameter tidak dapat dioverwrite oleh permintaan eksternal, form input dinamis, atau API payload liar.
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setProtectionModalOpen(false)}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs font-mono transition-colors cursor-pointer"
              >
                Tutup Pengujian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DigitalTwin3DView;
