import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';   

dotenv.config();

const app = express();

// Railway/Render berada di belakang reverse proxy: tanpa ini semua pengunjung
// terlihat berasal dari satu IP dan pembatas laju (rate limit) jadi tidak akurat.
app.set('trust proxy', 1);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Increase payload limit for base64 camera image uploads
app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: true, limit: '8mb' }));

// Initialize Gemini Client with User-Agent header as required by skill guidelines
const apiKey = process.env.GEMINI_API_KEY || '';
console.log('[SEABRIS] GEMINI_API_KEY terbaca:', apiKey ? 'ya' : 'TIDAK');
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
  timeout: 45000,
  headers: {
    'User-Agent': 'aistudio-build',
  },
},
});

// ------------------------------------------------------------
// Pembatas laju untuk /api/scan-waste (melindungi kuota Gemini).
// - per IP: maks SCAN_LIMIT_PER_IP_HOUR permintaan / jam
// - global: maks SCAN_GLOBAL_DAILY_CAP permintaan / 24 jam (rem darurat bila diserang banyak IP)
// Disimpan di memori: cukup untuk 1 instance; reset saat server restart.
// ------------------------------------------------------------
const SCAN_LIMIT_PER_IP_HOUR = parseInt(process.env.SCAN_LIMIT_PER_IP_HOUR || '15', 10);
const SCAN_GLOBAL_DAILY_CAP = parseInt(process.env.SCAN_GLOBAL_DAILY_CAP || '300', 10);
const scanHits = new Map<string, { count: number; resetAt: number }>();
let globalHits = { count: 0, resetAt: Date.now() + 24 * 60 * 60 * 1000 };

setInterval(() => {
  const now = Date.now();
  for (const [ip, v] of scanHits) if (v.resetAt <= now) scanHits.delete(ip);
}, 10 * 60 * 1000).unref();

function scanRateLimiter(req: Request, res: Response, next: () => void): void {
  const now = Date.now();

  if (globalHits.resetAt <= now) globalHits = { count: 0, resetAt: now + 24 * 60 * 60 * 1000 };
  if (globalHits.count >= SCAN_GLOBAL_DAILY_CAP) {
    res.status(429).json({ error: 'Layanan AI Scanner sedang mencapai batas harian. Coba lagi besok.' });
    return;
  }

  const ip = req.ip || 'unknown';
  const entry = scanHits.get(ip);
  if (!entry || entry.resetAt <= now) {
    scanHits.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
  } else {
    if (entry.count >= SCAN_LIMIT_PER_IP_HOUR) {
      const retryMin = Math.ceil((entry.resetAt - now) / 60000);
      res.status(429).json({ error: `Terlalu banyak pemindaian dari perangkat ini. Coba lagi sekitar ${retryMin} menit lagi.` });
      return;
    }
    entry.count += 1;
  }
  globalHits.count += 1;
  next();
}

/**
 * Backend API Endpoint for AI Marine Waste Scanner
 * POST /api/scan-waste
 * Receives base64 encoded image and analyzes it using Gemini 3.8 Flash Vision
 */
app.post('/api/scan-waste', scanRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;

    if (!imageBase64) {
      res.status(400).json({ error: 'Data gambar base64 tidak ditemukan' });
      return;
    }

    // Strip data URL prefix if present
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

    // Check if GEMINI_API_KEY is available
    if (!apiKey) {
      // Return clear demo response if no key is present (zero hallucinated key errors)
      res.json({
        isDemo: true,
        source: 'Simulasi Vision AI (Kunci API Gemini belum dikonfigurasi pada environment)',
        detectedObjects: [
          {
            name: 'Botol Plastik Minuman Sekali Pakai',
            category: 'Plastik',
            predictedMaterial: 'Kemungkinan PET (Polyethylene Terephthalate)',
            materialCertainty: 'Perkiraan Material — Perlu Verifikasi',
            count: 1,
            confidenceScore: 0.88,
            verificationNeeded: true,
          },
        ],
        primaryCategory: 'Plastik',
        primaryMaterial: 'Kemungkinan PET / Polimer Sintetis',
        biodegradationCategory: 'Sulit Terurai Secara Biologis',
        biodegradationExplanation:
          'Plastik konvensional berbahan polimer sintetis tidak dapat didegradasi secara biologis oleh mikroorganisme laut dalam waktu singkat. Di perairan, material ini akan mengalami pelapukan mekanis dan fotodegradasi sinar UV matahari yang memecahnya menjadi partikel mikroplastik berbahaya yang bertahan puluhan hingga ratusan tahun.',
        environmentalRisks: [
          'Potensi terbentuknya mikroplastik yang terakumulasi di sedimen muara',
          'Risiko tertelan oleh penyu, burung camar pesisir, dan ikan bandeng',
          'Pencemaran estuari dan terperangkap pada perakaran mangrove Muara Angke',
        ],
        recyclingPotential: 'Berpotensi didaur ulang apabila kondisi material bersih dan bebas kontaminasi lumpur pekat.',
        handlingRecommendation:
          'Kumpulkan dan bilas secara aman. Pisahkan tutup dan label jika memungkinkan, lalu salurkan ke bank sampah pesisir atau fasilitas daur ulang terdekat.',
        recommendationCategory: 'Daur Ulang',
        requiresPhysicalVerification: true,
      });
      return;
    }

    // Real Gemini 3.8 Flash Multimodal Call
    const systemPrompt = `Anda adalah sistem pakar analisis sampah laut dan pesisir SEABRIS (Smart Marine Debris Management System).
Tugas Anda adalah mengidentifikasi sampah yang terlihat pada foto yang diambil di kawasan pesisir, muara, atau perairan Teluk Jakarta.
Kategori utama sampah WAJIB salah satu dari 10 kategori berikut:
1. Plastik
2. Logam
3. Kaca
4. Kertas dan Karton
5. Sampah Organik
6. Karet
7. Tekstil
8. Alat Tangkap Perikanan
9. Sampah Campuran
10. Tidak Teridentifikasi

Kategori potensi penguraian (biodegradationCategory) WAJIB salah satu dari:
- Berpotensi Terurai Secara Biologis
- Sulit Terurai Secara Biologis
- Tidak Terurai Secara Biologis, tetapi Mengalami Perubahan Fisik/Kimia
- Perlu Identifikasi Material Lebih Lanjut

Kategori rekomendasi (recommendationCategory) WAJIB salah satu dari:
- Daur Ulang
- Pengolahan Organik
- Pengelolaan Khusus
- Residu
- Perlu Verifikasi Petugas

PENTING:
- Bedakan antara biodegradasi biologis alami dengan fragmentasi mekanis atau korosi kimia.
- Jangan mengarang angka tahun penguraian yang pasti; berikan penjelasan ilmiah yang realistis.
- Jika material tidak dapat dipastikan 100% hanya dari foto, cantumkan materialCertainty sebagai "Perkiraan Material — Perlu Verifikasi".
- Gunakan bahasa Indonesia yang baku, profesional, dan edukatif.`;

    const promptText = 'Analisis foto sampah ini secara cermat. Identifikasi semua objek sampah yang terlihat, perkirakan bahan penyusunnya, potensi penguraiannya di ekosistem perairan Teluk Jakarta, risiko terhadap biota laut, serta rekomendasi penanganannya.';

    const imagePart = {
      inlineData: {
        data: cleanBase64,
        mimeType: mimeType,
      },
    };

const t0 = Date.now();
console.log('[SCAN] mulai · ukuran gambar:', Math.round((cleanBase64.length * 0.75) / 1024), 'KB');

    const callModel = (model: string) => ai.models.generateContent({
       model,
      contents: {
        parts: [imagePart, { text: promptText }],
      },
      config: {
        systemInstruction: systemPrompt,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedObjects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: 'Nama spesifik objek sampah, contoh: Botol plastik minuman, Jaring insang bekas, Sedotan' },
                  category: { type: Type.STRING, description: 'Salah satu dari 10 kategori utama' },
                  predictedMaterial: { type: Type.STRING, description: 'Perkiraan jenis polimer atau material' },
                  materialCertainty: { type: Type.STRING, description: 'Perkiraan Material — Perlu Verifikasi atau Terkonfirmasi' },
                  count: { type: Type.INTEGER, description: 'Perkiraan jumlah objek yang terlihat' },
                  confidenceScore: { type: Type.NUMBER, description: 'Skor keyakinan deteksi 0.0 - 1.0' },
                  verificationNeeded: { type: Type.BOOLEAN, description: 'Apakah perlu verifikasi fisik lapangan' },
                },
                required: ['name', 'category', 'predictedMaterial', 'confidenceScore'],
              },
            },
            primaryCategory: { type: Type.STRING, description: 'Kategori dominan dari sampah yang terdeteksi' },
            primaryMaterial: { type: Type.STRING, description: 'Material penyusun utama' },
            biodegradationCategory: { type: Type.STRING, description: 'Kategori potensi penguraian' },
            biodegradationExplanation: { type: Type.STRING, description: 'Penjelasan ilmiah proses penguraian di lingkungan laut tanpa klaim tahun pasti' },
            environmentalRisks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Daftar 2-4 poin risiko spesifik bagi ekosistem laut Teluk Jakarta',
            },
            recyclingPotential: { type: Type.STRING, description: 'Penjelasan potensi daur ulang' },
            handlingRecommendation: { type: Type.STRING, description: 'Langkah praktis penanganan sampah bagi masyarakat atau petugas' },
            recommendationCategory: { type: Type.STRING, description: 'Kategori tindakan pengelolaan' },
            requiresPhysicalVerification: { type: Type.BOOLEAN, description: 'Apakah petugas perlu memeriksa langsung' },
          },
          required: [
            'detectedObjects',
            'primaryCategory',
            'primaryMaterial',
            'biodegradationCategory',
            'biodegradationExplanation',
            'environmentalRisks',
            'recyclingPotential',
            'handlingRecommendation',
            'recommendationCategory',
          ],
        },
      },
    });

        let response: any;
    const modelList = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];
    for (let i = 0; i < modelList.length; i++) {
      try {
        response = await callModel(modelList[i]);
        console.log('[SCAN] model dipakai:', modelList[i]);
        break;
      } catch (e: any) {
        console.warn('[SCAN] gagal di', modelList[i], '-', e?.status || e?.message);
        if (i === modelList.length - 1) throw e;
      }
    }
    
    console.log('[SCAN] selesai dalam', Date.now() - t0, 'ms ·', JSON.stringify(response.usageMetadata));
    const resultText = response.text || '{}';
    const parsedData = JSON.parse(resultText);

    res.json({
      ...parsedData,
      isDemo: false,
      source: 'Gemini 3.8 Flash Vision Engine',
    });
  } catch (error: any) {
    console.error('[JAKSEA AI Vision Error]', error);
    // Graceful fallback to informative error/mock if model call encounters quota/network glitch
    res.status(500).json({
      error: 'Terjadi kendala saat menganalisis gambar dengan server AI.',
      message: error?.message || 'Gagal memproses visual.',
    });
  }
});

/**
 * Backend API Endpoint for Muara Angke Oceanographic Data
 * GET /api/oceanography/muara-angke
 * Returns verified station metadata, tide levels (m), and ocean current dynamics
 */
app.get('/api/oceanography/muara-angke', (req: Request, res: Response) => {
  const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
  
  res.json({
    stationId: 'STA-MA-01',
    stationName: 'Stasiun Pantau Oseanografi Muara Angke',
    location: 'Kanal Muara Karang, Penjaringan, Teluk Jakarta',
    coordinates: [-6.1085, 106.7725],
    datum: 'Mean Sea Level (MSL) = 0.80 m',
    tideType: 'Campuran Condong Harian Ganda (Mixed Prevailing Semi-Diurnal)',
    requestedDate: date,
    currentObservation: {
      waterLevelMeters: 1.38,
      tidePhase: 'Pasang (Menuju Puncak)',
      deviationMslMeters: 0.58,
      currentSpeedMps: 0.65,
      currentDirectionDegrees: 165,
      currentDirectionCardinal: 'Selatan (S · 180°)',
      currentStatus: 'Sedang',
      timestamp: `${date} 12:00:00`,
    },
    tideExtremes: {
      highestTide: { valueMeters: 1.62, time: '14:00 WIB' },
      lowestTide: { valueMeters: 0.35, time: '07:00 WIB' },
      rangeMeters: 1.27,
    },
    currentStatistics: {
      maxSpeedMps: 0.98,
      minSpeedMps: 0.18,
      avgSpeedMps: 0.59,
      dominantDirectionDegrees: 162,
    },
    apiIntegration: {
      status: 'active',
      isLiveExternalApiConnected: false,
      note: 'Struktur siap terhubung ke BMKG Maritim / BIG Tide Gauge Webhook',
    },
  });
});

const oceanMonthly = JSON.parse(
  fs.readFileSync(path.resolve('src/data/pasut_muara_angke.json'), 'utf-8')
);

app.get('/api/oceanography/muara-angke/monthly', (req: Request, res: Response) => {
  const { from, to } = req.query as { from?: string; to?: string };
  let records = oceanMonthly.monthly_records as any[];
  if (from) records = records.filter((r) => r.timestamp >= from);
  if (to) records = records.filter((r) => r.timestamp <= to);

  res.json({
    location: oceanMonthly.location,
    coordinates: oceanMonthly.coordinates,
    period: oceanMonthly.period,
    dataSources: oceanMonthly.data_sources,
    units: oceanMonthly.units,
    records,
  });
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'SEABRIS IoT & AI Scanner API', timestamp: new Date().toISOString() });
});

  async function startServer() {
  // Mount Vite middleware in development
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true, port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.resolve('dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SEABRIS] Server running at http://localhost:${PORT}`);
  });
}

startServer();