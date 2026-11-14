import React, { useEffect, useState } from 'react';

export interface HeroSlide {
  image: string;
  alt?: string;
  badge?: string;
  title: string;
}

interface HeroSliderProps {
  slides: HeroSlide[];
  intervalMs?: number;
  children: React.ReactNode; // teks hero yang tampil di atas foto
}

/**
 * Hero dengan foto sebagai BACKGROUND yang berganti OTOMATIS.
 * Tanpa tombol/pencetan: hanya berganti sendiri tiap beberapa detik.
 */
export const HeroSlider: React.FC<HeroSliderProps> = ({
  slides,
  intervalMs = 5000,
  children,
}) => {
  const [index, setIndex] = useState(0);
  const total = slides.length;

  useEffect(() => {
    if (total < 2) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % total), intervalMs);
    return () => window.clearInterval(id);
  }, [total, intervalMs]);

  const current = slides[index] ?? slides[0];

  return (
    <section
      className="relative isolate w-full overflow-hidden bg-slate-900 min-h-[640px] lg:min-h-[720px] flex items-center box-border pb-20 -mb-20"
      aria-roledescription="carousel"
      aria-label="Galeri foto kondisi lapangan"
    >
      {/* Foto background (ditumpuk, yang aktif fade-in + zoom pelan) */}
      {slides.map((s, i) => (
        <img
          key={s.image + i}
          src={s.image}
          alt={s.alt || s.title}
          aria-hidden={i !== index}
          loading={i === 0 ? 'eager' : 'lazy'}
          className={`absolute inset-0 -z-10 h-full w-full object-cover transition-all duration-[1200ms] ease-in-out ${
            i === index ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          }`}
        />
      ))}

      {/* Lapisan gelap supaya teks putih tetap terbaca */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/85 via-slate-950/60 to-slate-950/25" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/30" />

      {/* Konten teks hero */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 sm:pt-20 sm:pb-28 box-border">
        {children}
      </div>

      {/* Caption foto + indikator (hanya tampilan, tidak bisa diklik) */}
      <div className="absolute bottom-5 inset-x-0 z-20 px-4 sm:px-6 lg:px-8 pointer-events-none">
        <div className="max-w-7xl mx-auto flex items-end justify-between gap-4">
          <div className="text-white min-w-0">
            {current?.badge && (
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
                {current.badge}
              </span>
            )}
            <span className="block text-xs sm:text-sm font-medium text-slate-100 truncate">
              {current?.title}
            </span>
          </div>

          {total > 1 && (
            <div className="flex items-center gap-2 shrink-0 pb-1" aria-hidden="true">
              {slides.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === index ? 'w-7 bg-cyan-300' : 'w-1.5 bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};