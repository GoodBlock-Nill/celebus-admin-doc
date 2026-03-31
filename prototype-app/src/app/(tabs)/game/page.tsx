'use client';

import Link from 'next/link';

const GAME_CARDS = [
  {
    emoji: '🎯',
    title: 'Prediction Market',
    desc: 'V01D의 미래를 예측해보세요',
    href: '/prediction',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    emoji: '🧠',
    title: 'Survival Trivia',
    desc: 'V01D 퀴즈에 도전하세요',
    href: '/trivia',
    color: 'from-emerald-500 to-teal-500',
  },
];

const QUICK_LINKS = [
  { emoji: '💱', label: 'GP 교환소', href: '/exchange' },
  { emoji: '📋', label: 'GP 내역', href: '/history' },
];

export default function GamePage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-br from-[#0F0A1A] via-violet-900 to-violet-700 px-5 pt-10 pb-6">
        <p className="text-violet-300 text-xs font-medium tracking-wider">🎮 게임존</p>
        <h1 className="text-2xl font-black text-white mt-1">Game Zone</h1>
        <p className="text-violet-200/70 text-xs mt-1">GP를 걸고 예측하고, 퀴즈에 도전하세요</p>
      </div>

      <div className="space-y-4 -mt-2 pt-4 px-4">
        {GAME_CARDS.map((card) => (
          <Link key={card.href} href={card.href}>
            <div
              className={`p-5 bg-gradient-to-r ${card.color} rounded-2xl text-white active:opacity-90 transition-opacity mb-4`}
            >
              <span className="text-3xl">{card.emoji}</span>
              <h2 className="text-lg font-bold mt-2">{card.title}</h2>
              <p className="text-white/80 text-xs mt-1">{card.desc}</p>
              <span className="inline-block mt-3 text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">
                참여하기 →
              </span>
            </div>
          </Link>
        ))}

        <div className="flex gap-3">
          {QUICK_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="flex-1">
              <div className="p-4 bg-white rounded-xl border border-gray-200 text-center active:bg-gray-50">
                <span className="text-2xl">{link.emoji}</span>
                <p className="text-xs font-semibold text-gray-700 mt-1">{link.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
