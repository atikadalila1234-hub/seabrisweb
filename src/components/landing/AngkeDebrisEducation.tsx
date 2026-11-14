import React from 'react';
import {
  Trash2,
  AlertTriangle,
  ShieldAlert,
  Anchor,
  Fish,
  Biohazard,
  TreePine,
  Camera,
} from 'lucide-react';
import { SpotlightCard } from '../common/SpotlightCard';
import imgPlastik from '../../assets/images/sampah_plastik.jpeg';
import imgStyrofoam from '../../assets/images/sampah_sterofoam.jpeg';
import imgKayu from '../../assets/images/sampah_kayu.jpeg';
import imgGhostGear from '../../assets/images/ghost_gear.jpeg';

const DEBRIS_IMAGES: Record<string, string> = {
  'single-use-plastic': imgPlastik,
  styrofoam: imgStyrofoam,
  'organic-wood': imgKayu,
  'ghost-gear': imgGhostGear,
};

export interface AngkeDebrisEducationProps {
  onExploreScanner?: () => void;
  className?: string;
}

export const AngkeDebrisEducation: React.FC<AngkeDebrisEducationProps> = ({
  onExploreScanner,
  className = '',
}) => {
  const quickStats = [
    {
      id: 'volume',
      title: 'Volume Sampah Harian',
      stat: '~40–50',
      unit: 'Ton / Hari',
      statusLabel: 'Beban Muara Kritis',
      dotColor: 'bg-rose-500',
      statusTextColor: 'text-rose-700',
      icon: Trash2,
      description:
        'Volume buangan padat dari 13 sungai utama yang mengalir menuju Teluk Jakarta, terkonsentrasi di muara Kali Angke, Kali Adem, dan kawasan hutan mangrove.',
      impactPoint: 'Puncak volume terjadi saat banjir kiriman hulu musim penghujan.',
    },
    {
      id: 'ecosystem',
      title: 'Ancaman Ekosistem Pesisir',
      stat: '98.2%',
      unit: 'Sampel Terpapar Mikroplastik',
      statusLabel: 'Suaka Margasatwa Terancam',
      dotColor: 'bg-amber-500',
      statusTextColor: 'text-amber-700',
      icon: ShieldAlert,
      description:
        'Serpihan plastik menutupi pneumatofor (akar napas) mangrove jenis Avicennia dan Sonneratia, menghambat pertumbuhan bibit mangrove dan meracuni rantai makanan muara.',
      impactPoint: 'Bioakumulasi mikroplastik berisiko masuk ke hasil tangkapan nelayan.',
    },
    {
      id: 'solution',
      title: 'Kapasitas Terkalibrasi SEABRIS',
      stat: '50L / 25kg',
      unit: 'Bak Tetap (0–25 cm)',
      statusLabel: 'Operasional Tenaga Surya',
      dotColor: 'bg-emerald-500',
      statusTextColor: 'text-emerald-700',
      icon: Anchor,
      description:
        'Penghalang terapung mandiri daya surya 20W yang mencegat sampah sebelum lolos ke laut lepas Teluk Jakarta, dipantau sensor ultrasonik JSN-SR04T.',
      impactPoint: 'Tanpa komponen turbin berputar sehingga bebas lilitan kantong plastik.',
    },
  ];

  const debrisComposition = [
    {
      id: 'single-use-plastic',
      name: 'Plastik Sekali Pakai',
      percentage: 45,
      hazardLevel: 'Sangat Tinggi',
      hazardDot: 'bg-rose-500',
      hazardText: 'text-rose-700',
      barColor: 'bg-[#0f2942]',
      examples: 'Kantong kresek, botol PET, gelas air mineral, saset multilayer',
      degradeTime: '450–500 Tahun',
      ecologicalEffect:
        'Melapisi lumpur estuari, menghambat pasokan oksigen biota bentik, dan mengurung perakaran napas mangrove.',
      icon: Biohazard,
    },
    {
      id: 'styrofoam',
      name: 'Styrofoam / Polystyrene',
      percentage: 25,
      hazardLevel: 'Tinggi',
      hazardDot: 'bg-amber-500',
      hazardText: 'text-amber-700',
      barColor: 'bg-[#1e3a8a]',
      examples: 'Kotak es pendingin ikan rusak, kemasan makanan instan, pecahan insulasi',
      degradeTime: '500+ Tahun (Fragmentasi Cepat)',
      ecologicalEffect:
        'Sangat getas dan mudah pecah menjadi butiran mikroplastik yang sering disangka makanan oleh burung rawa dan ikan.',
      icon: AlertTriangle,
    },
    {
      id: 'organic-wood',
      name: 'Sampah Kayu & Organik',
      percentage: 15,
      hazardLevel: 'Sedang',
      hazardDot: 'bg-emerald-500',
      hazardText: 'text-emerald-700',
      barColor: 'bg-[#0284c7]',
      examples: 'Bambu bagan apung runtuh, ranting gelondongan, eceng gondok hanyut',
      degradeTime: '1–3 Tahun (Biodegradable)',
      ecologicalEffect:
        'Mempercepat pendangkalan alur pelayaran perahu nelayan Muara Angke dan memicu pembusukan anaerob.',
      icon: TreePine,
    },
    {
      id: 'ghost-gear',
      name: 'Alat Tangkap / Ghost Gear',
      percentage: 15,
      hazardLevel: 'Tinggi',
      hazardDot: 'bg-amber-500',
      hazardText: 'text-amber-700',
      barColor: 'bg-[#38bdf8]',
      examples: 'Jaring nilon bekas robek, tali tambat kapal, senar pancing kusut',
      degradeTime: '600+ Tahun',
      ecologicalEffect:
        'Fenomena ghost fishing: terus menjerat kepiting bakau, biawak air, penyu, serta merusak baling-baling kapal.',
      icon: Fish,
    },
  ];

  return (
    <section
      className={`w-full pt-20 sm:pt-24 pb-12 sm:pb-16 bg-[#f8fafc] border-y border-slate-200 box-border ${className}`}
      id="edukasi-muara-angke"
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 box-border space-y-12">


        {/* Dominant Debris Composition Grid */}
        <div className="space-y-8">
  <div className="max-w-3xl mx-auto text-center space-y-2.5">
    <p className="text-xs font-semibold uppercase tracking-wider text-[#0284c7]">
      Audit Sampel Lapangan Teluk Jakarta
    </p>
    <h3
      className="text-2xl sm:text-3xl font-extrabold text-[#0f2942] tracking-tight"
      style={{ textWrap: 'balance' }}
    >
      Komposisi Jenis Sampah Dominan di Muara Angke
    </h3>
    <p className="text-sm text-slate-600 leading-relaxed">
      Estimasi proporsi sampah terapung yang masuk ke jaring tangkap interceptor
      berdasarkan karakteristik material dan dampaknya.
    </p>
  </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {debrisComposition.map((item) => {
              const DebrisIcon = item.icon;
              return (
                <SpotlightCard
                  key={item.id}
                  contentClassName="p-5 flex flex-col justify-between space-y-4"
                >
                                    <img
                    src={DEBRIS_IMAGES[item.id]}
                    alt={item.name}
                    className="w-full h-36 object-cover rounded-lg"
                  />
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="w-9 h-9 rounded-lg bg-[#f8fafc] border border-slate-200 flex items-center justify-center text-[#0f2942] shrink-0 transition-colors duration-200 group-hover/card:border-sky-200 group-hover/card:bg-sky-50">
                        <DebrisIcon className="w-4 h-4" />
                      </div>
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${item.hazardText}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${item.hazardDot}`} />
                        <span>Bahaya: {item.hazardLevel}</span>
                      </span>
                    </div>

                    <div>
                      <div className="flex items-baseline justify-between mb-1.5">
                        <h4 className="text-sm font-bold text-[#0f2942]">
                          {item.name}
                        </h4>
                        <span className="text-lg font-mono font-extrabold text-[#0f2942] tabular-nums">
                          {item.percentage}%
                        </span>
                      </div>

                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.barColor}`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-slate-400 text-[11px] block">Contoh Objek:</span>
                        <span className="text-slate-700 font-medium leading-snug">
                          {item.examples}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="text-slate-500">Waktu Terurai</span>
                        <span className="font-mono font-semibold text-[#0f2942]">{item.degradeTime}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {item.ecologicalEffect}
                  </p>
                </SpotlightCard>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AngkeDebrisEducation;
