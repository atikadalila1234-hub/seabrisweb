export interface MonthlyWaveRecord {
  bulan_tahun: string;
  tinggi_gelombang_m: number;
  status_gelombang: 'Tenang / Aman' | 'Waspada Sedang' | string;
}

export interface WaveDataset {
  lokasi: string;
  parameter: string;
  satuan: string;
  sumber: string;
  rentang_waktu: string;
  data_bulanan: MonthlyWaveRecord[];
}

export const MUARA_ANGKE_WAVE_DATA: WaveDataset = {
  lokasi: "Muara Angke, Teluk Jakarta",
  parameter: "Tinggi Gelombang Signifikan (Significant Wave Height)",
  satuan: "meter",
  sumber: "Copernicus Marine Service (CMEMS)",
  rentang_waktu: "Januari 2025 - November 2026",
  data_bulanan: [
    { bulan_tahun: "Jan 2025", tinggi_gelombang_m: 0.49, status_gelombang: "Tenang / Aman" },
    { bulan_tahun: "Feb 2025", tinggi_gelombang_m: 0.44, status_gelombang: "Tenang / Aman" },
    { bulan_tahun: "Mar 2025", tinggi_gelombang_m: 0.34, status_gelombang: "Tenang / Aman" },
    { bulan_tahun: "Apr 2025", tinggi_gelombang_m: 0.40, status_gelombang: "Tenang / Aman" },
    { bulan_tahun: "May 2025", tinggi_gelombang_m: 0.35, status_gelombang: "Tenang / Aman" },
    { bulan_tahun: "Jun 2025", tinggi_gelombang_m: 0.26, status_gelombang: "Tenang / Aman" },
    { bulan_tahun: "Jul 2025", tinggi_gelombang_m: 0.29, status_gelombang: "Tenang / Aman" },
    { bulan_tahun: "Aug 2025", tinggi_gelombang_m: 0.32, status_gelombang: "Tenang / Aman" },
    { bulan_tahun: "Sep 2025", tinggi_gelombang_m: 0.37, status_gelombang: "Tenang / Aman" },
    { bulan_tahun: "Oct 2025", tinggi_gelombang_m: 0.35, status_gelombang: "Tenang / Aman" },
    { bulan_tahun: "Nov 2025", tinggi_gelombang_m: 0.35, status_gelombang: "Tenang / Aman" },
    { bulan_tahun: "Dec 2025", tinggi_gelombang_m: 0.52, status_gelombang: "Waspada Sedang" },
    { bulan_tahun: "Jan 2026", tinggi_gelombang_m: 0.45, status_gelombang: "Tenang / Aman" },
    { bulan_tahun: "Feb 2026", tinggi_gelombang_m: 0.53, status_gelombang: "Waspada Sedang" },
    { bulan_tahun: "Mar 2026", tinggi_gelombang_m: 0.36, status_gelombang: "Tenang / Aman" },
    { bulan_tahun: "Apr 2026", tinggi_gelombang_m: 0.34, status_gelombang: "Tenang / Aman" },
    { bulan_tahun: "May 2026", tinggi_gelombang_m: 0.38, status_gelombang: "Tenang / Aman" },
    { bulan_tahun: "Jun 2026", tinggi_gelombang_m: 0.31, status_gelombang: "Tenang / Aman" },
    { bulan_tahun: "Jul 2026", tinggi_gelombang_m: 0.24, status_gelombang: "Tenang / Aman" },
    { bulan_tahun: "Aug 2026", tinggi_gelombang_m: 0.28, status_gelombang: "Tenang / Aman" },
    { bulan_tahun: "Sep 2026", tinggi_gelombang_m: 0.35, status_gelombang: "Tenang / Aman" },
    { bulan_tahun: "Oct 2026", tinggi_gelombang_m: 0.34, status_gelombang: "Tenang / Aman" },
    { bulan_tahun: "Nov 2026", tinggi_gelombang_m: 0.36, status_gelombang: "Tenang / Aman" }
  ]
};
