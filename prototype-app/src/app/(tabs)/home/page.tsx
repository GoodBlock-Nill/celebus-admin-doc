'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useArtistStore } from '@/stores/useArtistStore';
import { useUIStore } from '@/stores/useUIStore';
import Toast from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

type DebugPreset = 'login-content' | 'login-empty' | 'guest-content' | 'guest-empty';

const BANNERS = [
  { id: 'b1', title: 'V01D 사인앨범 래플', subtitle: 'D-5 | 참여하기', active: true },
  { id: 'b2', title: 'V01D 커피차 서포트', subtitle: '목표 70% 달성중', active: true },
  { id: 'b3', title: '봄맞이 스트리밍 이벤트', subtitle: '마감', active: false },
];

export default function HomePage() {
  const router = useRouter();
  const artist = useArtistStore((s) => s.activeArtist);
  const addToast = useUIStore((s) => s.addToast);

  const [bannerFilter, setBannerFilter] = useState<'active' | 'ended'>('active');
  const [bannerIdx, setBannerIdx] = useState(0);
  const [checkedIn, setCheckedIn] = useState(false);
  const [missionDone, setMissionDone] = useState(false);
  const [streak, setStreak] = useState(12);
  const [preset, setPreset] = useState<DebugPreset>('login-content');
  const [debugOpen, setDebugOpen] = useState(false);

  const isLoggedIn = preset === 'login-content' || preset === 'login-empty';
  const hasContent = preset === 'login-content' || preset === 'guest-content';
  const allDone = checkedIn && missionDone;

  const banners = hasContent ? BANNERS : [];
  const filteredBanners = banners.filter((b) => bannerFilter === 'active' ? b.active : !b.active);

  const handleCheckIn = useCallback(() => {
    if (!isLoggedIn) { addToast('info', '로그인이 필요합니다'); return; }
    if (checkedIn) return;
    setCheckedIn(true);
    setStreak((s) => s + 1);
    addToast('success', '출석 완료! 덕력 10pt 획득');
  }, [checkedIn, isLoggedIn, addToast]);

  const handleLoginAction = (label: string) => {
    if (!isLoggedIn) { addToast('info', `로그인 후 이용 가능합니다 (${label})`); return; }
  };

  const switchPreset = (p: DebugPreset) => {
    setPreset(p);
    setDebugOpen(false);
    setCheckedIn(false);
    setMissionDone(false);
    if (p === 'login-content' || p === 'guest-content') setStreak(12);
    else setStreak(0);
  };

  return (
    <div className="min-h-dvh bg-white pb-20">
      <Toast />

      {/* 비로그인 상태 배너 */}
      {!isLoggedIn && (
        <div className="bg-violet-600 text-white text-center py-1.5 text-[10px] font-medium">
          👀 비로그인 미리보기 모드
        </div>
      )}

      {/* 1. 헤더 */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 safe-top">
        <div className="flex items-center h-12 px-4">
          <span className="text-base font-bold text-violet-700 flex-1">CELEBUS</span>
          <button className="relative mr-3" onClick={() => isLoggedIn ? addToast('info', '알림 (준비 중)') : handleLoginAction('알림')}>
            <span className="text-lg">🔔</span>
            {isLoggedIn && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center font-bold">3</span>
            )}
          </button>
          <button onClick={() => isLoggedIn ? addToast('info', '응모권 내역 (CEB-FQ-210)') : handleLoginAction('응모권')}
            className="text-xs font-medium text-violet-600 bg-violet-50 px-2.5 py-1 rounded-lg">
            응모 {isLoggedIn ? '15' : '-'}
          </button>
        </div>
      </div>

      {/* 2. 캐러셀 배너 */}
      <div className="px-4 mt-3">
        <div className="relative bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl overflow-hidden h-36">
          <button onClick={() => router.push('/events')} className="absolute top-3 right-4 z-10 text-[11px] font-semibold text-white bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full hover:bg-white/30 transition-colors">
            전체 보기 →
          </button>
          <div className="absolute inset-0 flex items-end px-5 pb-4">
            <div>
              {filteredBanners.length > 0 ? (
                <>
                  <p className="text-white text-sm font-bold">{filteredBanners[bannerIdx % filteredBanners.length]?.title}</p>
                  <p className="text-white/70 text-xs mt-0.5">{filteredBanners[bannerIdx % filteredBanners.length]?.subtitle}</p>
                </>
              ) : (
                <>
                  <p className="text-white/80 text-sm font-bold">이벤트 준비 중</p>
                  <p className="text-white/50 text-xs mt-0.5">곧 새로운 이벤트가 찾아올 거예요!</p>
                </>
              )}
            </div>
          </div>
          {filteredBanners.length > 1 && (
            <div className="absolute bottom-2 right-4 flex gap-1">
              {filteredBanners.map((_, i) => (
                <div key={i} className={cn('w-1.5 h-1.5 rounded-full', i === bannerIdx % filteredBanners.length ? 'bg-white' : 'bg-white/40')} />
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-2">
          {[
            { key: 'active' as const, label: '진행중' },
            { key: 'ended' as const, label: '마감됨' },
          ].map((tab) => (
            <button key={tab.key} onClick={() => { setBannerFilter(tab.key); setBannerIdx(0); }}
              className={cn('px-3 py-1.5 rounded-full text-[10px] font-semibold', bannerFilter === tab.key ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-500')}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. 아티스트 선택 */}
      <div className="px-4 mt-4 flex items-center gap-3">
        <button onClick={() => !isLoggedIn && handleLoginAction('아티스트 전환')} className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-violet-100 border-2 border-violet-500 flex items-center justify-center overflow-hidden">
            <img src={artist.logoUrl} alt={artist.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <span className="text-[9px] font-semibold text-violet-700">{artist.name}</span>
        </button>
        <button onClick={() => isLoggedIn ? router.push('/artist-discover') : handleLoginAction('아티스트 추가')} className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-xl text-gray-400">+</span>
          </div>
          <span className="text-[9px] text-gray-400">추가</span>
        </button>
      </div>

      {/* ── 선택된 아티스트 기준 ── */}
      <div className="px-4 mt-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-[9px] text-gray-300">{artist.name} 기준</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>
      </div>

      {/* 4. 오늘의 할 일 (컴팩트) */}
      <div className="px-4">
        {!isLoggedIn ? (
          /* 비로그인 */
          <button onClick={() => handleLoginAction('로그인')}
            className="w-full bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-xl px-4 py-4 text-center active:scale-[0.98] transition-transform">
            <p className="text-sm font-semibold text-violet-700">로그인하고 시작하기</p>
            <p className="text-[10px] text-violet-500 mt-1">출석, 미션, 응모권이 기다리고 있어요!</p>
          </button>
        ) : allDone ? (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center">
            <span className="text-sm font-semibold text-green-700">✅ 오늘 할 일 완료! 🔥{streak}일째</span>
          </div>
        ) : (
          <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold text-amber-600">🔥 {streak > 0 ? `${streak}일째` : '시작!'}</span>
              <div className="flex-1" />
              <button onClick={handleCheckIn} className="flex items-center gap-1">
                <span className="text-sm">{checkedIn ? '✅' : '☐'}</span>
                <span className={cn('text-[10px]', checkedIn ? 'text-green-600' : 'text-gray-500')}>출석</span>
              </button>
              <button onClick={() => { setMissionDone(true); addToast('success', '미션 완료! 덕력 20pt 획득'); }} className="flex items-center gap-1">
                <span className="text-sm">{missionDone ? '✅' : '☐'}</span>
                <span className={cn('text-[10px]', missionDone ? 'text-green-600' : 'text-gray-500')}>미션</span>
              </button>
            </div>
            <div className="flex items-center">
              <span className="text-xs text-violet-700 flex-1">{hasContent ? '☐ 이번 주 퀘스트: 2/5장' : '☐ 이번 주 퀘스트: 0/5장'}</span>
              <button onClick={() => router.push('/quest')} className="text-[10px] font-semibold text-violet-600">이어서 →</button>
            </div>
          </div>
        )}
      </div>

      {/* 5. 핵심 추천 1개 */}
      <div className="px-4 mt-4">
        <button onClick={() => isLoggedIn ? router.push('/quest') : handleLoginAction('퀘스트')}
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-4 text-left active:scale-[0.98] transition-transform">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎯</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">
                {hasContent ? `${artist.name} 챌린지 2/5장 진행중` : `${artist.name} 챌린지를 시작해보세요!`}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {hasContent ? '다음 장을 열어볼까요?' : '5장의 스토리가 기다리고 있어요'}
              </p>
            </div>
            <span className="text-xs font-medium text-violet-600">{hasContent ? '이어하기 →' : '시작하기 →'}</span>
          </div>
        </button>
      </div>

      {/* 6. 바로가기 */}
      <div className="px-4 mt-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">바로가기</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        <div className="space-y-2">

          {/* 키우기 */}
          <button onClick={() => isLoggedIn ? router.push('/fandom-level') : handleLoginAction('키우기')}
            className="w-full bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl px-4 py-3.5 text-left active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <span className="text-lg">🏆</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">{hasContent ? 'Lv.3' : 'Lv.1'}</span>
                  <p className="text-xs font-semibold text-gray-900 truncate">{artist.name} 키우기</p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-amber-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: hasContent ? '60%' : '0%' }} />
                  </div>
                  <span className="text-[9px] text-amber-600 shrink-0">{hasContent ? '60%' : '0%'}</span>
                </div>
              </div>
              <span className="text-xs text-amber-600 font-medium shrink-0">→</span>
            </div>
          </button>

          {/* 응원하기 */}
          <button onClick={() => isLoggedIn ? router.push('/support') : handleLoginAction('응원')}
            className="w-full bg-gradient-to-r from-violet-50 to-pink-50 border border-violet-200 rounded-xl px-4 py-3.5 text-left active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                <span className="text-lg">💜</span>
              </div>
              <div className="flex-1 min-w-0">
                {hasContent ? (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-semibold text-pink-600 bg-pink-100 px-1.5 py-0.5 rounded-full">달성 임박!</span>
                      <p className="text-xs font-semibold text-gray-900 truncate">☕ 커피차 서포트</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-violet-100 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-500 rounded-full" style={{ width: '85%' }} />
                      </div>
                      <span className="text-[9px] text-violet-600 shrink-0">85%</span>
                    </div>
                  </>
                ) : (
                  <p className="text-xs font-semibold text-gray-500">서포트 이벤트 준비 중! 덕력을 모아두세요 💜</p>
                )}
              </div>
              <span className="text-xs text-violet-600 font-medium shrink-0">→</span>
            </div>
          </button>

          {/* 오늘의 일정/소식 */}
          <button onClick={() => isLoggedIn ? router.push('/info') : handleLoginAction('정보')}
            className="w-full bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl px-4 py-3.5 text-left active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <span className="text-lg">📅</span>
              </div>
              <div className="flex-1 min-w-0">
                {hasContent ? (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-semibold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">오늘</span>
                      <p className="text-xs font-semibold text-gray-900 truncate">14:00 음악중심 출연</p>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5 truncate">📰 신곡 뮤비 티저 공개 · +2건</p>
                  </>
                ) : (
                  <p className="text-xs font-semibold text-gray-500">새 소식이 올 때 알려드릴게요</p>
                )}
              </div>
              <span className="text-xs text-blue-500 font-medium shrink-0">→</span>
            </div>
          </button>

          {/* Raffle */}
          <button onClick={() => isLoggedIn ? router.push('/raffle') : handleLoginAction('래플')}
            className="w-full bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-xl px-4 py-3.5 text-left active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center shrink-0">
                <span className="text-lg">🎁</span>
              </div>
              <div className="flex-1 min-w-0">
                {hasContent ? (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-semibold text-pink-600 bg-pink-100 px-1.5 py-0.5 rounded-full">D-5</span>
                      <p className="text-xs font-semibold text-gray-900 truncate">사인앨범 래플</p>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5">{isLoggedIn ? '128명 참여중 · 응모권 15장 보유' : '128명 참여중'}</p>
                  </>
                ) : (
                  <p className="text-xs font-semibold text-gray-500">새 래플 준비 중!</p>
                )}
              </div>
              <span className="text-xs text-pink-500 font-medium shrink-0">{hasContent ? '응모 →' : '→'}</span>
            </div>
          </button>

        </div>
      </div>

      {/* 7. BIVE 컬렉션 프리뷰 */}
      <div className="px-4 mt-6 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">🃏 이런 BIVE를 모을 수 있어요</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {hasContent ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'V01D 데뷔 포토', grade: 'Grade 1', emoji: '📸', owned: isLoggedIn },
                { name: 'V01D 콘서트 메모리', grade: 'Grade 2', emoji: '🎤', owned: false },
                { name: 'V01D 음방 1위', grade: 'Grade 3', emoji: '🏆', owned: false },
                { name: 'V01D 스페셜 에디션', grade: '스페셜', emoji: '✨', owned: false },
              ].map((bive) => (
                <button key={bive.name}
                  onClick={() => addToast('info', `${bive.name} 미리보기 (바텀시트)`)}
                  className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-xl p-3 text-left active:scale-[0.97] transition-transform relative">
                  <div className="w-full aspect-square rounded-lg bg-violet-100 flex items-center justify-center mb-2">
                    <span className="text-3xl">{bive.emoji}</span>
                  </div>
                  <p className="text-[10px] font-bold text-gray-900 truncate">{bive.name}</p>
                  <span className="text-[8px] text-violet-500 font-medium">{bive.grade}</span>
                  {bive.owned && (
                    <span className="absolute top-2 right-2 text-[8px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">보유 중</span>
                  )}
                </button>
              ))}
            </div>
            <button onClick={() => isLoggedIn ? router.push('/collection') : addToast('info', '로그인 후 컬렉션을 확인할 수 있어요')}
              className="w-full mt-3 py-2.5 text-center text-xs font-semibold text-violet-600 bg-violet-50 rounded-xl active:bg-violet-100 transition-colors">
              전체 컬렉션 보기 →
            </button>
          </>
        ) : (
          <div className="text-center py-8">
            <span className="text-2xl">🃏</span>
            <p className="text-xs text-gray-400 mt-2">곧 첫 BIVE가 등록될 거예요!</p>
          </div>
        )}
      </div>

      {/* 플로팅 디버그 */}
      <div className="fixed bottom-20 right-4 z-50">
        {debugOpen && (
          <div className="mb-2 flex flex-col gap-1.5 animate-slideInUp">
            {[
              { key: 'login-content' as const, label: '로그인+콘텐츠' },
              { key: 'login-empty' as const, label: '로그인+Empty' },
              { key: 'guest-content' as const, label: '비로그인+콘텐츠' },
              { key: 'guest-empty' as const, label: '비로그인+Empty' },
            ].map((p) => (
              <button key={p.key} onClick={() => switchPreset(p.key)}
                className={cn('px-3 py-2 rounded-xl shadow-md text-[10px] font-semibold whitespace-nowrap', p.key === preset ? 'bg-violet-600 text-white' : 'bg-white border border-gray-200 text-gray-700')}>
                {p.label}
              </button>
            ))}
          </div>
        )}
        <button onClick={() => setDebugOpen(!debugOpen)} className="px-3 py-2.5 rounded-full bg-gray-900 text-white shadow-lg flex items-center gap-1.5 active:scale-95 transition-transform">
          <span className="text-[10px] font-semibold">{preset === 'login-content' ? '로그인+콘텐츠' : preset === 'login-empty' ? '로그인+Empty' : preset === 'guest-content' ? '비로그인+콘텐츠' : '비로그인+Empty'}</span>
          <span className="text-[8px]">▲</span>
        </button>
      </div>
    </div>
  );
}
