import React, { useRef } from 'react';

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  variant?: 'light' | 'subtle' | 'dark';
  hoverLift?: boolean;
  onClick?: () => void;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  contentClassName = '',
  variant = 'light',
  hoverLift = true,
  onClick,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };

  const baseSurface =
    variant === 'dark'
      ? 'bg-[#0f2942] border-[#1e3a8a] text-white hover:border-sky-400/60 hover:shadow-[0_14px_32px_-12px_rgba(15,41,66,0.32)]'
      : variant === 'subtle'
      ? 'bg-[#f8fafc] border-slate-200 hover:bg-white hover:border-sky-300 hover:shadow-[0_8px_20px_-10px_rgba(15,41,66,0.09)]'
      : 'bg-white border-slate-200 hover:border-sky-300 hover:shadow-[0_12px_28px_-12px_rgba(15,41,66,0.12)]';

  const liftClass = hoverLift ? 'hover:-translate-y-1' : '';

  const spotlightGradient =
    variant === 'dark'
      ? 'radial-gradient(420px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(56, 189, 248, 0.14), transparent 70%)'
      : 'radial-gradient(360px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(56, 189, 248, 0.11), transparent 70%)';

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onClick={onClick}
      className={`group/card relative overflow-hidden rounded-xl border transition-all duration-300 ease-out ${baseSurface} ${liftClass} ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 ease-out"
        style={{ background: spotlightGradient }}
      />
      <div className={`relative z-10 h-full ${contentClassName}`}>
        {children}
      </div>
    </div>
  );
};
