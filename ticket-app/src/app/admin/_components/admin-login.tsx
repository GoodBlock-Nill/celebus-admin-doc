'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { FormEvent } from 'react';

import { Button, Field, TextInput } from './form';
import { adminApi } from '@/lib/admin-client';

/** 관리자 로그인 — 관리자 키 + 처리자 이름 (설계서 §3.3) */
export function AdminLogin() {
  const router = useRouter();
  const [key, setKey] = useState('');
  const [adminName, setAdminName] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setReason('');

    const result = await adminApi.login(key, adminName);
    setSubmitting(false);

    if (!result.ok) {
      setReason(result.reason);
      return;
    }
    setKey('');
    router.refresh();
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#F5F6F8] px-4 text-[#1B1D22]">
      <div className="w-full max-w-[400px] rounded-xl border border-[#E3E5EA] bg-white p-6 shadow-[0_1px_2px_rgba(27,29,34,0.04)]">
        <p className="text-[11px] font-bold tracking-[0.14em] text-[#3056D3]">CELEBUS ADMIN</p>
        <h1 className="mt-1 text-[20px] font-bold">티켓 예매 관리자</h1>
        <p className="mt-2 text-[12.5px] leading-relaxed text-[#6B7080]">
          관리자 키와 처리자 이름을 입력해 주세요. 입력한 이름은 입금 확인·티켓 지급·환불 등 모든 처리 기록에 남습니다.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
          <Field label="처리자 이름" required hint="한글 2~10자 (예: 홍길동)">
            <TextInput
              value={adminName}
              onChange={(event) => setAdminName(event.target.value)}
              placeholder="예) 홍길동"
              maxLength={10}
              autoComplete="off"
            />
          </Field>
          <Field label="관리자 키" required>
            <TextInput
              type="password"
              value={key}
              onChange={(event) => setKey(event.target.value)}
              placeholder="관리자 키"
              autoComplete="current-password"
            />
          </Field>

          {reason ? (
            <p
              role="alert"
              className="rounded-lg border border-[#F2C7BD] bg-[#FBEDEA] px-3 py-2 text-[12.5px] leading-relaxed text-[#C2402A]"
            >
              {reason}
            </p>
          ) : null}

          <Button type="submit" variant="primary" disabled={submitting || !key || !adminName}>
            {submitting ? '확인 중…' : '로그인'}
          </Button>
        </form>
      </div>
    </main>
  );
}
