import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Compass,
  Waves,
  Sliders,
  ChevronRight,
  Radio,
  RotateCcw,
  AlertTriangle,
  Gauge
} from 'lucide-react';

export interface SensorSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToOceanography?: () => void;
  initialCapacity?: number;
  deviceCode?: string;
  deviceName?: string;
  locationName?: string;
}

export const SensorSimulationModal: React.FC<SensorSimulationModalProps> = ({
  isOpen,
  onClose,
  onNavigateToOceanography,
  initialCapacity = 74,
  deviceCode = 'SEABRIS-01',
  deviceName = 'Unit Perintis Muara Angke',
  locationName = 'Muara Angke, Teluk Jakarta',
}) => {
  // Interactive simulation state
  const [capacity, setCapacity] = useState<number>(initialCapacity);
  const [sliderExpanded, setSliderExpanded] = useState<boolean>(true);

  // Derived telemetry metrics according to SEABRIS fixed physical specifications (50L, 25kg, 25cm)
  const FIXED_BIN_DEPTH_CM = 25.0;
  const FIXED_MAX_WEIGHT_KG = 25.0;
  const FIXED_BIN_CAPACITY_L = 50.0;

  const ultrasonicDistanceCm = Number(
    Math.max(0, FIXED_BIN_DEPTH_CM - (capacity / 100) * FIXED_BIN_DEPTH_CM).toFixed(1)
  );
  const estimatedWeightKg = Number(((capacity / 100) * FIXED_MAX_WEIGHT_KG).toFixed(1));
  const estimatedVolumeL = Number(((capacity / 100) * FIXED_BIN_CAPACITY_L).toFixed(1));

  // Determine status color and text based on capacity
  const isCritical = capacity >= 90;
  const isWarning = capacity >= 80 && capacity < 90;

  const statusColor = isCritical
    ? 'text-rose-400'
    : isWarning
    ? 'text-amber-400'
    : 'text-cyan-400';

  const statusBg = isCritical
    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
    : isWarning
    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
    : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300';

  const strokeColor = isCritical ? '#F43F5E' : isWarning ? '#F59E0B' : '#00B4D8';

  // SVG Circular progress math (radius 36 on 84x84 viewBox)
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(100, Math.max(0, capacity)) / 100);

  // Quick Preset Points
  const presetPoints = [
    { label: '0% Kosong', val: 0 },
    { label: '25%', val: 25 },
    { label: '50%', val: 50 },
    { label: '74% (Default)', val: 74 },
    { label: '85% (Siaga)', val: 85 },
    { label: '100% Penuh', val: 100 },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-md select-none font-sans">
          {/* Backdrop Click */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className="relative w-full max-w-xl bg-gradient-to-b from-[#0B132B] via-[#091126] to-[#070D1F] border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 text-white my-auto z-10"
          >
            {/* ================================================================= */}
            {/* 1. HEADER STATUS PERANGKAT                                        */}
            {/* ================================================================= */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                    SIMULASI KONTROL &amp; SENSOR LAPANGAN
                  </span>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span>{deviceCode}</span>
                  <span className="text-slate-400 font-normal text-sm sm:text-base">
                    ({deviceName})
                  </span>
                </h3>

                <p className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
                  <Waves className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Titik Operasi: {locationName}</span>
                </p>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-colors shrink-0 cursor-pointer"
                aria-label="Tutup Panel Sensor"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ================================================================= */}
            {/* 2. INDIKATOR KAPASITAS KERANJANG (CIRCULAR METER & ESTIMASI BERAT) */}
            {/* ================================================================= */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#070D1F] border border-slate-800 flex flex-col sm:flex-row items-center gap-5 shadow-inner">
              {/* Progress Circle */}
              <div className="relative shrink-0 w-24 h-24 rounded-full bg-slate-900/90 border border-slate-800/80 flex flex-col items-center justify-center text-center shadow-md">
                <svg
                  className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none"
                  viewBox="0 0 80 80"
                >
                  {/* Background Track */}
                  <circle
                    cx="40"
                    cy="40"
                    r={radius}
                    stroke="#1E293B"
                    strokeWidth="6"
                    fill="none"
                  />
                  {/* Dynamic Active Value Track */}
                  <circle
                    cx="40"
                    cy="40"
                    r={radius}
                    stroke={strokeColor}
                    strokeWidth="6"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-300"
                  />
                </svg>

                <span className={`text-2xl font-black font-mono tracking-tight leading-none tabular-nums relative z-10 ${statusColor}`}>
                  {capacity}%
                </span>
                <span className="text-[10px] tracking-wider uppercase font-semibold text-slate-400 mt-1 relative z-10 font-mono">
                  KAPASITAS
                </span>
              </div>

              {/* Right Side Status & Weight Estimation */}
              <div className="flex-1 min-w-0 w-full space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                    <Gauge className="w-4 h-4 text-cyan-400" />
                    <span>Keterisian Keranjang Sampah</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${statusBg}`}>
                    {isCritical ? 'Kritis Penuh' : isWarning ? 'Siaga Tampung' : 'Normal'}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      width: `${capacity}%`,
                      backgroundColor: strokeColor,
                    }}
                    transition={{ type: 'spring', damping: 20 }}
                  />
                </div>

                {/* Detailed Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px] text-slate-400">
                  <div className="bg-[#0B132B] p-2 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block uppercase">Estimasi Berat:</span>
                    <strong className="text-white text-xs tabular-nums">~{estimatedWeightKg} kg</strong>
                    <span className="text-[10px] text-slate-500"> / 25 kg</span>
                  </div>
                  <div className="bg-[#0B132B] p-2 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block uppercase">Jarak Sensor:</span>
                    <strong className="text-cyan-400 text-xs tabular-nums">d = {ultrasonicDistanceCm} cm</strong>
                    <span className="text-[10px] text-slate-500"> (0–25cm)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ================================================================= */}
            {/* 3. PANEL INTERAKTIF & SLIDER SIMULASI SENSOR                      */}
            {/* ================================================================= */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setSliderExpanded((prev) => !prev)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 text-xs font-semibold text-cyan-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>Buka Panel Kontrol &amp; Simulasi Sensor Slider</span>
                </div>
                <span className="font-mono text-[11px] text-slate-400">
                  {sliderExpanded ? '▾ Sembunyikan' : '▴ Buka Slider'}
                </span>
              </button>

              {sliderExpanded && (
                <div className="p-4 rounded-2xl bg-[#070D1F] border border-slate-800 space-y-4 animate-in fade-in duration-200">
                  {/* Slider Control */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300 font-medium">Uji Nilai Telemetri (0% - 100%):</span>
                      <span className={`font-bold tabular-nums text-sm ${statusColor}`}>
                        {capacity}% ({estimatedVolumeL} Liter)
                      </span>
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={capacity}
                      onChange={(e) => setCapacity(parseInt(e.target.value, 10))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      aria-label="Slider simulasi kapasitas sensor"
                    />

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-0.5">
                      <span>0% (Kosong · d=25.0cm)</span>
                      <span>50% (25L · 12.5cm)</span>
                      <span>100% (Penuh · d=0.0cm)</span>
                    </div>
                  </div>

                  {/* Test Point Preset Buttons */}
                  <div>
                    <div className="text-[11px] font-mono text-slate-400 mb-1.5">
                      Titik Uji Cepat (Presets):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {presetPoints.map((pt) => (
                        <button
                          key={pt.label}
                          type="button"
                          onClick={() => setCapacity(pt.val)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors border cursor-pointer ${
                            capacity === pt.val
                              ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-xs'
                              : 'bg-[#0B132B] text-slate-300 hover:bg-[#101E42] border-slate-800'
                          }`}
                        >
                          {pt.label}
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() => setCapacity(initialCapacity)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-mono text-slate-400 hover:text-white bg-slate-900 border border-slate-800 flex items-center gap-1 transition-colors cursor-pointer ml-auto"
                        title="Reset ke nilai awal"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset</span>
                      </button>
                    </div>
                  </div>

                  {/* Warning Notice If Critical */}
                  {capacity >= 80 && (
                    <div className="p-3 bg-amber-950/30 border border-amber-500/40 rounded-xl text-xs flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="text-[11px] leading-relaxed text-amber-200">
                        <strong className="text-amber-400">Peringatan Keterisian:</strong> Bak penampung telah mencapai ambang batas evakuasi ({capacity}%). Tim lapangan UPK Badan Air Muara Angke menerima transmisi telemetri otomatis untuk pengosongan keranjang.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ================================================================= */}
            {/* 4. FOOTER TAUTAN CEPAT & NAVIGASI INTERNAL                        */}
            {/* ================================================================= */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <Compass className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="font-medium text-slate-300">
                  Pasut &amp; Arus Muara Angke
                </span>
              </div>

              <div className="flex items-center gap-2">
                {onNavigateToOceanography && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToOceanography();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-cyan-300 hover:text-cyan-200 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-all cursor-pointer font-mono"
                  >
                    <span>Lihat Oseanografi</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SensorSimulationModal;
