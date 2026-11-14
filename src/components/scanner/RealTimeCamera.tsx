import { useCallback, useEffect, useRef, useState } from 'react';
import type * as CocoSsd from '@tensorflow-models/coco-ssd';

type Prediction = { class: string; score: number; bbox: number[] };

type Props = { onCapture: (dataUrl: string) => void };

const education: Record<string, { label: string; info: string }> = {
  bottle: { label: 'Botol (material belum diketahui)', info: 'Jika berbahan plastik konvensional, sulit terurai secara biologis. Periksa tanda material sebelum memilah.' },
  cup: { label: 'Gelas/cangkir (material belum diketahui)', info: 'Material dapat berupa plastik, kertas, kaca, atau keramik. Periksa secara langsung.' },
  'wine glass': { label: 'Gelas berkaki (material belum diketahui)', info: 'Jika berbahan kaca, tidak terurai secara biologis. Tangani pecahan dengan hati-hati.' },
  fork: { label: 'Garpu (material belum diketahui)', info: 'Periksa apakah plastik atau logam untuk menentukan penanganan.' },
  spoon: { label: 'Sendok (material belum diketahui)', info: 'Periksa bahan penyusun sebelum menentukan alur pengelolaan.' },
  bowl: { label: 'Mangkuk (material belum diketahui)', info: 'Periksa bahan penyusun sebelum menentukan alur pengelolaan.' },
};

export function RealTimeCamera({ onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const modelRef = useRef<CocoSsd.ObjectDetection | null>(null);
  const tokenRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busyRef = useRef(false);
  const [status, setStatus] = useState('Kamera belum aktif');
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [error, setError] = useState('');

  const stop = useCallback(() => {
    tokenRef.current++;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    const video = videoRef.current;
    if (video) { video.pause(); video.srcObject = null; }
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    setActive(false);
    setPredictions([]);
    setLoading(false);
    setStatus('Kamera berhenti');
  }, []);

  useEffect(() => () => {
    tokenRef.current++;
    if (timerRef.current) clearTimeout(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  const draw = useCallback((items: Prediction[]) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 16px sans-serif';
    ctx.lineWidth = 3;
    for (const p of items) {
      const [x, y, width, height] = p.bbox;
      const label = `${p.class} ${Math.round(p.score * 100)}%`;
      ctx.strokeStyle = '#00e5ca';
      ctx.strokeRect(x, y, width, height);
      const labelWidth = ctx.measureText(label).width + 14;
      const labelY = Math.max(0, y - 25);
      ctx.fillStyle = '#00e5ca';
      ctx.fillRect(x, labelY, labelWidth, 25);
      ctx.fillStyle = '#073b4c';
      ctx.fillText(label, x + 7, labelY + 18);
    }
  }, []);

  const loop = useCallback(async (token: number) => {
    if (token !== tokenRef.current || busyRef.current) return;
    const video = videoRef.current;
    const model = modelRef.current;
    if (!video || !model) return;
    busyRef.current = true;
    try {
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        const results = await model.detect(video);
        if (token !== tokenRef.current) return;
        const filtered = results.filter((x) => x.score >= 0.55).map((x) => ({
          class: x.class, score: x.score, bbox: x.bbox,
        }));
        setPredictions(filtered);
        draw(filtered);
      }
    } catch (e) {
      console.error('Live detection gagal:', e);
    } finally {
      busyRef.current = false;
      if (token === tokenRef.current) timerRef.current = setTimeout(() => void loop(token), 250);
    }
  }, [draw]);

  const start = async () => {
    if (loading || active) return;
    setError('');
    setLoading(true);
    setStatus('Meminta izin kamera...');
    const token = ++tokenRef.current;
    let stream: MediaStream | null = null;
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Akses kamera memerlukan HTTPS atau localhost dan browser yang mendukung.');
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 640 }, height: { ideal: 480 } }, audio: false,
      });
      if (token !== tokenRef.current) { stream.getTracks().forEach((t) => t.stop()); return; }
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error('Elemen video tidak ditemukan.');
      video.srcObject = stream;
      await video.play();
      if (token !== tokenRef.current) return;
      setActive(true);
      setLoading(false);
      setStatus('Kamera aktif. Menyiapkan model AI...');
      // Dynamic import: gambar kamera muncul lebih dahulu daripada model yang perlu diunduh.
      if (!modelRef.current) {
        await import('@tensorflow/tfjs');
        const coco = await import('@tensorflow-models/coco-ssd');
        const model = await coco.load({ base: 'lite_mobilenet_v2' });
        if (token !== tokenRef.current) { model.dispose(); return; }
        modelRef.current = model;
      }
      setStatus('AI aktif: mendeteksi objek secara langsung');
      void loop(token);
    } catch (e) {
      if (token !== tokenRef.current) return;
      console.error(e);
      setError(e instanceof Error ? e.message : 'Tidak bisa membuka kamera atau memuat AI.');
      stream?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setActive(false);
      setLoading(false);
      setStatus('Terjadi kesalahan');
    }
  };

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const photo = document.createElement('canvas');
    photo.width = video.videoWidth;
    photo.height = video.videoHeight;
    photo.getContext('2d')?.drawImage(video, 0, 0);
    const url = photo.toDataURL('image/jpeg', 0.85);
    stop();
    onCapture(url);
  };

  const known = predictions.find((p) => education[p.class]);

  return (
    <div className="space-y-4">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-950">
        {/* Tetap terpasang dalam DOM bahkan sebelum kamera aktif. */}
        <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 h-full w-full" />
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
        {!active && <div className="absolute inset-0 grid place-items-center text-sm text-white">{loading ? 'Mengaktifkan kamera...' : 'Kamera belum aktif'}</div>}
        {active && <span className="absolute left-3 top-3 rounded-lg bg-slate-900/80 px-3 py-1 text-xs text-emerald-300">● LIVE</span>}
      </div>
      <p className="text-xs font-medium text-cyan-800">{status}</p>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {!active ? <button onClick={start} disabled={loading} className="rounded-xl bg-[#0077B6] px-5 py-3 text-xs font-bold text-white disabled:opacity-50">📷 {loading ? 'Membuka Kamera...' : 'Mulai Scan Langsung'}</button> : <>
          <button onClick={stop} className="rounded-xl bg-slate-800 px-5 py-3 text-xs font-bold text-white">Hentikan</button>
          <button onClick={takePhoto} className="rounded-xl bg-cyan-600 px-5 py-3 text-xs font-bold text-white">Ambil Foto (Analisis Lanjutan)</button>
        </>}
      </div>
      <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-xs text-slate-700">
        <p className="font-bold">Hasil deteksi langsung:</p>
        {predictions.length ? predictions.map((p, i) => <p key={`${p.class}-${i}`} className="mt-1">{p.class} — {Math.round(p.score * 100)}% (skor model, bukan kepastian material)</p>) : <p className="mt-1">Belum ada objek dikenali oleh model.</p>}
        {known && <div className="mt-3 border-t border-cyan-200 pt-3"><strong>{education[known.class].label}</strong><p>{education[known.class].info}</p></div>}
        <p className="mt-2 text-slate-500">Model umum COCO-SSD: tidak dapat memastikan jenis plastik, biodegradasi aktual, atau semua kategori sampah laut.</p>
      </div>
    </div>
  );
}
