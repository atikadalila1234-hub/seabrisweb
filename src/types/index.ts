/**
 * SEABRIS — Smart Marine Debris Management System
 * Data models and TypeScript definitions
 */

export type DeviceStatus = 'online' | 'warning' | 'critical' | 'offline';

export type CapacityCategory = 'Kosong' | 'Terisi' | 'Hampir Penuh' | 'Penuh';

export interface Device {
  id: string;
  code: string; // e.g. SEABRIS-01
  name: string;
  locationName: string;
  subDistrict: string;
  coordinates: [number, number]; // [lat, lng]
  capacityPercentage: number; // 0 - 100
  batteryLevel: number; // 0 - 100
  solarCharging: boolean;
  status: DeviceStatus;
  lastUpdated: string;
  waterFlowSpeed: number; // m/s
  basketVolumeLiters: number;
  estimatedWeightKg: number;
  hardwareModel: string;
  sensorType: string;
  isSimulated: boolean;
}

export interface SensorLog {
  id: string;
  deviceId: string;
  deviceCode: string;
  deviceName: string;
  timestamp: string;
  date: string;
  time: string;
  capacityPercentage: number;
  status: CapacityCategory;
  batteryLevel: number;
}

export type WasteCategory = 
  | 'Botol Plastik PET'
  | 'Kantong Kresek & Film Plastik'
  | 'Kemasan Sachet & Kemasan Multi-lapis'
  | 'Styrofoam / Busa Kemasan'
  | 'Jaring & Tali Nelayan'
  | 'Residu & Sampah Campuran';

export type ReportStatus = 'Menunggu Verifikasi' | 'Diproses' | 'Selesai';

export interface WasteReport {
  id: string;
  ticketNumber: string;
  reporterName: string;
  locationName: string;
  coordinates: [number, number] | null;
  photoUrl: string;
  wasteType: WasteCategory;
  description: string;
  date: string;
  status: ReportStatus;
  estimatedVolume?: string;
  assignedTeam?: string;
  verifiedAt?: string;
}

export type NotificationType = 'warning' | 'critical' | 'info' | 'success';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: string;
  read: boolean;
  deviceId?: string;
  deviceCode?: string;
  reportId?: string;
}

export type MainWasteCategory = 
  | 'Plastik'
  | 'Logam'
  | 'Kaca'
  | 'Kertas dan Karton'
  | 'Sampah Organik'
  | 'Karet'
  | 'Tekstil'
  | 'Alat Tangkap Perikanan'
  | 'Sampah Campuran'
  | 'Tidak Teridentifikasi';

export type BiodegradationCategory = 
  | 'Berpotensi Terurai Secara Biologis'
  | 'Sulit Terurai Secara Biologis'
  | 'Tidak Terurai Secara Biologis, tetapi Mengalami Perubahan Fisik/Kimia'
  | 'Perlu Identifikasi Material Lebih Lanjut';

export type RecommendationCategory = 
  | 'Daur Ulang'
  | 'Pengolahan Organik'
  | 'Pengelolaan Khusus'
  | 'Residu'
  | 'Perlu Verifikasi Petugas';

export interface DetectedWasteObject {
  name: string;
  category: string;
  predictedMaterial: string;
  materialCertainty: string; // e.g. "Perkiraan Material — Perlu Verifikasi"
  count?: number;
  confidenceScore?: number;
  verificationNeeded?: boolean;
}

export interface WasteScanResult {
  id: string;
  ticketCode: string;
  imageUrl: string;
  scannedAt: string;
  date: string;
  time: string;
  detectedObjects: DetectedWasteObject[];
  primaryCategory: string;
  primaryMaterial: string;
  biodegradationCategory: string;
  biodegradationExplanation: string;
  environmentalRisks: string[];
  recyclingPotential: string;
  handlingRecommendation: string;
  recommendationCategory: string;
  verificationStatus: 'Belum Diverifikasi' | 'Terverifikasi Petugas' | 'Perlu Koreksi';
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
  isDemo?: boolean;
  source?: string;
  reportedAsWasteTicket?: string;
}

export interface SystemSettings {
  warningThreshold: number; // default 80
  criticalThreshold: number; // default 90
  telemetryIntervalSeconds: number; // default 30
  autoAlertSound: boolean;
  esp32EndpointUrl: string;
  apiMode: 'simulation' | 'hybrid' | 'live_esp32';
}

// ==========================================
// AUTENTIKASI & HAK AKSES PENGGUNA (RBAC)
// ==========================================
export type UserRole = 'admin' | 'operator' | 'public';

export interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface AuthUser extends User {
  title?: string;
  agency?: string;
  lastLogin?: string;
}

// ==========================================
// DATA OSEANOGRAFI MUARA ANGKE (TELUK JAKARTA)
// ==========================================

export type TideConditionStatus = 
  | 'Pasang (Menuju Puncak)' 
  | 'Surut (Menuju Terendah)' 
  | 'Puncak Pasang Tertinggi (HW)' 
  | 'Puncak Surut Terendah (LW)';

export interface TideRecord {
  id: string;
  timestamp: string; // ISO date string or 'YYYY-MM-DD HH:mm'
  date: string; // 'YYYY-MM-DD'
  time: string; // 'HH:mm'
  waterLevelM: number; // Ketinggian muka air laut dalam satuan meter (m)
  conditionStatus: TideConditionStatus;
  trend: 'rising' | 'falling' | 'peak' | 'trough';
  deviationMsl: number; // Deviasi dari Mean Sea Level (m)
  isHighestHighWater?: boolean; // Penanda Pasang Tertinggi
  isLowestLowWater?: boolean; // Penanda Surut Terendah
  notes?: string;
}

export interface OceanCurrentRecord {
  id: string;
  timestamp: string;
  date: string;
  time: string;
  speedMps: number; // Kecepatan arus laut dalam m/s
  directionDegrees: number; // Arah pergerakan arus laut dalam derajat (0 - 360°)
  directionCardinal: string; // Contoh: 'TL (Timur Laut)', 'S (Selatan)'
  currentStatus: 'Tenang' | 'Sedang' | 'Kuat';
  depthMeters?: number; // Kedalaman pengukuran sensor (m)
  notes?: string;
}

export interface OceanographyStationInfo {
  stationId: string;
  stationName: string;
  locationName: string;
  subDistrict: string;
  coordinates: [number, number]; // [lat, lng]
  elevationDatum: string; // e.g. "Mean Sea Level (MSL) / Chart Datum (CD)"
  tideType: string; // e.g. "Campuran Condong Harian Ganda (Mixed Prevailing Semi-Diurnal)"
  lastUpdated: string;
  linkedDeviceId?: string; // e.g. 'dev-01' (SEABRIS-01 Muara Angke)
  isLiveApiConnected: boolean;
  dataSourceInfo: string;
}

export interface LandingCmsContent {
  // Hero section
  heroTagline: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroImage: string;
  heroImageBadge: string;
  heroImageTitle: string;
  heroImageSubtitle: string;

  // Feature Section 1: Hardware & Sensor
  sensorTagline: string;
  sensorTitle: string;
  sensorDescription: string;
  sensorImage: string;
  sensorImageAlt: string;

  // Feature Section 2: Coastal Action & Community
  actionTagline: string;
  actionTitle: string;
  actionDescription: string;
  actionImage: string;
  actionImageAlt: string;

  // Urgensi / Banner Section
  urgencyTagline: string;
  urgencyTitle: string;
  urgencyDescription: string;

  lastUpdated?: string;
  updatedBy?: string;
}

