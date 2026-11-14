import React from 'react';
import { getCapacityCategory } from '../../data/mockData';

interface CapacityGaugeProps {
  percentage: number;
  size?: number;
  showCategoryLabel?: boolean;
}

export const CapacityGauge: React.FC<CapacityGaugeProps> = ({
  percentage,
  size = 180,
  showCategoryLabel = true,
}) => {
  const category = getCapacityCategory(percentage);

  // Determine colors based on category
  let strokeColor = '#00B4D8'; // Turquoise for 1-79%
  let statusTextColor = 'text-cyan-600';
  let statusBg = 'bg-cyan-50 border-cyan-200 text-cyan-800';

  if (percentage === 0) {
    strokeColor = '#94A3B8'; // Slate for Kosong
    statusTextColor = 'text-slate-500';
    statusBg = 'bg-slate-100 border-slate-200 text-slate-700';
  } else if (percentage >= 90) {
    strokeColor = '#DC2626'; // Red for Penuh
    statusTextColor = 'text-red-600';
    statusBg = 'bg-red-50 border-red-200 text-red-800';
  } else if (percentage >= 80) {
    strokeColor = '#D97706'; // Amber for Hampir Penuh
    statusTextColor = 'text-amber-600';
    statusBg = 'bg-amber-50 border-amber-200 text-amber-800';
  }

  // Circular progress calculations
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Arc angle (260 degree arc for gauge appearance)
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (arcLength * Math.min(100, Math.max(0, percentage))) / 100;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size * 0.88 }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform rotate-[135deg] overflow-visible"
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />

          {/* Active value track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>

        {/* Center content */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center ${size < 120 ? 'pt-0' : 'pt-2'}`}>
          <span className={`${size < 120 ? 'text-lg font-bold' : 'text-3xl lg:text-4xl font-extrabold'} tracking-tight text-slate-900 font-mono tabular-nums leading-none`}>
            {percentage}%
          </span>
          <span className={`${size < 120 ? 'text-[10px] mt-1' : 'text-xs mt-0.5'} uppercase tracking-wider text-slate-600 font-medium`}>
            Kapasitas
          </span>
        </div>
      </div>

      {showCategoryLabel && (
        <div className="mt-1 flex items-center gap-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-md border ${statusBg}`}>
            {category}
          </span>
          {percentage >= 80 && (
            <span className="text-xs font-medium text-amber-700 animate-pulse">
              Peringatan Segera Evakuasi!
            </span>
          )}
        </div>
      )}
    </div>
  );
};
