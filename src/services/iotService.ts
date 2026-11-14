import {
  Device,
  SensorLog,
  WasteReport,
  AppNotification,
  SystemSettings,
  ReportStatus,
  WasteScanResult,
} from '../types';
import {
  INITIAL_DEVICES,
  INITIAL_SENSOR_LOGS,
  INITIAL_SETTINGS,
  getCapacityCategory,
} from '../data/mockData';
import { supabase } from '../lib/supabase';

// Kunci localStorage versi lama. Sekarang semua data ada di Supabase,
// jadi kunci ini hanya dibersihkan agar tidak ada data usang tersisa di browser.
const LEGACY_STORAGE_KEYS = [
  'seabris_devices_v1',
  'seabris_sensor_logs_v1',
  'seabris_waste_reports_v1',
  'seabris_notifications_v1',
  'seabris_settings_v1',
  'seabris_waste_scans_v1',
];

// ============================================================
// Helper umum
// ============================================================
const TZ = 'Asia/Jakarta';
const BUCKET = 'report-photos';
const STORAGE_PUBLIC_PREFIX = `${String(import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '')}/storage/v1/object/public/${BUCKET}/`;

/** Tanggal & jam sekarang dalam WIB (bukan UTC), format: 2026-11-14 / 09:10 */
function jakartaNow() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-CA', { timeZone: TZ });
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
  return { dateStr, timeStr, fullTimeStr: `${dateStr} ${timeStr}:00` };
}

/** "2026-11-14 09:10" dalam WIB dari timestamp ISO */
function wibStamp(iso: string | null): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-CA', { timeZone: TZ });
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
  return `${date} ${time}`;
}

function relativeTime(iso: string | null): string {
  if (!iso) return '-';
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return 'Baru saja';
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const h = Math.floor(diffMin / 60);
  if (h < 24) return `${h} jam lalu`;
  return `${Math.floor(h / 24)} hari lalu`;
}

function rand(n: number): string {
  return Math.random().toString(36).slice(2, 2 + n);
}
function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${rand(4)}`;
}
/** Nomor tiket acak (unik antar perangkat), mis. REP-2026-K3X9Q */
function newTicket(prefix: string): string {
  return `${prefix}-${jakartaNow().dateStr.slice(0, 4)}-${rand(5).toUpperCase().padEnd(5, '0')}`;
}

// ============================================================
// Foto -> Supabase Storage (bukan base64 di database)
// ============================================================

/** Perkecil foto (maks 1600px, JPEG 82%) supaya cepat diunggah dan hemat kuota Storage. */
async function compressImage(src: Blob): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(src);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bmp.width * scale));
    canvas.height = Math.max(1, Math.round(bmp.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return src;
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const out: Blob | null = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.82));
    return out && out.size < src.size ? out : src;
  } catch {
    return src;
  }
}

/**
 * Pastikan foto ada di Storage dan kembalikan URL publiknya.
 * - Sudah URL Storage  -> dipakai apa adanya
 * - data: / URL lokal  -> diambil, dikompres, diunggah
 * - Gagal              -> '' (laporan tetap bisa disimpan tanpa foto)
 */
async function uploadPhoto(url: string, folder: 'reports' | 'scans', name: string): Promise<string> {
  if (!url) return '';
  if (url.startsWith(STORAGE_PUBLIC_PREFIX)) return url;
  try {
    const blob = await (await fetch(url)).blob();
    if (!blob.type.startsWith('image/')) return '';
    const out = await compressImage(blob);
    const ext = out.type.includes('png') ? 'png' : out.type.includes('webp') ? 'webp' : 'jpg';
    const path = `${folder}/${name}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, out, { contentType: out.type || 'image/jpeg', upsert: false });
    if (error) throw error;
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  } catch (e) {
    console.warn('[SEABRIS] Foto gagal diunggah ke Storage:', e);
    return '';
  }
}

/** Hapus file foto dari Storage (best-effort, hanya untuk URL milik bucket ini). */
async function removePhotos(urls: string[]): Promise<void> {
  const paths = urls
    .filter((u) => u && u.startsWith(STORAGE_PUBLIC_PREFIX))
    .map((u) => decodeURIComponent(u.slice(STORAGE_PUBLIC_PREFIX.length)));
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) console.warn('[SEABRIS] Gagal menghapus foto dari Storage:', error.message);
}

// ============================================================
// Pemetaan baris database <-> tipe aplikasi
// ============================================================
interface DeviceRow {
  id: string; code: string; name: string; location_name: string; sub_district: string;
  lat: number; lng: number; capacity_percentage: number; battery_level: number;
  solar_charging: boolean; status: string; water_flow_speed: number | string;
  basket_volume_liters: number; estimated_weight_kg: number | string;
  hardware_model: string; sensor_type: string; is_simulated: boolean; updated_at: string | null;
}
interface SensorLogRow {
  id: string; device_id: string; device_code: string; device_name: string;
  logged_at: string; capacity_percentage: number; status: string; battery_level: number;
}
interface ReportRow {
  id: string; ticket_number: string; reporter_name: string; location_name: string;
  lat: number | null; lng: number | null; photo_url: string | null; waste_type: string;
  description: string | null; status: string; estimated_volume: string | null;
  assigned_team: string | null; verified_at: string | null; report_date: string | null; created_at: string;
}
interface ScanExtra {
  detectedObjects?: WasteScanResult['detectedObjects'];
  biodegradationCategory?: string;
  biodegradationExplanation?: string;
  environmentalRisks?: string[];
  recyclingPotential?: string;
  handlingRecommendation?: string;
  reportedAsWasteTicket?: string;
}
interface ScanRow {
  id: string; ticket_code: string; image_url: string | null; scanned_at: string;
  primary_category: string | null; primary_material: string | null; recommendation_category: string | null;
  verification_status: string; verified_by: string | null; verified_at: string | null; notes: string | null;
  is_demo: boolean | null; source: string | null; result: ScanExtra | null;
}
interface NotificationRow {
  id: string; title: string; message: string; type: string; is_read: boolean;
  device_id: string | null; device_code: string | null; report_id: string | null; created_at: string;
}
interface SettingsRow {
  id: number; warning_threshold: number; critical_threshold: number; telemetry_interval_seconds: number;
  auto_alert_sound: boolean; esp32_endpoint_url: string; api_mode: string;
}

function rowToDevice(r: DeviceRow): Device {
  return {
    id: r.id, code: r.code, name: r.name, locationName: r.location_name, subDistrict: r.sub_district,
    coordinates: [Number(r.lat), Number(r.lng)],
    capacityPercentage: r.capacity_percentage, batteryLevel: r.battery_level,
    solarCharging: r.solar_charging, status: r.status as Device['status'],
    lastUpdated: relativeTime(r.updated_at),
    waterFlowSpeed: Number(r.water_flow_speed), basketVolumeLiters: r.basket_volume_liters,
    estimatedWeightKg: Number(r.estimated_weight_kg),
    hardwareModel: r.hardware_model, sensorType: r.sensor_type, isSimulated: r.is_simulated,
  };
}

function rowToLog(r: SensorLogRow): SensorLog {
  const stamp = wibStamp(r.logged_at) as string;
  const [date, time] = stamp.split(' ');
  return {
    id: r.id, deviceId: r.device_id, deviceCode: r.device_code, deviceName: r.device_name,
    timestamp: `${date} ${time}:00`, date, time,
    capacityPercentage: r.capacity_percentage, status: r.status as SensorLog['status'],
    batteryLevel: r.battery_level,
  };
}

function rowToReport(r: ReportRow): WasteReport {
  return {
    id: r.id,
    ticketNumber: r.ticket_number,
    reporterName: r.reporter_name,
    locationName: r.location_name,
    coordinates: r.lat !== null && r.lng !== null ? [Number(r.lat), Number(r.lng)] : null,
    photoUrl: r.photo_url ?? '',
    wasteType: r.waste_type as WasteReport['wasteType'],
    description: r.description ?? '',
    date: r.report_date ?? wibStamp(r.created_at)?.split(' ')[0] ?? '',
    status: r.status as ReportStatus,
    estimatedVolume: r.estimated_volume ?? undefined,
    assignedTeam: r.assigned_team ?? undefined,
    verifiedAt: wibStamp(r.verified_at),
  };
}

function reportToRow(r: WasteReport) {
  return {
    id: r.id,
    ticket_number: r.ticketNumber,
    reporter_name: r.reporterName,
    location_name: r.locationName,
    lat: r.coordinates ? r.coordinates[0] : null,
    lng: r.coordinates ? r.coordinates[1] : null,
    photo_url: r.photoUrl,
    waste_type: r.wasteType,
    description: r.description,
    status: 'Menunggu Verifikasi',
    estimated_volume: r.estimatedVolume ?? null,
    report_date: r.date,
  };
}

function rowToScan(r: ScanRow): WasteScanResult {
  const x = r.result ?? {};
  const stamp = wibStamp(r.scanned_at) as string;
  const [date, time] = stamp.split(' ');
  return {
    id: r.id,
    ticketCode: r.ticket_code,
    imageUrl: r.image_url ?? '',
    scannedAt: `${date} ${time}:00`,
    date,
    time,
    detectedObjects: x.detectedObjects ?? [],
    primaryCategory: r.primary_category ?? 'Tidak Teridentifikasi',
    primaryMaterial: r.primary_material ?? '-',
    biodegradationCategory: x.biodegradationCategory ?? '-',
    biodegradationExplanation: x.biodegradationExplanation ?? '',
    environmentalRisks: x.environmentalRisks ?? [],
    recyclingPotential: x.recyclingPotential ?? '',
    handlingRecommendation: x.handlingRecommendation ?? '',
    recommendationCategory: r.recommendation_category ?? 'Perlu Verifikasi',
    verificationStatus: r.verification_status as WasteScanResult['verificationStatus'],
    verifiedBy: r.verified_by ?? undefined,
    verifiedAt: wibStamp(r.verified_at),
    notes: r.notes ?? undefined,
    isDemo: r.is_demo ?? undefined,
    source: r.source ?? undefined,
    reportedAsWasteTicket: x.reportedAsWasteTicket,
  };
}

function scanToRow(s: WasteScanResult, imageUrl: string) {
  const result: ScanExtra = {
    detectedObjects: s.detectedObjects,
    biodegradationCategory: s.biodegradationCategory,
    biodegradationExplanation: s.biodegradationExplanation,
    environmentalRisks: s.environmentalRisks,
    recyclingPotential: s.recyclingPotential,
    handlingRecommendation: s.handlingRecommendation,
    reportedAsWasteTicket: s.reportedAsWasteTicket,
  };
  return {
    id: s.id,
    ticket_code: s.ticketCode,
    image_url: imageUrl,
    scanned_at: new Date().toISOString(),
    primary_category: s.primaryCategory,
    primary_material: s.primaryMaterial,
    recommendation_category: s.recommendationCategory,
    verification_status: 'Belum Diverifikasi',
    is_demo: s.isDemo ?? false,
    source: s.source ?? null,
    result,
  };
}

function rowToNotification(r: NotificationRow): AppNotification {
  return {
    id: r.id, title: r.title, message: r.message,
    type: r.type as AppNotification['type'],
    timestamp: relativeTime(r.created_at),
    read: r.is_read,
    deviceId: r.device_id ?? undefined,
    deviceCode: r.device_code ?? undefined,
    reportId: r.report_id ?? undefined,
  };
}

function rowToSettings(r: SettingsRow): SystemSettings {
  return {
    warningThreshold: r.warning_threshold,
    criticalThreshold: r.critical_threshold,
    telemetryIntervalSeconds: r.telemetry_interval_seconds,
    autoAlertSound: r.auto_alert_sound,
    esp32EndpointUrl: r.esp32_endpoint_url,
    apiMode: r.api_mode as SystemSettings['apiMode'],
  };
}

function settingsToRow(s: SystemSettings) {
  return {
    id: 1,
    warning_threshold: s.warningThreshold,
    critical_threshold: s.criticalThreshold,
    telemetry_interval_seconds: s.telemetryIntervalSeconds,
    auto_alert_sound: s.autoAlertSound,
    esp32_endpoint_url: s.esp32EndpointUrl,
    api_mode: s.apiMode,
  };
}

function newLogId(): string {
  return newId('log');
}

class IotService {
  private devices: Device[];
  private logs: SensorLog[];
  private reports: WasteReport[] = [];
  private notifications: AppNotification[] = [];
  private settings: SystemSettings;
  private scans: WasteScanResult[] = [];
  private listeners: Set<() => void> = new Set();
  private hydrated = false;
  private reloadTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Placeholder sampai data server tiba (supaya UI tidak pernah crash karena daftar device kosong).
    // Laporan, scan, dan notifikasi dimulai kosong: itu data nyata, bukan contoh.
    this.devices = INITIAL_DEVICES;
    this.logs = INITIAL_SENSOR_LOGS;
    this.settings = INITIAL_SETTINGS;

    try {
      LEGACY_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
    } catch { /* abaikan */ }

    void this.loadRemote();
    this.subscribeRealtime();

    // Login/logout mengubah apa yang boleh dibaca (laporan, scan, notifikasi hanya untuk staf).
    // Jangan await query di dalam callback ini; cukup jadwalkan muat ulang.
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        this.reports = [];
        this.scans = [];
        this.notifications = [];
        this.settings = INITIAL_SETTINGS;
        this.notify();
      }
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') this.scheduleReload();
    });
  }

  // ---------- Supabase: load, realtime ----------

  /** true setelah data pertama dari Supabase berhasil dimuat */
  public isHydrated(): boolean {
    return this.hydrated;
  }

  private async loadRemote(): Promise<void> {
    const { data: sess } = await supabase.auth.getSession();
    const loggedIn = !!sess.session;

    const publicQ = Promise.all([
      supabase.from('devices').select('*').order('code', { ascending: true }),
      supabase.from('sensor_logs').select('*').order('logged_at', { ascending: false }).limit(50),
    ]);
    const privateQ = loggedIn
      ? Promise.all([
          supabase.from('waste_reports').select('*').order('created_at', { ascending: false }).limit(500),
          supabase.from('waste_scans').select('*').order('scanned_at', { ascending: false }).limit(500),
          supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(40),
          supabase.from('system_settings').select('*').eq('id', 1).maybeSingle(),
        ])
      : Promise.resolve(null);

    const [[devRes, logRes], privRes] = await Promise.all([publicQ, privateQ]);

    if (devRes.error) {
      console.warn('[SEABRIS] Gagal memuat devices:', devRes.error.message);
    } else if (devRes.data && devRes.data.length > 0) {
      this.devices = (devRes.data as DeviceRow[]).map(rowToDevice);
    } else {
      console.warn('[SEABRIS] Tabel devices kosong. Jalankan tahap-a.sql di Supabase SQL Editor.');
    }

    if (logRes.error) {
      console.warn('[SEABRIS] Gagal memuat sensor_logs:', logRes.error.message);
    } else if (logRes.data) {
      this.logs = (logRes.data as SensorLogRow[]).map(rowToLog);
    }

    if (privRes) {
      const [repRes, scanRes, notifRes, setRes] = privRes;
      if (repRes.error) console.warn('[SEABRIS] Gagal memuat waste_reports:', repRes.error.message);
      else this.reports = (repRes.data as ReportRow[]).map(rowToReport);

      if (scanRes.error) console.warn('[SEABRIS] Gagal memuat waste_scans:', scanRes.error.message);
      else this.scans = (scanRes.data as ScanRow[]).map(rowToScan);

      if (notifRes.error) console.warn('[SEABRIS] Gagal memuat notifications:', notifRes.error.message);
      else this.notifications = (notifRes.data as NotificationRow[]).map(rowToNotification);

      if (setRes.error) console.warn('[SEABRIS] Gagal memuat system_settings:', setRes.error.message);
      else if (setRes.data) this.settings = rowToSettings(setRes.data as SettingsRow);
    }

    this.hydrated = true;
    this.notify();
  }

  /** Perubahan dari perangkat lain langsung ikut tampil. */
  private subscribeRealtime(): void {
    const ch = supabase.channel('seabris-iot');
    ['devices', 'sensor_logs', 'waste_reports', 'waste_scans', 'notifications', 'system_settings'].forEach((table) => {
      ch.on('postgres_changes', { event: '*', schema: 'public', table }, () => this.scheduleReload());
    });
    ch.subscribe();
  }

  private scheduleReload(): void {
    if (this.reloadTimer) clearTimeout(this.reloadTimer);
    this.reloadTimer = setTimeout(() => void this.loadRemote(), 400);
  }

  /** Dipakai setelah operasi tulis gagal: kembalikan tampilan ke kondisi server. */
  private failAndResync(what: string, message?: string): void {
    console.warn(`[SEABRIS] ${what} tidak tersimpan ke server (cek login petugas/admin & aturan RLS):`, message ?? 'ditolak');
    this.scheduleReload();
  }

  // ---------- Subscribe ----------
  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify(): void {
    this.listeners.forEach((cb) => cb());
  }

  // ---------- Persist: device & log ----------
  private async persistDevice(d: Device): Promise<void> {
    const { data, error } = await supabase
      .from('devices')
      .update({
        capacity_percentage: d.capacityPercentage,
        battery_level: d.batteryLevel,
        status: d.status,
        estimated_weight_kg: d.estimatedWeightKg,
        updated_at: new Date().toISOString(),
      })
      .eq('id', d.id)
      .select('id');
    if (error || !data || data.length === 0) this.failAndResync('Perubahan device', error?.message);
  }

  private async persistLog(l: SensorLog): Promise<void> {
    const { error } = await supabase.from('sensor_logs').insert({
      id: l.id,
      device_id: l.deviceId,
      device_code: l.deviceCode,
      device_name: l.deviceName,
      logged_at: new Date().toISOString(),
      capacity_percentage: l.capacityPercentage,
      status: l.status,
      battery_level: l.batteryLevel,
    });
    if (error) this.failAndResync('Log sensor', error.message);
  }

  private async persistNotification(n: AppNotification): Promise<void> {
    const { error } = await supabase.from('notifications').insert({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      is_read: n.read,
      device_id: n.deviceId ?? null,
      device_code: n.deviceCode ?? null,
      report_id: n.reportId ?? null,
      created_at: new Date().toISOString(),
    });
    if (error) this.failAndResync('Notifikasi', error.message);
  }

  // Device methods
  public getDevices(): Device[] {
    return [...this.devices];
  }

  public getDeviceById(id: string): Device | undefined {
    return this.devices.find((d) => d.id === id || d.code === id);
  }

  /**
   * Update device capacity via physical sensor reading or IoT slider simulation
   */
  public updateDeviceCapacity(deviceId: string, newPercentage: number): Device {
    const clamped = Math.max(0, Math.min(100, Math.round(newPercentage)));
    const { dateStr, timeStr, fullTimeStr } = jakartaNow();

    let updatedDev: Device | undefined;

    this.devices = this.devices.map((dev) => {
      if (dev.id === deviceId || dev.code === deviceId) {
        let status = dev.status;
        if (clamped >= this.settings.criticalThreshold) {
          status = 'critical';
        } else if (clamped >= this.settings.warningThreshold) {
          status = 'warning';
        } else {
          status = 'online';
        }

        // Prototype 50L basket with 25kg max payload limit
        const estKg = Number(((clamped / 100) * 25).toFixed(1));

        updatedDev = {
          ...dev,
          capacityPercentage: clamped,
          status,
          estimatedWeightKg: estKg,
          lastUpdated: `Baru saja (${timeStr} WIB)`,
        };
        return updatedDev;
      }
      return dev;
    });

    if (updatedDev) {
      void this.persistDevice(updatedDev);

      // Add a sensor log entry
      const newLog: SensorLog = {
        id: newLogId(),
        deviceId: updatedDev.id,
        deviceCode: updatedDev.code,
        deviceName: updatedDev.locationName.split(',')[0],
        timestamp: fullTimeStr,
        date: dateStr,
        time: timeStr,
        capacityPercentage: clamped,
        status: getCapacityCategory(clamped),
        batteryLevel: updatedDev.batteryLevel,
      };

      this.logs = [newLog, ...this.logs.slice(0, 49)];
      void this.persistLog(newLog);

      // Trigger alerts if thresholds crossed
      if (clamped >= this.settings.criticalThreshold) {
        this.addNotification({
          id: 'notif-' + Date.now(),
          title: `Kapasitas Kritis: ${updatedDev.code} (${clamped}%)`,
          message: `Keranjang ${updatedDev.name} di ${updatedDev.locationName} sudah terisi ${clamped}%. Segera lakukan pengosongan!`,
          type: 'critical',
          timestamp: 'Baru saja',
          read: false,
          deviceId: updatedDev.id,
          deviceCode: updatedDev.code,
        });
      } else if (clamped >= this.settings.warningThreshold) {
        this.addNotification({
          id: 'notif-' + Date.now(),
          title: `Peringatan Kapasitas: ${updatedDev.code} (${clamped}%)`,
          message: `Keranjang ${updatedDev.name} mencapai ${clamped}%. Persiapkan armada tim pembersih.`,
          type: 'warning',
          timestamp: 'Baru saja',
          read: false,
          deviceId: updatedDev.id,
          deviceCode: updatedDev.code,
        });
      }

      this.notify();
      return updatedDev;
    }

    throw new Error(`Device with ID ${deviceId} not found`);
  }

  /**
   * Reset / kosongkan keranjang perangkap sampah ke 0% (Aksi Cepat Petugas Lapangan)
   */
  public resetDeviceCapacity(deviceId: string, operatorName?: string): Device {
    const updated = this.updateDeviceCapacity(deviceId, 0);
    this.addNotification({
      id: 'notif-' + Date.now(),
      title: `Perangkap Dikosongkan: ${updated.code}`,
      message: `Keranjang sampah ${updated.name} telah berhasil dikosongkan (0%) oleh ${operatorName || 'Petugas Lapangan'}. Status operasional normal kembali.`,
      type: 'success',
      timestamp: 'Baru saja',
      read: false,
      deviceId: updated.id,
      deviceCode: updated.code,
    });
    return updated;
  }

  /**
   * Laporkan kendala teknis atau fisik di lapangan (Aksi Cepat Petugas Lapangan)
   */
  public reportFieldIssue(deviceId: string, issueType: string, notes: string, operatorName?: string): void {
    const dev = this.getDeviceById(deviceId);
    this.addNotification({
      id: 'notif-' + Date.now(),
      title: `Kendala Lapangan: ${dev ? dev.code : 'SEABRIS-01'} - ${issueType}`,
      message: `Laporan ${operatorName || 'Petugas Lapangan'}: ${notes || issueType}. Tim teknis segera menindaklanjuti.`,
      type: 'warning',
      timestamp: 'Baru saja',
      read: false,
      deviceId: dev?.id,
      deviceCode: dev?.code,
    });
    this.notify();
  }

  // Sensor Logs
  public getLogs(): SensorLog[] {
    return [...this.logs];
  }

  public addSensorLog(logData: {
    deviceId: string;
    deviceCode?: string;
    fillPercentage: number;
    waterLevel?: number;
    currentSpeed?: number;
    batteryLevel?: number;
    status?: 'normal' | 'warning' | 'critical';
  }): SensorLog {
    const { dateStr, timeStr, fullTimeStr } = jakartaNow();
    const dev = this.getDeviceById(logData.deviceId);

    const newLog: SensorLog = {
      id: newLogId(),
      deviceId: logData.deviceId,
      deviceCode: logData.deviceCode || dev?.code || 'SEABRIS-01',
      deviceName: dev?.locationName ? dev.locationName.split(',')[0] : 'Muara Angke',
      timestamp: fullTimeStr,
      date: dateStr,
      time: timeStr,
      capacityPercentage: Math.max(0, Math.min(100, Math.round(logData.fillPercentage))),
      status: getCapacityCategory(logData.fillPercentage),
      batteryLevel: logData.batteryLevel ?? dev?.batteryLevel ?? 94,
    };

    this.logs = [newLog, ...this.logs.slice(0, 49)];
    void this.persistLog(newLog);
    this.notify();
    return newLog;
  }

  // Waste Reports
  public getReports(): WasteReport[] {
    return [...this.reports];
  }

  /**
   * Kirim laporan warga ke server. Mengembalikan saved=false jika gagal
   * (misalnya tidak ada koneksi), supaya UI tidak berpura-pura berhasil.
   * Notifikasi untuk petugas dibuat otomatis oleh trigger database.
   */
  public async submitReport(
    newReportData: Omit<WasteReport, 'id' | 'ticketNumber' | 'date' | 'status'>
  ): Promise<{ report: WasteReport; saved: boolean }> {
    const ticket = newTicket('REP');
    const report: WasteReport = {
      ...newReportData,
      id: newId('rep'),
      ticketNumber: ticket,
      date: jakartaNow().dateStr,
      status: 'Menunggu Verifikasi',
    };

    const photoUrl = await uploadPhoto(report.photoUrl, 'reports', ticket);
    const toSave: WasteReport = { ...report, photoUrl };

    const { error } = await supabase.from('waste_reports').insert(reportToRow(toSave));
    if (error) {
      console.warn('[SEABRIS] Laporan gagal dikirim:', error.message);
      if (photoUrl) void removePhotos([photoUrl]);
      return { report, saved: false };
    }

    this.reports = [toSave, ...this.reports];
    this.notify();
    return { report: toSave, saved: true };
  }

  public updateReportStatus(reportId: string, status: ReportStatus, assignedTeam?: string): void {
    const target = this.reports.find((r) => r.id === reportId || r.ticketNumber === reportId);
    if (!target) return;
    const verifiedIso = status !== 'Menunggu Verifikasi' ? new Date().toISOString() : null;
    const team = assignedTeam || target.assignedTeam;

    this.reports = this.reports.map((r) =>
      r.id === target.id
        ? { ...r, status, assignedTeam: team, verifiedAt: wibStamp(verifiedIso) }
        : r
    );
    this.notify();

    void (async () => {
      const { data, error } = await supabase
        .from('waste_reports')
        .update({ status, assigned_team: team ?? null, verified_at: verifiedIso })
        .eq('id', target.id)
        .select('id');
      if (error || !data || data.length === 0) this.failAndResync('Status laporan', error?.message);
    })();
  }

  public deleteReport(reportId: string): void {
    const target = this.reports.find((r) => r.id === reportId || r.ticketNumber === reportId);
    if (!target) return;
    this.reports = this.reports.filter((r) => r.id !== target.id);
    this.notify();

    void (async () => {
      // notifikasi yang menunjuk ke laporan ini dihapus dulu (menghindari konflik foreign key)
      await supabase.from('notifications').delete().eq('report_id', target.id);
      const { data, error } = await supabase.from('waste_reports').delete().eq('id', target.id).select('id');
      if (error || !data || data.length === 0) {
        this.failAndResync('Penghapusan laporan', error?.message);
        return;
      }
      void removePhotos([target.photoUrl]);
    })();
  }

  // AI Waste Scanner Methods
  public getScans(): WasteScanResult[] {
    return [...this.scans];
  }

  public getScanById(id: string): WasteScanResult | undefined {
    return this.scans.find((s) => s.id === id || s.ticketCode === id);
  }

  /**
   * Simpan hasil scan ke server. saved=false jika gagal.
   * Tiket dari halaman scanner dipertahankan; kalau bentrok, dibuatkan tiket baru.
   */
  public async submitScan(
    scanData: Omit<WasteScanResult, 'id' | 'ticketCode' | 'date' | 'time' | 'scannedAt' | 'verificationStatus'>
  ): Promise<{ scan: WasteScanResult; saved: boolean }> {
    const { dateStr, timeStr } = jakartaNow();
    const providedTicket = (scanData as { ticketCode?: string }).ticketCode;
    let ticket = providedTicket && /^SCAN-/.test(providedTicket) ? providedTicket : newTicket('SCAN');

    const build = (t: string, img: string): WasteScanResult => ({
      ...scanData,
      id: newId('scan'),
      ticketCode: t,
      imageUrl: img,
      scannedAt: `${dateStr} ${timeStr}:00`,
      date: dateStr,
      time: timeStr,
      verificationStatus: 'Belum Diverifikasi',
    });

    const imageUrl = await uploadPhoto(scanData.imageUrl, 'scans', ticket);
    let newScan = build(ticket, imageUrl);

    let { error } = await supabase.from('waste_scans').insert(scanToRow(newScan, imageUrl));
    if (error && error.code === '23505') {
      // nomor tiket bentrok -> buat baru dan coba sekali lagi
      ticket = newTicket('SCAN');
      newScan = build(ticket, imageUrl);
      ({ error } = await supabase.from('waste_scans').insert(scanToRow(newScan, imageUrl)));
    }
    if (error) {
      console.warn('[SEABRIS] Hasil scan gagal disimpan:', error.message);
      if (imageUrl) void removePhotos([imageUrl]);
      return { scan: build(ticket, scanData.imageUrl), saved: false };
    }

    this.scans = [newScan, ...this.scans];
    this.notify();
    return { scan: newScan, saved: true };
  }

  /** @deprecated Pakai submitScan (async). Dipertahankan agar file lama (backup) tetap bisa dikompilasi. */
  public addScan(
    scanData: Omit<WasteScanResult, 'id' | 'ticketCode' | 'date' | 'time' | 'scannedAt' | 'verificationStatus'>
  ): void {
    void this.submitScan(scanData);
  }

  public updateScanVerification(
    id: string,
    status: 'Belum Diverifikasi' | 'Terverifikasi Petugas' | 'Perlu Koreksi',
    verifiedBy: string = 'Petugas Patroli Teluk Jakarta',
    notes?: string
  ): void {
    const target = this.scans.find((s) => s.id === id || s.ticketCode === id);
    if (!target) return;
    const verifiedIso = new Date().toISOString();
    const newNotes = notes !== undefined ? notes : target.notes;

    this.scans = this.scans.map((s) =>
      s.id === target.id
        ? { ...s, verificationStatus: status, verifiedBy, verifiedAt: wibStamp(verifiedIso), notes: newNotes }
        : s
    );
    this.notify();

    void (async () => {
      const { data, error } = await supabase
        .from('waste_scans')
        .update({
          verification_status: status,
          verified_by: verifiedBy,
          verified_at: verifiedIso,
          notes: newNotes ?? null,
        })
        .eq('id', target.id)
        .select('id');
      if (error || !data || data.length === 0) this.failAndResync('Verifikasi scan', error?.message);
    })();
  }

  private deleteScansByIds(ids: string[], photoUrls: string[]): void {
    void (async () => {
      const { data, error } = await supabase.from('waste_scans').delete().in('id', ids).select('id');
      if (error || !data || data.length === 0) {
        this.failAndResync('Penghapusan scan', error?.message);
        return;
      }
      void removePhotos(photoUrls);
    })();
  }

  public deleteScan(id: string): void {
    const target = this.scans.find((s) => s.id === id || s.ticketCode === id);
    if (!target) return;
    this.scans = this.scans.filter((s) => s.id !== target.id);
    this.notify();
    this.deleteScansByIds([target.id], [target.imageUrl]);
  }

  public deleteMultipleScans(ids: string[]): void {
    const set = new Set(ids);
    const targets = this.scans.filter((s) => set.has(s.id) || set.has(s.ticketCode));
    if (targets.length === 0) return;
    this.scans = this.scans.filter((s) => !targets.includes(s));
    this.notify();
    this.deleteScansByIds(targets.map((s) => s.id), targets.map((s) => s.imageUrl));
  }

  public deleteAllScans(): void {
    const targets = [...this.scans];
    if (targets.length === 0) return;
    this.scans = [];
    this.notify();
    this.deleteScansByIds(targets.map((s) => s.id), targets.map((s) => s.imageUrl));
  }

  public getWasteStatistics() {
    const totalScans = this.scans.length;
    let plasticCount = 0;
    let nonPlasticCount = 0;
    let unverifiedCount = 0;
    let verifiedCount = 0;
    const categoryDistribution: Record<string, number> = {
      'Plastik': 0,
      'Logam': 0,
      'Kaca': 0,
      'Kertas dan Karton': 0,
      'Sampah Organik': 0,
      'Karet': 0,
      'Tekstil': 0,
      'Alat Tangkap Perikanan': 0,
      'Sampah Campuran': 0,
      'Tidak Teridentifikasi': 0,
    };

    const dateMap: Record<string, { plastic: number; nonPlastic: number }> = {};

    this.scans.forEach((scan) => {
      const cat = scan.primaryCategory || 'Tidak Teridentifikasi';
      if (categoryDistribution[cat] !== undefined) {
        categoryDistribution[cat] += 1;
      } else {
        categoryDistribution[cat] = 1;
      }

      const isPlastic = cat === 'Plastik' || cat === 'Alat Tangkap Perikanan';
      if (isPlastic) {
        plasticCount++;
      } else {
        nonPlasticCount++;
      }

      if (scan.verificationStatus === 'Belum Diverifikasi') {
        unverifiedCount++;
      } else {
        verifiedCount++;
      }

      // Group by date
      const d = scan.date || '2026-10-27';
      if (!dateMap[d]) {
        dateMap[d] = { plastic: 0, nonPlastic: 0 };
      }
      if (isPlastic) {
        dateMap[d].plastic += 1;
      } else {
        dateMap[d].nonPlastic += 1;
      }
    });

    const recentDailyTrend = Object.keys(dateMap)
      .sort()
      .slice(-7)
      .map((date) => ({
        date,
        plastic: dateMap[date].plastic,
        nonPlastic: dateMap[date].nonPlastic,
        total: dateMap[date].plastic + dateMap[date].nonPlastic,
      }));

    return {
      totalScans,
      plasticCount,
      nonPlasticCount,
      unverifiedCount,
      verifiedCount,
      categoryDistribution,
      recentDailyTrend,
    };
  }

  // Notifications
  public getNotifications(): AppNotification[] {
    return [...this.notifications];
  }

  /**
   * Tambah notifikasi. persist=false dipakai bila notifikasi itu sudah dibuat
   * oleh trigger database (laporan & scan dari warga).
   */
  public addNotification(notification: AppNotification, persist: boolean = true): void {
    const n: AppNotification = { ...notification, id: newId('notif') };
    this.notifications = [n, ...this.notifications.slice(0, 39)];
    if (persist) void this.persistNotification(n);
    this.notify();
  }

  public markNotificationRead(id: string): void {
    this.notifications = this.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    this.notify();
    void (async () => {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      if (error) this.failAndResync('Status notifikasi', error.message);
    })();
  }

  public markAllNotificationsRead(): void {
    this.notifications = this.notifications.map((n) => ({ ...n, read: true }));
    this.notify();
    void (async () => {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
      if (error) this.failAndResync('Status notifikasi', error.message);
    })();
  }

  // Settings
  public getSettings(): SystemSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<SystemSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.notify();
    void (async () => {
      const { error } = await supabase.from('system_settings').upsert(settingsToRow(this.settings));
      if (error) this.failAndResync('Pengaturan sistem', error.message);
    })();
  }

  /** Dipertahankan agar kompatibel: sekarang hanya memuat ulang semua data dari server. */
  public resetToDefault(): void {
    void this.loadRemote();
  }
}

// Singleton instance
export const iotService = new IotService();