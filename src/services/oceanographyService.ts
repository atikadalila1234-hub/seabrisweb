import { 
  TideRecord, 
  OceanCurrentRecord, 
  OceanographyStationInfo,
  TideConditionStatus 
} from '../types';

/**
 * SEABRIS - Oceanography Service for Muara Angke, Jakarta Bay
 * Memisahkan pengolahan data pasang surut (water elevation) dan arus laut (velocity & direction)
 * guna menjamin presisi parameter oseanografi pesisir.
 */

export const MUARA_ANGKE_STATION_INFO: OceanographyStationInfo = {
  stationId: 'STA-MA-01',
  stationName: 'Stasiun Pantau Oseanografi Muara Angke',
  locationName: 'Pesisir Muara Angke (Kanal Muara Karang)',
  subDistrict: 'Penjaringan, Jakarta Utara',
  coordinates: [-6.1085, 106.7725],
  elevationDatum: 'Mean Sea Level (MSL) / Chart Datum (CD)',
  tideType: 'Campuran Condong Harian Ganda (Mixed Prevailing Semi-Diurnal)',
  lastUpdated: 'Baru saja (Pencatatan Telemetri Aktif)',
  linkedDeviceId: 'dev-01', // Unit Perintis SEABRIS-01 Muara Angke
  isLiveApiConnected: false, // Menunjukkan struktur integrasi API siap pakai
  dataSourceInfo: 'Arsip Telemetri Stasioner Muara Angke & Model Hidrodinamika Teluk Jakarta (Struktur Integrasi API Siap Terhubung)',
};

// Helper cardinal direction from degrees (0 - 360°)
export function getCardinalDirection(degrees: number): string {
  const normalized = ((degrees % 360) + 360) % 360;
  if (normalized >= 337.5 || normalized < 22.5) return 'Utara (U · 0°)';
  if (normalized >= 22.5 && normalized < 67.5) return 'Timur Laut (TL · 45°)';
  if (normalized >= 67.5 && normalized < 112.5) return 'Timur (T · 90°)';
  if (normalized >= 112.5 && normalized < 157.5) return 'Tenggara (TG · 135°)';
  if (normalized >= 157.5 && normalized < 202.5) return 'Selatan (S · 180°)';
  if (normalized >= 202.5 && normalized < 247.5) return 'Barat Daya (BD · 225°)';
  if (normalized >= 247.5 && normalized < 292.5) return 'Barat (B · 270°)';
  return 'Barat Laut (BL · 315°)';
}

export function getShortCardinalDirection(degrees: number): string {
  const normalized = ((degrees % 360) + 360) % 360;
  if (normalized >= 337.5 || normalized < 22.5) return 'U';
  if (normalized >= 22.5 && normalized < 67.5) return 'TL';
  if (normalized >= 67.5 && normalized < 112.5) return 'T';
  if (normalized >= 112.5 && normalized < 157.5) return 'TG';
  if (normalized >= 157.5 && normalized < 202.5) return 'S';
  if (normalized >= 202.5 && normalized < 247.5) return 'BD';
  if (normalized >= 247.5 && normalized < 292.5) return 'B';
  return 'BL';
}

// Generate realistic 24-hourly series for Teluk Jakarta (Muara Angke)
function generateHistoricalTidesAndCurrents() {
  const dates = ['2026-10-31', '2026-10-30', '2026-10-29', '2026-10-28', '2026-10-27'];
  const tides: TideRecord[] = [];
  const currents: OceanCurrentRecord[] = [];

  // MSL reference for Teluk Jakarta is ~0.80 m
  const MSL = 0.80;

  dates.forEach((date, dIndex) => {
    // Generate 24 hourly points per date (00:00 to 23:00)
    for (let h = 0; h < 24; h++) {
      const timeStr = `${h.toString().padStart(2, '0')}:00`;
      const timestamp = `${date} ${timeStr}`;

      // Teluk Jakarta: semi-diurnal mixed curve
      // Phase shifts slightly per day (+50 mins tidal lag daily)
      const dayLag = dIndex * 0.45;
      const tHour = h + dayLag;

      // Two sinusoidal components (M2 tide ~12.42h period and K1 diurnal component ~24h period)
      const m2 = Math.sin((tHour * 2 * Math.PI) / 12.42);
      const k1 = 0.45 * Math.sin(((tHour + 3) * 2 * Math.PI) / 24);

      // Water level in meters (ranges from approx 0.30m to 1.62m)
      const rawLevel = MSL + 0.55 * m2 + k1;
      const waterLevel = Math.round(rawLevel * 100) / 100;
      const deviationMsl = Math.round((waterLevel - MSL) * 100) / 100;

      // Determine tide status
      // Look at slope
      const nextM2 = Math.sin(((tHour + 0.5) * 2 * Math.PI) / 12.42);
      const nextK1 = 0.45 * Math.sin(((tHour + 3.5) * 2 * Math.PI) / 24);
      const nextLevel = MSL + 0.55 * nextM2 + nextK1;
      const diff = nextLevel - rawLevel;

      let conditionStatus: TideConditionStatus = 'Pasang (Menuju Puncak)';
      let trend: 'rising' | 'falling' | 'peak' | 'trough' = 'rising';

      if (Math.abs(diff) < 0.02) {
        if (rawLevel > MSL) {
          conditionStatus = 'Puncak Pasang Tertinggi (HW)';
          trend = 'peak';
        } else {
          conditionStatus = 'Puncak Surut Terendah (LW)';
          trend = 'trough';
        }
      } else if (diff > 0) {
        conditionStatus = 'Pasang (Menuju Puncak)';
        trend = 'rising';
      } else {
        conditionStatus = 'Surut (Menuju Terendah)';
        trend = 'falling';
      }

      tides.push({
        id: `tide-${date}-${h}`,
        timestamp,
        date,
        time: timeStr,
        waterLevelM: waterLevel,
        conditionStatus,
        trend,
        deviationMsl,
        notes: `Pengamatan sensor stasioner Kanal Muara Angke (Elevasi ${waterLevel >= MSL ? '+' : ''}${deviationMsl} m MSL)`,
      });

      // ----------------------------------------
      // CURRENT DATA (Arus Laut)
      // Hydrodynamic interaction: 
      // When rising tide (flood), water rushes inland/south (150° - 185°)
      // When falling tide (ebb), river runoff + ebb flushes out to north (340° - 040°)
      // Near peaks/slack water, speed is lower.
      // ----------------------------------------
      const isRising = diff > 0;
      let baseSpeed = Math.abs(diff) * 4.5 + 0.20; // 0.20 to ~0.95 m/s
      // Slightly higher during mid-ebb
      if (!isRising) baseSpeed *= 1.15;
      const currentSpeed = Math.round(Math.min(1.25, Math.max(0.12, baseSpeed)) * 100) / 100;

      // Direction: during flood ~165° (Selatan/Tenggara), during ebb ~355°/15° (Utara/Timur Laut)
      let dirDegrees = isRising ? 165 + Math.round(Math.sin(h) * 18) : 25 + Math.round(Math.cos(h) * 20);
      dirDegrees = ((dirDegrees % 360) + 360) % 360;

      const cardinal = getCardinalDirection(dirDegrees);
      const currentStatus: 'Tenang' | 'Sedang' | 'Kuat' = 
        currentSpeed < 0.35 ? 'Tenang' : currentSpeed <= 0.85 ? 'Sedang' : 'Kuat';

      currents.push({
        id: `curr-${date}-${h}`,
        timestamp,
        date,
        time: timeStr,
        speedMps: currentSpeed,
        directionDegrees: dirDegrees,
        directionCardinal: cardinal,
        currentStatus,
        depthMeters: 1.5,
        notes: isRising 
          ? 'Arus pasang masuk (Flood current) mendorong sampah ke barrier' 
          : 'Arus surut keluar (Ebb runoff) mengalir menuju perairan lepas Teluk Jakarta',
      });
    }
  });

  // Mark extremes per date
  dates.forEach((date) => {
    const dayTides = tides.filter((t) => t.date === date);
    if (dayTides.length > 0) {
      let maxTide = dayTides[0];
      let minTide = dayTides[0];
      dayTides.forEach((t) => {
        if (t.waterLevelM > maxTide.waterLevelM) maxTide = t;
        if (t.waterLevelM < minTide.waterLevelM) minTide = t;
      });
      maxTide.isHighestHighWater = true;
      minTide.isLowestLowWater = true;
    }
  });

  return { tides, currents };
}

const { tides: INITIAL_TIDES, currents: INITIAL_CURRENTS } = generateHistoricalTidesAndCurrents();

class OceanographyService {
  private tides: TideRecord[] = [...INITIAL_TIDES];
  private currents: OceanCurrentRecord[] = [...INITIAL_CURRENTS];
  private stationInfo: OceanographyStationInfo = { ...MUARA_ANGKE_STATION_INFO };

  // ==========================================
  // PENGOLAHAN DATA PASANG SURUT (TIDES)
  // ==========================================
  public getTideRecords(filter?: { date?: string; rangeDays?: number }): TideRecord[] {
    if (filter?.date && filter.date !== 'all') {
      return this.tides.filter((t) => t.date === filter.date);
    }
    if (filter?.rangeDays) {
      const dates = this.getAvailableDates().slice(0, filter.rangeDays);
      return this.tides.filter((t) => dates.includes(t.date));
    }
    // Default: Hari ini (tanggal terbaru)
    const latestDate = this.getAvailableDates()[0];
    return this.tides.filter((t) => t.date === latestDate);
  }

  public getLatestTide(): TideRecord {
    // Return record closest to current hour of latest date
    const today = this.getAvailableDates()[0];
    const todayRecords = this.tides.filter((t) => t.date === today);
    const currentHour = new Date().getHours();
    const match = todayRecords.find((r) => parseInt(r.time.split(':')[0], 10) === currentHour);
    return match || todayRecords[todayRecords.length - 1] || this.tides[0];
  }

  public getTideExtremes(records: TideRecord[]) {
    if (records.length === 0) {
      return {
        highest: null,
        lowest: null,
        rangeMeters: 0,
      };
    }
    let highest = records[0];
    let lowest = records[0];

    records.forEach((r) => {
      if (r.waterLevelM > highest.waterLevelM) highest = r;
      if (r.waterLevelM < lowest.waterLevelM) lowest = r;
    });

    const rangeMeters = Math.round((highest.waterLevelM - lowest.waterLevelM) * 100) / 100;
    return { highest, lowest, rangeMeters };
  }

  // ==========================================
  // PENGOLAHAN DATA ARUS LAUT (OCEAN CURRENTS)
  // ==========================================
  public getOceanCurrentRecords(filter?: { date?: string; rangeDays?: number }): OceanCurrentRecord[] {
    if (filter?.date && filter.date !== 'all') {
      return this.currents.filter((c) => c.date === filter.date);
    }
    if (filter?.rangeDays) {
      const dates = this.getAvailableDates().slice(0, filter.rangeDays);
      return this.currents.filter((c) => dates.includes(c.date));
    }
    // Default: Hari ini
    const latestDate = this.getAvailableDates()[0];
    return this.currents.filter((c) => c.date === latestDate);
  }

  public getLatestCurrent(): OceanCurrentRecord {
    const today = this.getAvailableDates()[0];
    const todayRecords = this.currents.filter((c) => c.date === today);
    const currentHour = new Date().getHours();
    const match = todayRecords.find((r) => parseInt(r.time.split(':')[0], 10) === currentHour);
    return match || todayRecords[todayRecords.length - 1] || this.currents[0];
  }

  public getCurrentStatistics(records: OceanCurrentRecord[]) {
    if (records.length === 0) {
      return {
        maxSpeed: 0,
        maxSpeedRecord: null as OceanCurrentRecord | null,
        minSpeed: 0,
        minSpeedRecord: null as OceanCurrentRecord | null,
        avgSpeed: 0,
        dominantDirectionDegrees: 0,
        dominantDirectionCardinal: 'Data Belum Tersedia',
      };
    }

    let maxRecord = records[0];
    let minRecord = records[0];
    let totalSpeed = 0;

    // Vector components to calculate resultant average direction
    let sumSin = 0;
    let sumCos = 0;

    records.forEach((c) => {
      totalSpeed += c.speedMps;
      if (c.speedMps > maxRecord.speedMps) maxRecord = c;
      if (c.speedMps < minRecord.speedMps) minRecord = c;

      const rad = (c.directionDegrees * Math.PI) / 180;
      sumSin += Math.sin(rad) * c.speedMps;
      sumCos += Math.cos(rad) * c.speedMps;
    });

    const avgSpeed = Math.round((totalSpeed / records.length) * 100) / 100;
    const avgRad = Math.atan2(sumSin, sumCos);
    let avgDeg = Math.round((avgRad * 180) / Math.PI);
    avgDeg = ((avgDeg % 360) + 360) % 360;

    return {
      maxSpeed: maxRecord.speedMps,
      maxSpeedRecord: maxRecord,
      minSpeed: minRecord.speedMps,
      minSpeedRecord: minRecord,
      avgSpeed,
      dominantDirectionDegrees: avgDeg,
      dominantDirectionCardinal: getCardinalDirection(avgDeg),
    };
  }

  // ==========================================
  // METADATA & HELPER METHODS
  // ==========================================
  public getStationInfo(): OceanographyStationInfo {
    return { ...this.stationInfo };
  }

  public getAvailableDates(): string[] {
    const dates = Array.from(new Set(this.tides.map((t) => t.date)));
    return dates.sort((a, b) => b.localeCompare(a));
  }

  public exportTidesCsv(records: TideRecord[]): void {
    const headers = ['ID', 'Tanggal', 'Jam (WIB)', 'Tinggi Muka Air (m)', 'Status Pasut', 'Deviasi MSL (m)', 'Pasang Tertinggi', 'Surut Terendah'];
    const rows = records.map((r) => [
      r.id,
      r.date,
      r.time,
      r.waterLevelM,
      `"${r.conditionStatus}"`,
      r.deviationMsl,
      r.isHighestHighWater ? 'YA' : 'TIDAK',
      r.isLowestLowWater ? 'YA' : 'TIDAK',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `seabris-pasang-surut-muara-angke-${records[0]?.date || 'data'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  public exportCurrentsCsv(records: OceanCurrentRecord[]): void {
    const headers = ['ID', 'Tanggal', 'Jam (WIB)', 'Kecepatan Arus (m/s)', 'Arah Derajat (°)', 'Arah Mata Angin', 'Status Arus', 'Kedalaman (m)'];
    const rows = records.map((r) => [
      r.id,
      r.date,
      r.time,
      r.speedMps,
      r.directionDegrees,
      `"${r.directionCardinal}"`,
      r.currentStatus,
      r.depthMeters ?? 1.5,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `seabris-arus-laut-muara-angke-${records[0]?.date || 'data'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const oceanographyService = new OceanographyService();

export interface MonthlyOceanRecord {
  timestamp: string; // "2025-01"
  mean_sea_level: number;
  current_speed: number;
  current_direction: number;
  significant_wave_height: number;
  peak_period: number;
}

export async function fetchMonthlyRecords(): Promise<MonthlyOceanRecord[]> {
  const res = await fetch('/api/oceanography/muara-angke/monthly');
  if (!res.ok) throw new Error('Gagal memuat data oseanografi bulanan');
  const json = await res.json();
  return json.records;
}

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
export const formatMonth = (ts: string) => {
  const [y, m] = ts.split('-');
  return `${BULAN[Number(m) - 1]} ${y}`;
};