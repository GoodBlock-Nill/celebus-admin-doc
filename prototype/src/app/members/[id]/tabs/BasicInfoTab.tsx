'use client';

import { useState } from 'react';
import { UserCircleIcon, ShieldCheckIcon, InformationCircleIcon, PencilIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import type { Member } from '@/mock/members';
import { LOGIN_LABEL, STATUS_LABEL } from '@/mock/members';

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <Icon className="w-5 h-5 text-indigo-600" />
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <div className="text-sm font-semibold text-gray-900">{children}</div>
    </div>
  );
}

export default function BasicInfoTab({ member }: { member: Member }) {
  const [suspended, setSuspended] = useState(member.accountStatus === 'SUSPENDED');
  const statusCfg = STATUS_LABEL[member.accountStatus];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* 기본정보 */}
        <Section title="기본정보" icon={UserCircleIcon}>
          <Field label="유저명">
            <div className="flex items-center gap-2">
              <span>{member.nickname || '-'}</span>
              <button className="text-gray-400 hover:text-gray-600" aria-label="유저명 수정">
                <PencilIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </Field>
          <Field label="이메일">{member.email}</Field>
          <Field label="전화번호">
            <span className="text-gray-700 font-normal">{member.phoneCountry} </span>
            {member.phone}
          </Field>
          <Field label="국가">{member.country}</Field>
          <Field label="로그인 방식">{LOGIN_LABEL[member.loginType]}</Field>
          <Field label="가입일시">{member.joinedAt}</Field>
          <Field label="최근로그인">{member.lastLoginAt}</Field>
        </Section>

        {/* 상태정보 */}
        <Section title="상태정보" icon={ShieldCheckIcon}>
          <Field label="계정상태">
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}>
              ● {statusCfg.label}
            </span>
          </Field>

          <div>
            <p className="text-xs text-gray-500 mb-2">계정정지</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSuspended(!suspended)}
                role="switch"
                aria-checked={suspended}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  suspended ? 'bg-red-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    suspended ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${suspended ? 'text-red-600' : 'text-gray-900'}`}>
                {suspended ? '정지' : '정상'}
              </span>
            </div>
          </div>

          <Field label="DID발급">
            <span className="inline-flex items-center gap-1.5">
              {member.didIssued ? (
                <>
                  <CheckCircleIcon className="w-4 h-4 text-green-600" />
                  <span>발급됨</span>
                </>
              ) : (
                <>
                  <XCircleIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">미발급</span>
                </>
              )}
            </span>
          </Field>

          <Field label="Set Approval">
            <span className="inline-flex items-center gap-1.5">
              {member.setApprovalGranted ? (
                <>
                  <CheckCircleIcon className="w-4 h-4 text-green-600" />
                  <span>승인됨</span>
                </>
              ) : (
                <>
                  <XCircleIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">미승인</span>
                </>
              )}
            </span>
          </Field>
        </Section>
      </div>

      {/* 추가정보 */}
      <Section title="추가정보" icon={InformationCircleIcon}>
        <Field label="지갑주소">
          {member.walletAddress ? (
            <span className="font-mono text-xs">{member.walletAddress}</span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </Field>
        <Field label="소개">{member.bio || <span className="text-gray-400">-</span>}</Field>
      </Section>
    </div>
  );
}
