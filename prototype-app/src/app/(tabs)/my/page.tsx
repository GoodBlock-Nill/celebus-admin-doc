'use client';

import { useState } from 'react';
import { Check, Globe, Bell, ChevronRight } from 'lucide-react';
import AppHeader from '@/components/layout/AppHeader';
import { Card } from '@/components/ui/primitives';
import { LANGUAGES, NOTI_SETTINGS } from '@/lib/data';
import { cn } from '@/lib/utils';

export default function MyPage() {
  const [lang, setLang] = useState('ko');
  const [noti, setNoti] = useState(() => Object.fromEntries(NOTI_SETTINGS.filter((n) => n.kind === 'toggle').map((n) => [n.key, (n as { on: boolean }).on])));

  return (
    <div>
      <AppHeader />
      <div className="space-y-6 px-4 pt-4">
        <h1 className="text-[20px] font-bold">설정</h1>

        {/* 언어 */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Globe className="size-5 text-primary" />
            <div>
              <p className="text-[15px] font-semibold">언어</p>
              <p className="text-[12px] text-text-body">사용할 언어를 선택하세요</p>
            </div>
          </div>
          <Card className="divide-y divide-border-card">
            {LANGUAGES.map((l) => (
              <button key={l.code} onClick={() => setLang(l.code)} className="flex w-full items-center justify-between p-3.5 text-[14px]">
                {l.label}
                {lang === l.code && <Check className="size-4 text-primary" />}
              </button>
            ))}
          </Card>
        </section>

        {/* 알림 설정 */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Bell className="size-5 text-primary" />
            <p className="text-[15px] font-semibold">알림 설정</p>
          </div>
          <Card className="divide-y divide-border-card">
            {NOTI_SETTINGS.map((n) => (
              <div key={n.key} className="flex items-center justify-between p-3.5">
                <div>
                  <p className="text-[14px]">{n.title}</p>
                  <p className="text-[12px] text-text-disabled">{n.desc}</p>
                </div>
                {n.kind === 'link' ? (
                  <ChevronRight className="size-4 text-text-disabled" />
                ) : (
                  <button
                    onClick={() => setNoti((s) => ({ ...s, [n.key]: !s[n.key] }))}
                    className={cn('relative h-6 w-11 rounded-full transition-colors', noti[n.key] ? 'bg-primary' : 'bg-muted')}
                  >
                    <span className={cn('absolute top-0.5 size-5 rounded-full bg-white transition-all', noti[n.key] ? 'left-[22px]' : 'left-0.5')} />
                  </button>
                )}
              </div>
            ))}
          </Card>
        </section>
      </div>
    </div>
  );
}
