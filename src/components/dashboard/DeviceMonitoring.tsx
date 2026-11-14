import React, { useState } from 'react';
import {
  MapPin,
  Battery,
  Sun,
  Waves,
  Clock,
  AlertTriangle,
  ChevronDown,
  Terminal,
  ShieldAlert,
  UserCheck,
  ShieldCheck,
  Activity,
  Gauge,
  Compass,
} from 'lucide-react';
import { Device, SensorLog, AuthUser, User } from '../../types';
import { CapacityGauge } from '../common/CapacityGauge';
import { getCapacityCategory } from '../../data/mockData';
import { SpotlightCard } from '../common/SpotlightCard';

interface DeviceMonitoringProps {
  devices: Device[];
  selectedDeviceId: string;
  onSelectDevice: (id: string) => void;
  logs: SensorLog[];
  currentUser?: AuthUser | User | null;
  onNavigateToMap?: () => void;
  onNavigateToReports?: () => void;
  onNavigateToScanner?: () => void;
  onNavigateToDigitalTwin?: () => void;
}

export const DeviceMonitoring: React.FC<DeviceMonitoringProps> = ({
  devices,
  selectedDeviceId,
  onSelectDevice,
  logs,
  currentUser = null,
}) => {
  const currentDevice = devices.find((d) => d.id === selectedDeviceId) || devices[0];
  const [showCodeSnippet, setShowCodeSnippet] = useState(false);

  const deviceLogs = logs
    .filter((l) => l.deviceId === currentDevice.id || l.deviceCode === currentDevice.code)
    .slice(0, 10);

  const category = getCapacityCategory(currentDevice.capacityPercentage);
  const isOperator = currentUser?.role === 'operator';
  const isOnline = currentDevice.status !== 'offline';
  const ultrasonicDistanceCm = Math.round(150 - (currentDevice.capacityPercentage / 100) * 120);
  const filledVolumeLiters = Math.round(
    (currentDevice.capacityPercentage / 100) * currentDevice.basketVolumeLiters
  );

  return (
    <div className="w-full max-w-full overflow-x-hidden box-border space-y-6">

      {/* Role Indicator Card */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0f2942] text-white flex items-center justify-center shrink-0">
            {isOperator ? (
              <UserCheck className="w-5 h-5 text-[#38bdf8]" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-[#38bdf8]" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-[#0f2942]">
                {isOperator
                  ? 'Tampilan Petugas Lapangan — Monitoring Operasional Perangkap'
                  : 'Tampilan Administrator — Monitoring Penuh Unit IoT'}
              </h3>
              <span className="text-slate-300 hidden sm:inline" aria-hidden="true">·</span>
              <span className="text-xs font-semibold text-[#0284c7]">
                {isOperator ? 'Petugas Lapangan' : 'Administrator'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {isOperator
                ? 'Fokus pada kapasitas perangkap (50L & 25 kg), status telemetri aktif, dan pembacaan sensor lapangan.'
                : 'Akses penuh seluruh parameter telemetri perangkat dan skema integrasi payload ESP32.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#f8fafc] px-3 py-2 rounded-xl border border-slate-200 self-stretch sm:self-auto justify-between sm:justify-start">
          <span className="text-[11px] text-slate-500">Spesifikasi:</span>
          <span className="text-xs font-bold font-mono text-[#0f2942]">50 Liter / 25 kg</span>
        </div>
      </div>

      {/* Top Device Header & Selector */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-[#0284c7]">Unit Telemetri Pesisir</span>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <span className="font-mono text-slate-500">{currentDevice.hardwareModel}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0f2942] tracking-tight">
              {currentDevice.code}: {currentDevice.name}
            </h2>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                isOnline ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#0284c7]" />
              {currentDevice.locationName} ({currentDevice.subDistrict})
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Pembaruan: {currentDevice.lastUpdated}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="device-select" className="text-xs text-slate-500 font-medium whitespace-nowrap">
            Pilih Unit:
          </label>
          <div className="relative">
            <select
              id="device-select"
              value={currentDevice.id}
              onChange={(e) => onSelectDevice(e.target.value)}
              className="appearance-none bg-[#f8fafc] border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-xs font-bold text-[#0f2942] focus:outline-none focus:ring-2 focus:ring-[#38bdf8] cursor-pointer"
            >
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} - {d.locationName.split(',')[0]} ({d.capacityPercentage}%)
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Alert Notice for >=80% and >=90% */}
      {currentDevice.capacityPercentage >= 90 ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 sm:p-5 flex items-start gap-3.5">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-rose-900">
              Peringatan Kritis: Keranjang Penampung Penuh ({currentDevice.capacityPercentage}%)
            </h4>
            <p className="text-xs text-rose-800 leading-relaxed">
              Kapasitas keranjang di {currentDevice.locationName} telah melewati ambang batas 90%. Segera tugaskan tim perahu penjemput sampah untuk evakuasi fisik keranjang.
            </p>
          </div>
        </div>
      ) : currentDevice.capacityPercentage >= 80 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-5 flex items-start gap-3.5">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-900">
              Peringatan: Keranjang Hampir Penuh ({currentDevice.capacityPercentage}%)
            </h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              Kapasitas keranjang telah mencapai {currentDevice.capacityPercentage}%. Persiapkan jadwal pengangkutan reguler dalam 2–4 jam ke depan.
            </p>
          </div>
        </div>
      ) : null}

      {/* Main Monitoring Section: Gauge + Telemetry Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <SpotlightCard
          className="lg:col-span-5"
          hoverLift={false}
          contentClassName="p-6 flex flex-col items-center justify-center space-y-4"
        >
          <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-[#0f2942] text-sm">
              Tingkat Keterisian Keranjang
            </h3>
            <span className="text-xs font-mono text-slate-500">
              Sensor JSN-SR04T
            </span>
          </div>

          <div className="py-2">
            <CapacityGauge percentage={currentDevice.capacityPercentage} size={220} />
          </div>

          <div className="w-full grid grid-cols-3 gap-2.5 pt-3 border-t border-slate-100 text-center">
            <div className="p-2.5 rounded-xl bg-[#f8fafc] border border-slate-200 transition-colors hover:border-sky-300">
              <span className="text-[11px] text-slate-500 block">Kategori</span>
              <span className="text-xs font-bold text-[#0f2942]">{category}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#f8fafc] border border-slate-200 transition-colors hover:border-sky-300">
              <span className="text-[11px] text-slate-500 block">Beban Terukur</span>
              <span className="text-xs font-bold text-[#0284c7] font-mono tabular-nums">
                ~{currentDevice.estimatedWeightKg} / 25 kg
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#f8fafc] border border-slate-200 transition-colors hover:border-sky-300">
              <span className="text-[11px] text-slate-500 block">Kapasitas Bak</span>
              <span className="text-xs font-bold text-[#0f2942] font-mono tabular-nums">
                50 Liter
              </span>
            </div>
          </div>
        </SpotlightCard>

        {/* Hardware Diagnostics & Real-Time Telemetry Panel */}
        <SpotlightCard
          className="lg:col-span-7"
          hoverLift={false}
          contentClassName="p-6 flex flex-col justify-between space-y-6"
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 text-[#0284c7] flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-[#0f2942] text-sm">
                    Diagnostik Perangkat & Telemetri Sensor
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pembacaan sensor ultrasonik, kondisi daya, dan arus muara secara real-time
                  </p>
                </div>
              </div>
              <span
                className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold ${
                  isOnline ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <span>{isOnline ? 'Telemetri Aktif' : 'Terputus'}</span>
              </span>
            </div>

            {/* Hardware & Sensor Telemetry Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <SpotlightCard variant="subtle" contentClassName="p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Gauge className="w-3.5 h-3.5 text-[#0284c7]" />
                  <span>Jarak Permukaan</span>
                </div>
                <span className="text-sm font-bold font-mono text-[#0f2942] tabular-nums block">
                  {ultrasonicDistanceCm} cm
                </span>
                <span className="text-[11px] text-slate-500 block truncate">
                  {currentDevice.sensorType}
                </span>
              </SpotlightCard>

              <SpotlightCard variant="subtle" contentClassName="p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Activity className="w-3.5 h-3.5 text-[#0284c7]" />
                  <span>Volume Terisi</span>
                </div>
                <span className="text-sm font-bold font-mono text-[#0f2942] tabular-nums block">
                  {filledVolumeLiters} / {currentDevice.basketVolumeLiters} L
                </span>
                <span className="text-[11px] text-slate-500 block">
                  {currentDevice.capacityPercentage}% Terpantau
                </span>
              </SpotlightCard>

              <SpotlightCard variant="subtle" contentClassName="p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Battery className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Baterai LiFePO4</span>
                </div>
                <span className="text-sm font-bold font-mono text-[#0f2942] tabular-nums block">
                  {currentDevice.batteryLevel}%
                </span>
                <span
                  className={`text-[11px] block ${
                    currentDevice.batteryLevel >= 50 ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {currentDevice.batteryLevel >= 50 ? 'Daya Optimal' : 'Perlu Pengisian'}
                </span>
              </SpotlightCard>

              <SpotlightCard variant="subtle" contentClassName="p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Sun className="w-3.5 h-3.5 text-amber-600" />
                  <span>Solar PV Unit</span>
                </div>
                <span className="text-sm font-bold font-mono text-[#0f2942] block">
                  {currentDevice.solarCharging ? 'Mengisi Daya' : 'Standby'}
                </span>
                <span className="text-[11px] text-slate-500 block">20 Watt Monocrystal</span>
              </SpotlightCard>

              <SpotlightCard variant="subtle" contentClassName="p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Waves className="w-3.5 h-3.5 text-[#0284c7]" />
                  <span>Arus Muara</span>
                </div>
                <span className="text-sm font-bold font-mono text-[#0f2942] tabular-nums block">
                  {currentDevice.waterFlowSpeed} m/s
                </span>
                <span className="text-[11px] text-slate-500 block">Arus Pasang Surut</span>
              </SpotlightCard>

              <SpotlightCard variant="subtle" contentClassName="p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Compass className="w-3.5 h-3.5 text-[#0284c7]" />
                  <span>Koordinat GPS</span>
                </div>
                <span className="text-sm font-bold font-mono text-[#0f2942] tabular-nums block truncate">
                  {currentDevice.coordinates[0].toFixed(3)}, {currentDevice.coordinates[1].toFixed(3)}
                </span>
                <span className="text-[11px] text-slate-500 block truncate">
                  {currentDevice.subDistrict}
                </span>
              </SpotlightCard>
            </div>

            {/* Operational Threshold Reference */}
            <div className="p-4 rounded-xl bg-[#f8fafc] border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-[#0f2942]">
                Ambang Batas Evakuasi Keranjang:
              </span>
              <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono">
                <span className="text-slate-600">0–79% Normal</span>
                <span className="text-amber-700 font-semibold">80–89% Waspada</span>
                <span className="text-rose-700 font-semibold">≥90% Kritis</span>
              </div>
            </div>
          </div>

          {currentUser?.role === 'admin' ? (
            <div className="border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setShowCodeSnippet(!showCodeSnippet)}
                className="text-xs font-semibold text-[#0284c7] hover:text-[#0f2942] flex items-center gap-1.5 cursor-pointer"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>
                  {showCodeSnippet
                    ? 'Sembunyikan Skema ESP32'
                    : 'Lihat Skema Integrasi ESP32 & Payload JSON'}
                </span>
              </button>

              {showCodeSnippet && (
                <div className="mt-3 p-4 rounded-xl bg-[#0f2942] text-slate-200 font-mono text-xs overflow-x-auto space-y-2">
                  <p className="text-[11px] text-[#38bdf8]">
                    Endpoint REST / MQTT Payload untuk mikrokontroler ESP32:
                  </p>
                  <pre className="text-[11px] leading-relaxed text-emerald-300">
{`POST /api/v1/telemetry
Content-Type: application/json

{
  "device_id": "${currentDevice.code}",
  "distance_cm": ${Math.round(150 - (currentDevice.capacityPercentage / 100) * 120)},
  "capacity_pct": ${currentDevice.capacityPercentage},
  "battery_pct": ${currentDevice.batteryLevel},
  "flow_speed": ${currentDevice.waterFlowSpeed},
  "timestamp": "${new Date().toISOString()}"
}`}
                  </pre>
                  <p className="text-[11px] text-slate-300 font-sans">
                    Arsitektur di <code className="text-[#38bdf8]">src/services/iotService.ts</code> siap dihubungkan ke webhook ESP32 tanpa mengubah komponen UI.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Konektivitas Telemetri Aktif · Frekuensi 30 Detik</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Mode Petugas Lapangan
              </span>
            </div>
          )}
        </SpotlightCard>
      </div>

      {/* Mini Device History Table */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-[#0f2942] text-sm">
            Riwayat Pembacaan Sensor Terbaru ({currentDevice.code})
          </h3>
          <span className="text-xs text-slate-500 tabular-nums">
            {deviceLogs.length} Log Terakhir
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f8fafc] text-slate-600 font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Waktu</th>
                <th className="py-2.5 px-3">Kapasitas</th>
                <th className="py-2.5 px-3">Status Kategori</th>
                <th className="py-2.5 px-3">Baterai</th>
                <th className="py-2.5 px-3">Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deviceLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#f8fafc] transition-colors">
                  <td className="py-2.5 px-3 font-mono text-slate-600 tabular-nums">
                    {log.time} WIB ({log.date})
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-[#0f2942] tabular-nums">
                    {log.capacityPercentage}%
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                        log.capacityPercentage >= 90
                          ? 'text-rose-700'
                          : log.capacityPercentage >= 80
                          ? 'text-amber-700'
                          : 'text-[#0284c7]'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          log.capacityPercentage >= 90
                            ? 'bg-rose-500'
                            : log.capacityPercentage >= 80
                            ? 'bg-amber-500'
                            : 'bg-[#38bdf8]'
                        }`}
                      />
                      <span>{log.status}</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-600 tabular-nums">
                    {log.batteryLevel}%
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">Telemetri Sensor</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
