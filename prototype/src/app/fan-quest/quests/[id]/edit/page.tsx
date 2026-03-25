'use client';

import { use, useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import Badge from '@/components/ui/Badge';
import ImageUpload from '@/components/forms/ImageUpload';
import DateTimePicker from '@/components/forms/DateTimePicker';
import ConfirmModal from '@/components/modals/ConfirmModal';
import { useFQStore } from '@/stores/useFQStore';
import type { MultiLangText } from '@/lib/types';
import type { RewardType, RelatedLink, QuestStatus } from '@/lib/fq-types';

const EMPTY_LANG: MultiLangText = { ko: '', en: '', jp: '' };

const ARTISTS = ['V01D', 'iKON', 'CELEBUS', 'aespa', 'NewJeans', 'SEVENTEEN'];
const QUEST_TYPES = ['이미지 촬영 및 업로드'];
const NFT_EVENTS = ['팬퀘스트 iKON', 'V01D 정지섭 인스타 팔로우', 'aespa Winter 생일 축하'];

const REWARD_TYPE_OPTIONS: { value: RewardType; label: string }[] = [
  { value: 'TICKET', label: '응모권' },
  { value: 'TICKET_NFT', label: '응모권 + NFT' },
  { value: 'NFT', label: 'NFT' },
];

const MAX_LINKS = 2;

export default function QuestEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const quest = useFQStore((s) => s.getQuestById(id));
  const updateQuest = useFQStore((s) => s.updateQuest);

  // Basic info
  const [title, setTitle] = useState<MultiLangText>({ ...EMPTY_LANG });
  const [description, setDescription] = useState<MultiLangText>({ ...EMPTY_LANG });
  const [userGuide, setUserGuide] = useState<MultiLangText>({ ...EMPTY_LANG });
  const [thumbnailImage, setThumbnailImage] = useState('');

  // Quest settings
  const [artist, setArtist] = useState('');
  const [questType, setQuestType] = useState('이미지 촬영 및 업로드');
  const [deadline, setDeadline] = useState('');
  const [relatedLinks, setRelatedLinks] = useState<RelatedLink[]>([]);

  // Reward settings
  const [rewardType, setRewardType] = useState<RewardType>('TICKET');
  const [ticketCount, setTicketCount] = useState(1);
  const [nftEvent, setNftEvent] = useState('');

  // Modals
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Load quest data
  useEffect(() => {
    if (quest) {
      setTitle({ ...quest.title });
      setDescription({ ...quest.description });
      setUserGuide({ ...quest.userGuide });
      setThumbnailImage(quest.thumbnailImage);
      setArtist(quest.artist);
      setQuestType(quest.questType);
      setDeadline(quest.deadline);
      setRelatedLinks(quest.relatedLinks ? quest.relatedLinks.map((l) => ({ label: { ...l.label }, url: l.url })) : []);
      setRewardType(quest.rewardType);
      setTicketCount(quest.ticketCount);
      setNftEvent(quest.nftEvent ?? '');
    }
  }, [quest]);

  if (!quest) {
    return <div className="text-center py-20 text-gray-500">Quest를 찾을 수 없습니다.</div>;
  }

  const status: QuestStatus = quest.status;
  const isActive = status === 'Active';
  const isDraft = status === 'Draft';

  const showTicket = rewardType === 'TICKET' || rewardType === 'TICKET_NFT';
  const showNft = rewardType === 'NFT' || rewardType === 'TICKET_NFT';

  const isLangFilled = (v: MultiLangText) => v.ko.trim() && v.en.trim() && v.jp.trim();

  const isLinkValid = (link: RelatedLink) => {
    const labelFilled = isLangFilled(link.label);
    const urlValid = /^https?:\/\//.test(link.url.trim());
    return labelFilled && urlValid;
  };

  const linksValid = relatedLinks.length === 0 || relatedLinks.every(isLinkValid);

  const nftValid = showNft ? nftEvent.trim() !== '' : true;

  const isFormValid = useMemo(() => {
    if (isActive) {
      // Active 상태에서는 편집 가능한 필드만 검증
      return isLangFilled(title) && isLangFilled(description) && isLangFilled(userGuide) && linksValid;
    }
    return (
      isLangFilled(title) &&
      isLangFilled(description) &&
      isLangFilled(userGuide) &&
      thumbnailImage !== '' &&
      artist !== '' &&
      questType !== '' &&
      deadline !== '' &&
      linksValid &&
      nftValid
    );
  }, [title, description, userGuide, thumbnailImage, artist, questType, deadline, linksValid, nftValid, isActive]);

  const handleAddLink = () => {
    if (relatedLinks.length >= MAX_LINKS) return;
    setRelatedLinks([...relatedLinks, { label: { ...EMPTY_LANG }, url: '' }]);
  };

  const handleRemoveLink = (index: number) => {
    setRelatedLinks(relatedLinks.filter((_, i) => i !== index));
  };

  const handleLinkLabelChange = (index: number, label: MultiLangText) => {
    const updated = relatedLinks.map((link, i) =>
      i === index ? { ...link, label } : link,
    );
    setRelatedLinks(updated);
  };

  const handleLinkUrlChange = (index: number, url: string) => {
    const updated = relatedLinks.map((link, i) =>
      i === index ? { ...link, url } : link,
    );
    setRelatedLinks(updated);
  };

  const handleEdit = () => {
    updateQuest(id, {
      title,
      description,
      userGuide,
      ...(isDraft && {
        thumbnailImage,
        artist,
        questType,
        deadline,
        rewardType,
        ticketCount: showTicket ? ticketCount : 0,
        nftEvent: showNft ? nftEvent : null,
      }),
      relatedLinks,
      updatedBy: 'admin',
    });
    setShowEditModal(false);
    router.push(`/fan-quest/quests/${id}`);
  };

  return (
    <div>
      <PageHeader
        title="Quest 수정"
        breadcrumbItems={[
          { label: '홈', href: '/' },
          { label: '팬퀘스트', href: '/fan-quest' },
          { label: 'Quest 수정' },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <Badge variant="questStatus" value={status} />
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              취소하기
            </button>
            <button
              onClick={() => setShowEditModal(true)}
              disabled={!isFormValid}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                isFormValid
                  ? 'text-white bg-blue-600 hover:bg-blue-700'
                  : 'text-gray-400 bg-gray-100 cursor-not-allowed'
              }`}
            >
              수정하기
            </button>
          </div>
        }
      />

      {isActive && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            진행중 상태에서는 기본 정보(타이틀, 설명, 가이드)와 연관 링크만 수정 가능합니다.
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Column 1: 기본 정보 */}
        <Section title="기본 정보">
          <div className="space-y-5">
            <MultiLangInputWithStatus
              label="타이틀"
              values={title}
              onChange={setTitle}
              maxLength={100}
              required
            />
            <MultiLangTextareaWithStatus
              label="설명"
              values={description}
              onChange={setDescription}
              maxLength={200}
              rows={3}
              required
            />
            <MultiLangTextareaWithStatus
              label="유저 가이드"
              values={userGuide}
              onChange={setUserGuide}
              maxLength={500}
              rows={5}
              required
            />
            <div className={isActive ? 'opacity-50 pointer-events-none' : ''}>
              <ImageUpload
                label="대표 이미지 *"
                value={thumbnailImage}
                onChange={setThumbnailImage}
              />
              <p className="text-xs text-gray-400 mt-1">1920x1080 권장 / 최대 50MB</p>
            </div>
          </div>
        </Section>

        {/* Column 2: 퀘스트 설정 */}
        <Section title="퀘스트 설정">
          <div className="space-y-5">
            <Dropdown
              label="아티스트"
              value={artist}
              onChange={setArtist}
              options={ARTISTS}
              placeholder="아티스트 선택"
              required
              disabled={isActive}
            />
            <Dropdown
              label="퀘스트 타입"
              value={questType}
              onChange={setQuestType}
              options={QUEST_TYPES}
              placeholder="퀘스트 타입 선택"
              required
              disabled={isActive}
            />
            <div className={isActive ? 'opacity-50 pointer-events-none' : ''}>
              <DateTimePicker
                label="마감 일시"
                value={deadline}
                onChange={setDeadline}
                required
                disabled={isActive}
              />
              <p className="text-xs text-gray-400 mt-1">
                * 시작 일시는 게시 시점에 자동으로 설정됩니다. 마감 일시는 내일 이후로 설정해 주세요.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">연관 링크 (선택)</label>
                {relatedLinks.length < MAX_LINKS && (
                  <button
                    type="button"
                    onClick={handleAddLink}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + 링크 추가
                  </button>
                )}
              </div>
              {relatedLinks.length === 0 && (
                <p className="text-sm text-gray-400">추가된 링크가 없습니다.</p>
              )}
              <div className="space-y-4">
                {relatedLinks.map((link, index) => (
                  <LinkRow
                    key={index}
                    index={index}
                    link={link}
                    onLabelChange={(label) => handleLinkLabelChange(index, label)}
                    onUrlChange={(url) => handleLinkUrlChange(index, url)}
                    onRemove={() => handleRemoveLink(index)}
                  />
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Column 3: 보상 설정 */}
        <Section title="보상 설정">
          <div className={`space-y-5 ${isActive ? 'opacity-50 pointer-events-none' : ''}`}>
            <Dropdown
              label="보상 종류"
              value={rewardType}
              onChange={(v) => setRewardType(v as RewardType)}
              options={REWARD_TYPE_OPTIONS.map((o) => o.value)}
              optionLabels={REWARD_TYPE_OPTIONS.reduce<Record<string, string>>((acc, o) => {
                acc[o.value] = o.label;
                return acc;
              }, {})}
              placeholder="보상 종류 선택"
              required
              disabled={isActive}
            />
            {showTicket && (
              <Dropdown
                label="응모권 수량"
                value={String(ticketCount)}
                onChange={(v) => setTicketCount(Number(v))}
                options={Array.from({ length: 10 }, (_, i) => String(i + 1))}
                optionLabels={Array.from({ length: 10 }, (_, i) => [`${i + 1}`, `${i + 1}장`]).reduce<Record<string, string>>((acc, [k, v]) => {
                  acc[k] = v;
                  return acc;
                }, {})}
                placeholder="수량 선택"
                disabled={isActive}
              />
            )}
            {showNft && (
              <Dropdown
                label="NFT 이벤트"
                value={nftEvent}
                onChange={setNftEvent}
                options={NFT_EVENTS}
                placeholder="NFT 이벤트 선택"
                required
                disabled={isActive}
              />
            )}
          </div>
        </Section>
      </div>

      {/* Cancel Modal */}
      <ConfirmModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={() => {
          setShowCancelModal(false);
          router.push(`/fan-quest/quests/${id}`);
        }}
        title="Quest 수정 취소"
        message="수정된 데이터는 저장되지 않습니다. 계속 진행하시겠습니까?"
        confirmText="확인"
        cancelText="취소"
        confirmVariant="danger"
      />

      {/* Edit Confirm Modal */}
      <ConfirmModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onConfirm={handleEdit}
        title="Quest 수정"
        message="확인 버튼을 누르면 수정사항이 적용됩니다. 계속 진행하시겠습니까?"
        confirmText="확인"
        cancelText="취소"
      />
    </div>
  );
}

/* --- Sub-components --- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-base font-bold text-gray-900 mb-5">{title}</h3>
      {children}
    </div>
  );
}

interface DropdownProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  optionLabels?: Record<string, string>;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

function Dropdown({ label, value, onChange, options, optionLabels, placeholder, required, disabled }: DropdownProps) {
  return (
    <div className={disabled ? 'opacity-50' : ''}>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
          disabled ? 'cursor-not-allowed bg-gray-50' : ''
        }`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {optionLabels ? optionLabels[opt] : opt}
          </option>
        ))}
      </select>
    </div>
  );
}

const LANG_TABS = [
  { key: 'ko' as const, label: 'KO' },
  { key: 'en' as const, label: 'EN' },
  { key: 'jp' as const, label: 'JP' },
];

function LangStatusDot({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <span className="w-3.5 h-3.5 flex items-center justify-center text-green-500">
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </span>
    );
  }
  return <span className="w-2 h-2 rounded-full bg-red-400" />;
}

interface MultiLangInputWithStatusProps {
  label: string;
  values: MultiLangText;
  onChange: (v: MultiLangText) => void;
  maxLength: number;
  required?: boolean;
  disabled?: boolean;
}

function MultiLangInputWithStatus({ label, values, onChange, maxLength, required, disabled }: MultiLangInputWithStatusProps) {
  const [activeLang, setActiveLang] = useState<'ko' | 'en' | 'jp'>('ko');

  return (
    <div className={disabled ? 'opacity-50 pointer-events-none' : ''}>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="flex gap-1 mb-2">
        {LANG_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveLang(tab.key)}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeLang === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
            {activeLang !== tab.key && <LangStatusDot filled={values[tab.key].trim().length > 0} />}
          </button>
        ))}
      </div>
      <input
        type="text"
        value={values[activeLang]}
        onChange={(e) => onChange({ ...values, [activeLang]: e.target.value })}
        maxLength={maxLength}
        disabled={disabled}
        className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={`${label} (${activeLang.toUpperCase()})`}
      />
      <div className="flex justify-end mt-1">
        <span className="text-xs text-gray-400">
          {values[activeLang].length}/{maxLength}
        </span>
      </div>
    </div>
  );
}

interface MultiLangTextareaWithStatusProps {
  label: string;
  values: MultiLangText;
  onChange: (v: MultiLangText) => void;
  maxLength: number;
  rows?: number;
  required?: boolean;
  disabled?: boolean;
}

function MultiLangTextareaWithStatus({ label, values, onChange, maxLength, rows = 4, required, disabled }: MultiLangTextareaWithStatusProps) {
  const [activeLang, setActiveLang] = useState<'ko' | 'en' | 'jp'>('ko');

  return (
    <div className={disabled ? 'opacity-50 pointer-events-none' : ''}>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="flex gap-1 mb-2">
        {LANG_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveLang(tab.key)}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeLang === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
            {activeLang !== tab.key && <LangStatusDot filled={values[tab.key].trim().length > 0} />}
          </button>
        ))}
      </div>
      <textarea
        value={values[activeLang]}
        onChange={(e) => onChange({ ...values, [activeLang]: e.target.value })}
        maxLength={maxLength}
        rows={rows}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        placeholder={`${label} (${activeLang.toUpperCase()})`}
      />
      <div className="flex justify-end mt-1">
        <span className="text-xs text-gray-400">
          {values[activeLang].length}/{maxLength}
        </span>
      </div>
    </div>
  );
}

interface LinkRowProps {
  index: number;
  link: RelatedLink;
  onLabelChange: (label: MultiLangText) => void;
  onUrlChange: (url: string) => void;
  onRemove: () => void;
}

function LinkRow({ index, link, onLabelChange, onUrlChange, onRemove }: LinkRowProps) {
  const [activeLang, setActiveLang] = useState<'ko' | 'en' | 'jp'>('ko');
  const urlError = link.url.trim() && !/^https?:\/\//.test(link.url.trim());

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">링크 {index + 1}</span>
        <button
          type="button"
          onClick={onRemove}
          className="text-sm text-red-500 hover:text-red-600"
        >
          삭제
        </button>
      </div>

      {/* Label with lang tabs */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">라벨</label>
        <div className="flex gap-1 mb-1.5">
          {LANG_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveLang(tab.key)}
              className={`flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded transition-colors ${
                activeLang === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              {tab.label}
              {activeLang !== tab.key && <LangStatusDot filled={link.label[tab.key].trim().length > 0} />}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={link.label[activeLang]}
          onChange={(e) => onLabelChange({ ...link.label, [activeLang]: e.target.value })}
          maxLength={20}
          className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          placeholder={`라벨 (${activeLang.toUpperCase()})`}
        />
        <div className="flex justify-end mt-0.5">
          <span className="text-xs text-gray-400">{link.label[activeLang].length}/20</span>
        </div>
      </div>

      {/* URL */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">URL</label>
        <input
          type="url"
          value={link.url}
          onChange={(e) => onUrlChange(e.target.value)}
          maxLength={500}
          className={`w-full h-9 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
            urlError ? 'border-red-300' : 'border-gray-200'
          }`}
          placeholder="https://"
        />
        {urlError && (
          <span className="text-xs text-red-500 mt-0.5 block">URL은 http:// 또는 https://로 시작해야 합니다.</span>
        )}
        <div className="flex justify-end mt-0.5">
          <span className="text-xs text-gray-400">{link.url.length}/500</span>
        </div>
      </div>
    </div>
  );
}
