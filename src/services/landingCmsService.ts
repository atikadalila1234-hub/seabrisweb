import { LandingCmsContent } from '../types';
import { supabase } from '../lib/supabase';

export type { LandingCmsContent };

export const DEFAULT_LANDING_CONTENT: LandingCmsContent = {
  heroTagline: 'Inovasi Smart City & Konservasi Bahari Teluk Jakarta',
  heroHeadline: 'SEABRIS — Smart Marine Debris Management System',
  heroSubheadline: 'Sistem Pengumpul dan Monitoring Sampah Pesisir Pintar Berbasis IoT Terintegrasi untuk Mitigasi Pencemaran Plastik di Teluk Jakarta.',
  heroImage: '/images/jaksea_floating_barrier_1793092523454.jpg',
  heroImageBadge: 'Instalasi Lapangan',
  heroImageTitle: 'Penghalang Terapung & Keranjang Sensor SEABRIS',
  heroImageSubtitle: 'Muara Angke · Teluk Jakarta',

  sensorTagline: 'Teknologi Sensor & Arsitektur',
  sensorTitle: 'Deteksi Keterisian Akurat Tanpa Bergantung Jaringan Listrik PLN',
  sensorDescription: 'Setiap unit SEABRIS dilengkapi panel surya monokristalin mandiri, baterai LiFePO4 tahan cuaca laut, dan modul sensor jarak ultrasonik industri IP67 yang terus aktif memantau volume sampah siang dan malam.',
  sensorImage: '/images/sensor_baru.jpg',
  sensorImageAlt: 'Modul Sensor Ultrasonik IoT SEABRIS Tahan Air Garam',

  actionTagline: 'Kolaborasi Petugas & Partisipasi Publik',
  actionTitle: 'Menghubungkan Masyarakat Pesisir dengan Petugas Pengelola',
  actionDescription: 'Masyarakat di sekitar Teluk Jakarta dapat berpartisipasi aktif dengan mengirimkan laporan foto sampah terapung beserta koordinat GPS. Laporan tersebut langsung masuk ke sistem monitoring petugas untuk ditindaklanjuti.',
  actionImage: '/images/bersih_bersih.jpeg',
  actionImageAlt: 'Aksi Pembersihan dan Patroli Tim Lingkungan di Muara Pesisir Jakarta',

  urgencyTagline: 'Urgensi Lingkungan Hidup',
  urgencyTitle: 'Mengapa Teluk Jakarta Membutuhkan Aksi Cepat?',
  urgencyDescription: 'Kawasan Teluk Jakarta menampung limpasan air dari 13 sungai utama yang melintasi Jabodetabek. Sampah plastik terapung yang tidak tertangani dapat terfragmentasi menjadi mikroplastik berbahaya yang merusak ekosistem hutan mangrove Muara Angke, mematikan biota laut, dan mengancam kesehatan rantai makanan masyarakat.',

  lastUpdated: '2026-11-12T00:00:00.000Z',
  updatedBy: 'Sistem Bawaan'
};

export const PRESET_IMAGE_OPTIONS = [
  {
    id: 'floating-barrier',
    label: 'Penghalang Terapung SEABRIS (Muara Angke)',
    url: '/images/jaksea_floating_barrier_1793092523454.jpg'
  },
  {
    id: 'sensor-device',
    label: 'Modul Sensor IoT & Baterai Surya',
    url: '/images/jaksea_sensor_device_1793092524411.jpg'
  },
  {
    id: 'coastal-action',
    label: 'Aksi Bersih Pesisir & Patroli Tim Lapangan',
    url: '/images/jaksea_coastal_action_1793092523493.jpg'
  }
];

// Cache terakhir yang berhasil diambil dari Supabase.
// Hanya untuk menghindari "kedip" konten default saat halaman dibuka;
// sumber kebenarannya tetap tabel public.landing_cms di Supabase.
const CACHE_KEY = 'seabris_landing_cms_cache_v2';
const BUCKET = 'report-photos';

const IMAGE_FIELDS: Array<keyof LandingCmsContent> = ['heroImage', 'sensorImage', 'actionImage'];

function readCache(): LandingCmsContent | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? { ...DEFAULT_LANDING_CONTENT, ...JSON.parse(raw) } : null;
  } catch {
    return null;
  }
}

function writeCache(content: LandingCmsContent): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(content));
  } catch {
    /* cache boleh gagal, tidak kritis */
  }
}

function friendlyError(err: any, fallback: string): Error {
  const msg = String(err?.message || '');
  if (err?.code === '42501' || /row-level security|permission denied/i.test(msg)) {
    return new Error('Akses ditolak. Hanya akun Admin yang sedang login yang dapat mengubah konten beranda.');
  }
  return new Error(msg ? `${fallback} (${msg})` : fallback);
}

class LandingCmsService {
  private content: LandingCmsContent;
  private listeners: Array<(content: LandingCmsContent) => void> = [];

  constructor() {
    this.content = readCache() ?? { ...DEFAULT_LANDING_CONTENT };
    void this.refresh();
  }

  /** Ambil konten terbaru dari Supabase, lalu beritahu semua subscriber. */
  public async refresh(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('landing_cms')
        .select('content')
        .eq('id', 1)
        .maybeSingle();

      if (error) throw error;
      if (data?.content) {
        this.content = { ...DEFAULT_LANDING_CONTENT, ...(data.content as Partial<LandingCmsContent>) };
        writeCache(this.content);
        this.notify();
      }
      // Kalau belum ada baris (belum pernah disimpan admin), pakai konten default.
    } catch (e) {
      console.warn('[SEABRIS CMS] Gagal mengambil konten dari Supabase, memakai cache/default:', e);
    }
  }

  public getContent(): LandingCmsContent {
    return { ...this.content };
  }

  /** Jika nilai berupa data URL (hasil upload), unggah ke Storage dan kembalikan URL publiknya. */
  private async uploadIfDataUrl(field: string, value: unknown): Promise<unknown> {
    if (typeof value !== 'string' || !value.startsWith('data:')) return value;

    const blob = await (await fetch(value)).blob();
    const ext = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpg';
    const path = `cms/${field}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { contentType: blob.type || 'image/jpeg', upsert: false });
    if (error) throw friendlyError(error, 'Gagal mengunggah foto ke penyimpanan');

    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  public async saveContent(
    updatedContent: Partial<LandingCmsContent>,
    userEmailOrName?: string
  ): Promise<LandingCmsContent> {
    const merged: Record<string, unknown> = { ...this.content, ...updatedContent };

    for (const field of IMAGE_FIELDS) {
      merged[field] = await this.uploadIfDataUrl(field, merged[field]);
    }

    const newContent = {
      ...merged,
      lastUpdated: new Date().toISOString(),
      updatedBy: userEmailOrName || 'Admin SEABRIS',
    } as LandingCmsContent;

    const { error } = await supabase.from('landing_cms').upsert({
      id: 1,
      content: newContent,
      updated_by: newContent.updatedBy,
      updated_at: newContent.lastUpdated,
    });
    if (error) throw friendlyError(error, 'Gagal menyimpan konten beranda');

    this.content = newContent;
    writeCache(newContent);
    this.notify();
    return { ...this.content };
  }

  public async resetToDefault(userEmailOrName?: string): Promise<LandingCmsContent> {
    const { error } = await supabase.from('landing_cms').delete().eq('id', 1);
    if (error) throw friendlyError(error, 'Gagal mereset konten beranda');

    try {
      localStorage.removeItem(CACHE_KEY);
    } catch {
      /* abaikan */
    }
    this.content = {
      ...DEFAULT_LANDING_CONTENT,
      lastUpdated: new Date().toISOString(),
      updatedBy: `${userEmailOrName || 'Admin'} (Reset Default)`,
    };
    this.notify();
    return { ...this.content };
  }

  public subscribe(listener: (content: LandingCmsContent) => void): () => void {
    this.listeners.push(listener);
    // Kirim state saat ini langsung
    listener(this.getContent());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    const current = this.getContent();
    this.listeners.forEach((l) => {
      try {
        l(current);
      } catch (err) {
        console.error('Error pada subscriber LandingCmsService:', err);
      }
    });
  }

  /**
   * Helper untuk mengompres dan mengonversi File gambar menjadi Base64 yang aman untuk localStorage
   */
  public async compressAndReadFile(file: File, maxDimension = 1200, quality = 0.82): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          // Resize if larger than max dimension
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = (e) => reject(new Error('Format gambar tidak valid'));
        img.src = event.target?.result as string;
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }
}

export const landingCmsService = new LandingCmsService();
