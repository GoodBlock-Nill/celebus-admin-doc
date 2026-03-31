'use client';

import TicketBalance from '@/components/fan-quest/ui/TicketBalance';

export default function HeroBanner() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#0F0A1A] via-violet-900 to-violet-700 px-5 pt-12 pb-8">
      {/* Sparkle dots */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full animate-sparkle"
            style={{
              left: `${10 + (i * 7.5) % 90}%`,
              top: `${15 + (i * 13) % 70}%`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      {/* Ambient glow orbs */}
      <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-violet-500/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-4 w-32 h-32 rounded-full bg-fuchsia-600/20 blur-3xl pointer-events-none" />

      {/* Ticket balance */}
      <div className="absolute top-4 right-4 z-10">
        <TicketBalance size="sm" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <p className="text-violet-300 text-xs font-medium tracking-[0.2em] mb-1 uppercase">
          CELEBUS × V01D
        </p>
        <h1
          className="text-5xl font-black text-white tracking-tight leading-none"
          style={{ textShadow: '0 0 40px rgba(167, 139, 250, 0.6), 0 0 80px rgba(124, 58, 237, 0.3)' }}
        >
          V01D
        </h1>
        <p className="text-violet-200/80 text-sm mt-2 font-light">
          덕질하면 V01D를 만날 수 있어
        </p>

        {/* Album chip */}
        <div className="flex items-center gap-2 mt-3">
          <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 text-[10px] font-semibold px-2.5 py-1 rounded-full tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-300 animate-pulse" />
            1st Mini Album [01]
          </span>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-gray-50 to-transparent" />
    </div>
  );
}
