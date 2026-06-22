'use client';

import { useState } from 'react';
import {
  ChevronUpDownIcon,
  GlobeAltIcon,
  UserGroupIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import {
  ACTIVE_ARTISTS,
  MOCK_UPLOADED_MEMBERS,
  NOTI_CATEGORIES,
  NOTI_CATEGORY_LABEL,
  type Notification,
  type NotiCategory,
  type NotiChannel,
  type NotiScheduleType,
  type NotiTargetType,
  type UploadedMember,
} from '@/mock/notifications';
import DeeplinkPicker from '@/components/shared/DeeplinkPicker';
import DataTable from '@/components/ui/DataTable';
import Pagination from '@/components/ui/Pagination';
import { emptyDeeplink, type Deeplink } from '@/types/deeplink';

type Lang = 'ko' | 'en' | 'jp';

export interface NotificationFormState {
  titleKo: string;
  titleEn: string;
  titleJp: string;
  bodyKo: string;
  bodyEn: string;
  bodyJp: string;
  pushShortKo: string;
  pushShortEn: string;
  pushShortJp: string;
  channel: NotiChannel;
  category?: NotiCategory; // 필수 선택 (미선택 시 발송·예약 차단)
  targetType: NotiTargetType;
  targetArtist?: string;
  targetMemberCount: number;
  scheduleType: NotiScheduleType;
  sendAt: string;
  deeplink: Deeplink;
}

export function emptyFormState(): NotificationFormState {
  return {
    titleKo: '',
    titleEn: '',
    titleJp: '',
    bodyKo: '',
    bodyEn: '',
    bodyJp: '',
    pushShortKo: '',
    pushShortEn: '',
    pushShortJp: '',
    channel: 'BASIC_PUSH',
    category: undefined, // 필수 — 운영자가 선택
    targetType: 'GLOBAL',
    targetArtist: 'V01D',
    targetMemberCount: 0,
    scheduleType: 'IMMEDIATE',
    sendAt: '',
    deeplink: emptyDeeplink(),
  };
}

export function fromNotification(n: Notification): NotificationFormState {
  return {
    titleKo: n.title.ko,
    titleEn: n.title.en,
    titleJp: n.title.jp,
    bodyKo: n.body.ko,
    bodyEn: n.body.en,
    bodyJp: n.body.jp,
    pushShortKo: n.pushShort?.ko ?? '',
    pushShortEn: n.pushShort?.en ?? '',
    pushShortJp: n.pushShort?.jp ?? '',
    channel: n.channel,
    category: n.category,
    targetType: n.targetType,
    targetArtist: n.targetArtist ?? 'V01D',
    targetMemberCount: n.targetMemberCount ?? 0,
    scheduleType: n.scheduleType,
    sendAt: n.sendAt ?? '',
    deeplink: {
      sourceType: n.deeplinkSourceType ?? '',
      url: n.deeplinkLabel ?? '',
    },
  };
}

interface Props {
  readOnly?: boolean;
  initial: NotificationFormState;
}

export default function NotificationForm({ readOnly = false, initial }: Props) {
  const [state, setState] = useState<NotificationFormState>(initial);
  const set = <K extends keyof NotificationFormState>(k: K, v: NotificationFormState[K]) =>
    setState((s) => ({ ...s, [k]: v }));

  const disabled = readOnly;

  // 특정 회원 그룹 — CSV 업로드 명단 (이메일 매칭). 첨부 시 mock 명단 로드
  const [members, setMembers] = useState<UploadedMember[]>(
    initial.targetMemberCount > 0 ? MOCK_UPLOADED_MEMBERS : [],
  );
  const [memberPage, setMemberPage] = useState(1);
  const MEMBER_PER_PAGE = 20;
  const memberTotalPages = Math.max(1, Math.ceil(members.length / MEMBER_PER_PAGE));
  const pagedMembers = members.slice(
    (memberPage - 1) * MEMBER_PER_PAGE,
    memberPage * MEMBER_PER_PAGE,
  );
  const attachCsv = () => {
    setMembers(MOCK_UPLOADED_MEMBERS);
    setMemberPage(1);
    set('targetMemberCount', MOCK_UPLOADED_MEMBERS.length);
  };

  return (
    <div className="space-y-6">
      {/* A. 메시지 다국어 */}
      <Section title="A. 메시지 (다국어)" subtitle="KO/EN/JP 모두 입력 시 발송 가능">
        <LangBlock
          label="제목"
          required
          max={50}
          ko={state.titleKo}
          en={state.titleEn}
          jp={state.titleJp}
          onChange={(lang, v) =>
            set(lang === 'ko' ? 'titleKo' : lang === 'en' ? 'titleEn' : 'titleJp', v)
          }
          disabled={disabled}
        />
        <LangBlock
          label="본문"
          required
          max={200}
          textarea
          ko={state.bodyKo}
          en={state.bodyEn}
          jp={state.bodyJp}
          onChange={(lang, v) =>
            set(lang === 'ko' ? 'bodyKo' : lang === 'en' ? 'bodyEn' : 'bodyJp', v)
          }
          disabled={disabled}
        />
        <LangBlock
          label="푸시 짧은 메시지 (선택)"
          max={65}
          ko={state.pushShortKo}
          en={state.pushShortEn}
          jp={state.pushShortJp}
          onChange={(lang, v) =>
            set(
              lang === 'ko' ? 'pushShortKo' : lang === 'en' ? 'pushShortEn' : 'pushShortJp',
              v,
            )
          }
          disabled={disabled}
          hint="미입력 시 제목 자동 사용"
        />
      </Section>

      {/* C. 채널 */}
      <Section title="B. 채널" subtitle="기본알림은 항상 ON · 푸시는 토글로 OFF 가능">
        <div className="grid grid-cols-2 gap-3">
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 opacity-90">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">기본알림</p>
                <p className="text-xs text-gray-500 mt-0.5">인앱 알림센터 (회원 앱 알림 리스트)</p>
              </div>
              <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-emerald-100 text-emerald-700">
                항상 ON
              </span>
            </div>
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={() => set('channel', state.channel === 'BASIC_PUSH' ? 'BASIC_ONLY' : 'BASIC_PUSH')}
            className={`border rounded-lg p-4 text-left transition ${
              state.channel === 'BASIC_PUSH'
                ? 'border-emerald-300 bg-emerald-50/50'
                : 'border-gray-200 bg-white'
            } ${disabled ? 'opacity-70 cursor-not-allowed' : 'hover:border-emerald-400'}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">푸시알림</p>
                <p className="text-xs text-gray-500 mt-0.5">Web Push (PWA · iOS는 홈 화면 추가된 회원만 수신)</p>
              </div>
              <Toggle on={state.channel === 'BASIC_PUSH'} />
            </div>
            {state.channel === 'BASIC_ONLY' && (
              <p className="mt-2 text-xs text-amber-700">
                푸시 OFF — 기본알림만 생성. 회원 OS 알림에 표시되지 않습니다.
              </p>
            )}
          </button>
        </div>
      </Section>

      {/* C. 대상 */}
      <Section title="C. 대상" subtitle="카테고리(필수) + 전역 / 아티스트 팬덤 / 특정 회원 그룹">
        {/* C-1. 카테고리 (공통·필수) */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            카테고리 <span className="text-rose-500">*</span>
            <span className="ml-1 text-gray-400 font-normal">회원 앱 알림함 분류·필터 기준</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {NOTI_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                disabled={disabled}
                onClick={() => set('category', c)}
                className={`h-9 px-4 rounded-lg text-sm font-medium border transition ${
                  state.category === c
                    ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-300'
                } ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {NOTI_CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
          {!state.category && <p className="mt-1.5 text-xs text-rose-500">카테고리를 선택해주세요. (발송 필수)</p>}
        </div>

        {/* C-2. 대상 종류 */}
        <div className="grid grid-cols-3 gap-3">
          <TargetCard
            active={state.targetType === 'GLOBAL'}
            disabled={disabled}
            onClick={() => set('targetType', 'GLOBAL')}
            icon={GlobeAltIcon}
            title="전역"
            desc="모든 활성 회원에게 발송"
          />
          <TargetCard
            active={state.targetType === 'ARTIST_FANDOM'}
            disabled={disabled}
            onClick={() => set('targetType', 'ARTIST_FANDOM')}
            icon={UsersIcon}
            title="아티스트 팬덤"
            desc="아티스트 그룹 팬덤에게 발송"
          />
          <TargetCard
            active={state.targetType === 'MEMBER_GROUP'}
            disabled={disabled}
            onClick={() => set('targetType', 'MEMBER_GROUP')}
            icon={UserGroupIcon}
            title="특정 회원 그룹"
            desc="CSV 업로드로 임시 그룹 구성"
          />
        </div>

        {state.targetType === 'ARTIST_FANDOM' && (
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">아티스트 선택</label>
            <div className="relative">
              <select
                value={state.targetArtist}
                disabled={disabled}
                onChange={(e) => set('targetArtist', e.target.value)}
                className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[200px]"
              >
                {ACTIVE_ARTISTS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        )}

        {state.targetType === 'MEMBER_GROUP' && (
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              CSV 파일 첨부 <span className="text-gray-400 font-normal">이메일 기준 회원 매칭</span>
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={disabled}
                onClick={attachCsv}
                className="h-10 px-4 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                + CSV 파일 첨부
              </button>
              {members.length > 0 && <span className="text-xs text-gray-500">members.csv · 매칭 완료</span>}
            </div>

            {members.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-sm text-gray-700">
                  총 <span className="font-semibold text-indigo-600">{members.length}</span>명
                </p>
                <DataTable<UploadedMember>
                  columns={[
                    { key: 'nickname', label: '닉네임' },
                    { key: 'email', label: '이메일' },
                  ]}
                  data={pagedMembers}
                  rowNumber={{ page: memberPage, perPage: MEMBER_PER_PAGE }}
                  emptyMessage="매칭된 회원이 없습니다."
                />
                {memberTotalPages > 1 && (
                  <div className="mt-3">
                    <Pagination
                      currentPage={memberPage}
                      totalPages={memberTotalPages}
                      onPageChange={setMemberPage}
                    />
                  </div>
                )}
              </div>
            )}
            <p className="mt-2 text-xs text-gray-400">
              CSV 이메일 컬럼 기준 매칭. 미존재·중복 이메일은 제외하고, 탈퇴·휴면·차단 회원은 자동 제외됩니다.
            </p>
          </div>
        )}
      </Section>

      {/* D. 딥링크 */}
      <Section title="D. 딥링크 (선택)" subtitle="알림 본문 탭/클릭 시 회원 앱 영역 이동. 소스 타입별 입력 가이드 노출">
        <DeeplinkPicker
          value={state.deeplink}
          onChange={(v) => set('deeplink', v)}
          disabled={disabled}
        />
      </Section>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-gray-200 rounded-xl p-5">
      <header className="mb-4">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}

function LangBlock({
  label,
  required,
  max,
  textarea,
  ko,
  en,
  jp,
  onChange,
  disabled,
  hint,
}: {
  label: string;
  required?: boolean;
  max: number;
  textarea?: boolean;
  ko: string;
  en: string;
  jp: string;
  onChange: (lang: Lang, v: string) => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-medium text-gray-700">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
        {hint && <span className="text-[11px] text-gray-400">{hint}</span>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {(['ko', 'en', 'jp'] as Lang[]).map((l) => {
          const val = l === 'ko' ? ko : l === 'en' ? en : jp;
          const Input = textarea ? 'textarea' : 'input';
          return (
            <div key={l} className="relative">
              <span className="absolute top-2 left-2.5 text-[10px] font-bold text-gray-400 uppercase">{l}</span>
              <Input
                disabled={disabled}
                value={val}
                onChange={(e) => onChange(l, e.target.value)}
                maxLength={max}
                rows={textarea ? 3 : undefined}
                className={`w-full pt-6 pb-2 px-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  textarea ? 'resize-none' : 'h-[58px]'
                } ${disabled ? 'bg-gray-50 text-gray-600' : ''}`}
              />
              <span className="absolute bottom-1.5 right-2 text-[10px] text-gray-400">
                {val.length}/{max}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span
      className={`relative inline-block w-10 h-6 rounded-full transition ${
        on ? 'bg-emerald-500' : 'bg-gray-300'
      }`}
    >
      <span
        className={`absolute top-0.5 ${on ? 'left-[18px]' : 'left-0.5'} w-5 h-5 rounded-full bg-white shadow transition-all`}
      />
    </span>
  );
}

function TargetCard({
  active,
  disabled,
  onClick,
  icon: Icon,
  title,
  desc,
}: {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`border rounded-lg p-4 text-left transition ${
        active ? 'border-indigo-400 bg-indigo-50/50' : 'border-gray-200 bg-white'
      } ${disabled ? 'opacity-70 cursor-not-allowed' : 'hover:border-indigo-400'}`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className={`w-7 h-7 rounded-md flex items-center justify-center ${
            active ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'
          }`}
        >
          <Icon className="w-4 h-4" />
        </span>
        <p className={`text-sm font-semibold ${active ? 'text-indigo-700' : 'text-gray-900'}`}>{title}</p>
      </div>
      <p className="text-xs text-gray-500">{desc}</p>
    </button>
  );
}

