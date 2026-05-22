'use client';

import { useMemo, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { type GameStatus } from '@/mock/gamezone';

// GAM 게임 모달 7종 — 명세 [201-MD-CANCEL] / [202-MD-*] 6종 1:1 정합
// #B-PT-4 (운영 BO 실측 정합)

interface BaseProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

// ─────────────── 1. [201-MD-CANCEL] 생성 취소 ───────────────
export function ConfirmCreateCancelModal({ isOpen, onClose, onConfirm }: BaseProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="생성 취소 확인"
      width="max-w-md"
      footer={
        <>
          <button onClick={onClose} className="h-10 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">계속 작성</button>
          <button onClick={onConfirm} className="h-10 px-5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700">취소하기</button>
        </>
      }
    >
      <div className="space-y-2 text-sm text-gray-700">
        <p>게임 생성을 취소하시겠습니까?</p>
        <p className="text-gray-500">작성 중인 내용은 저장되지 않습니다.</p>
      </div>
    </Modal>
  );
}

// ─────────────── 2. [202-MD-EDIT-CANCEL] 수정 취소 ───────────────
export function ConfirmEditCancelModal({ isOpen, onClose, onConfirm }: BaseProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="수정 취소 확인"
      width="max-w-md"
      footer={
        <>
          <button onClick={onClose} className="h-10 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">계속 수정</button>
          <button onClick={onConfirm} className="h-10 px-5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700">취소하기</button>
        </>
      }
    >
      <div className="space-y-2 text-sm text-gray-700">
        <p>게임 수정을 취소하시겠습니까?</p>
        <p className="text-gray-500">작성 중인 내용은 저장되지 않습니다.</p>
      </div>
    </Modal>
  );
}

// ─────────────── 3. [202-MD-DELETE] 삭제 ───────────────
export function ConfirmDeleteModal({ isOpen, onClose, onConfirm, gameTitle, status }: BaseProps & { gameTitle: string; status: GameStatus }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="게임을 삭제하시겠습니까?"
      width="max-w-md"
      footer={
        <>
          <button onClick={onClose} className="h-10 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">취소</button>
          <button onClick={onConfirm} className="h-10 px-5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700">삭제하기</button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-gray-700">삭제된 게임은 복구할 수 없습니다.</p>
        <dl className="grid grid-cols-[80px_1fr] gap-y-2 text-sm bg-gray-50 rounded-lg p-3">
          <dt className="text-gray-500">타이틀</dt>
          <dd className="text-gray-900">{gameTitle}</dd>
          <dt className="text-gray-500">상태</dt>
          <dd className="text-gray-900">{status}</dd>
        </dl>
      </div>
    </Modal>
  );
}

// ─────────────── 4. [202-MD-PUBLISH] 게시 ───────────────
export function ConfirmPublishModal({ isOpen, onClose, onConfirm, gameTitle }: BaseProps & { gameTitle: string }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="게임을 게시하시겠습니까?"
      width="max-w-md"
      footer={
        <>
          <button onClick={onClose} className="h-10 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">취소</button>
          <button onClick={onConfirm} className="h-10 px-5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">게시하기</button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-gray-700">게시하면 게임이 유저에게 노출되고 참여가 시작됩니다.</p>
        <dl className="grid grid-cols-[80px_1fr] gap-y-2 text-sm bg-gray-50 rounded-lg p-3">
          <dt className="text-gray-500">타이틀</dt>
          <dd className="text-gray-900">{gameTitle}</dd>
          <dt className="text-gray-500">상태</dt>
          <dd className="text-gray-900">게시대기</dd>
        </dl>
      </div>
    </Modal>
  );
}

// ─────────────── 5. [202-MD-CLOSE] 강제 종료 ───────────────
export function ConfirmCloseModal({ isOpen, onClose, onConfirm, gameTitle, status, participants, refundGP }: BaseProps & { gameTitle: string; status: GameStatus; participants: number; refundGP: number }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="게임을 강제 종료하시겠습니까?"
      width="max-w-lg"
      footer={
        <>
          <button onClick={onClose} className="h-10 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">취소</button>
          <button onClick={onConfirm} className="h-10 px-5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700">강제 종료하기</button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1 text-sm text-red-700">
          <p>⚠️ 강제 종료 시 진행 중인 참여가 즉시 마감됩니다.</p>
          <p>참여자에게는 참여 GP가 전액 환급됩니다.</p>
          <p className="font-medium">이 작업은 되돌릴 수 없습니다.</p>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-900 mb-2">강제 종료 시 처리 내용</div>
          <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
            <li>게임 상태: <span className="text-gray-900 font-medium">{status}</span> → 강제종료</li>
            <li>모든 참여자 참여 GP 전액 환급</li>
            <li>부스팅 GP도 전액 환급</li>
            <li>보상 미지급 (결과 없이 종료)</li>
          </ul>
        </div>
        <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-sm bg-gray-50 rounded-lg p-3">
          <dt className="text-gray-500">타이틀</dt>
          <dd className="text-gray-900">{gameTitle}</dd>
          <dt className="text-gray-500">현재 참여자</dt>
          <dd className="text-gray-900">{participants}명</dd>
          <dt className="text-gray-500">환급 예정 GP</dt>
          <dd className="text-gray-900">{refundGP} GP</dd>
        </dl>
      </div>
    </Modal>
  );
}

// ─────────────── 6. [202-MD-RESULT] 결과 입력 ───────────────
export function ResultInputModal({ isOpen, onClose, onConfirm, gameTitle, participants, totalPrize }: BaseProps & { gameTitle: string; participants: number; totalPrize: number }) {
  const [lang, setLang] = useState<'KO' | 'EN' | 'JP'>('KO');
  const [titleKo, setTitleKo] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [titleJp, setTitleJp] = useState('');
  const [result, setResult] = useState<'YES' | 'NO' | null>(null);
  const [descKo, setDescKo] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descJp, setDescJp] = useState('');

  const titleVal = lang === 'KO' ? titleKo : lang === 'EN' ? titleEn : titleJp;
  const setTitleVal = (v: string) => { if (lang === 'KO') setTitleKo(v); else if (lang === 'EN') setTitleEn(v); else setTitleJp(v); };
  const descVal = lang === 'KO' ? descKo : lang === 'EN' ? descEn : descJp;
  const setDescVal = (v: string) => { if (lang === 'KO') setDescKo(v); else if (lang === 'EN') setDescEn(v); else setDescJp(v); };

  const canConfirm = !!titleKo.trim() && !!result && !!descKo.trim();
  const yesCount = Math.floor(participants * 0.45);
  const noCount = participants - yesCount;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="결과 입력"
      width="max-w-2xl"
      footer={
        <>
          <button onClick={onClose} className="h-10 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">취소</button>
          <button disabled={!canConfirm} onClick={onConfirm} className="h-10 px-5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300">결과 확정</button>
        </>
      }
    >
      <div className="space-y-5">
        <dl className="grid grid-cols-[100px_1fr] gap-y-2 text-sm bg-gray-50 rounded-lg p-3">
          <dt className="text-gray-500">타이틀</dt>
          <dd className="text-gray-900">{gameTitle}</dd>
          <dt className="text-gray-500">총 참여자</dt>
          <dd className="text-gray-900">{participants}명</dd>
          <dt className="text-gray-500">총 상금 GP</dt>
          <dd className="text-gray-900">{totalPrize.toLocaleString()} GP</dd>
        </dl>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">결과제목 <span className="text-red-500">*</span></label>
          <div className="flex gap-1 mb-2">
            {(['KO', 'EN', 'JP'] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)} className={`px-3 h-7 text-xs rounded ${lang === l ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>{l}</button>
            ))}
          </div>
          <input value={titleVal} onChange={(e) => setTitleVal(e.target.value.slice(0, 50))} placeholder="결과 제목을 입력하세요." className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm" />
          <div className="text-right text-xs text-gray-400 mt-1">{titleVal.length}/50</div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">결과 선택 <span className="text-red-500">*</span></label>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setResult('YES')} className={`p-4 rounded-lg border text-left ${result === 'YES' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:bg-gray-50'}`}>
              <div className="text-lg font-semibold text-emerald-700">YES</div>
              <div className="text-xs text-gray-500 mt-1">예상 정답자: {yesCount}명</div>
            </button>
            <button onClick={() => setResult('NO')} className={`p-4 rounded-lg border text-left ${result === 'NO' ? 'border-rose-500 bg-rose-50' : 'border-gray-200 hover:bg-gray-50'}`}>
              <div className="text-lg font-semibold text-rose-700">NO</div>
              <div className="text-xs text-gray-500 mt-1">예상 정답자: {noCount}명</div>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">결과설명 <span className="text-red-500">*</span></label>
          <div className="flex gap-1 mb-2">
            {(['KO', 'EN', 'JP'] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)} className={`px-3 h-7 text-xs rounded ${lang === l ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>{l}</button>
            ))}
          </div>
          <textarea value={descVal} onChange={(e) => setDescVal(e.target.value.slice(0, 500))} placeholder="결과에 대한 설명을 입력하세요." className="w-full min-h-[100px] p-3 border border-gray-200 rounded-lg text-sm" />
          <div className="text-right text-xs text-gray-400 mt-1">{descVal.length}/500</div>
        </div>

        <div className="text-xs text-gray-500">결과링크 (선택) — KO/EN/JP 다국어 입력은 추후 보강</div>
      </div>
    </Modal>
  );
}

// ─────────────── 7. [202-MD-REWARD] 보상 지급 ───────────────
export function ConfirmRewardModal({ isOpen, onClose, onConfirm, gameTitle, totalPrize, correctCount }: BaseProps & { gameTitle: string; totalPrize: number; correctCount: number }) {
  const perShare = correctCount > 0 ? Math.floor(totalPrize / correctCount) : 0;
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="보상을 지급하시겠습니까?"
      width="max-w-md"
      footer={
        <>
          <button onClick={onClose} className="h-10 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">취소</button>
          <button onClick={onConfirm} className="h-10 px-5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">지급</button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-gray-700">보상 지급 후에는 되돌릴 수 없습니다.</p>
        <dl className="grid grid-cols-[140px_1fr] gap-y-2 text-sm bg-gray-50 rounded-lg p-3">
          <dt className="text-gray-500">타이틀</dt>
          <dd className="text-gray-900">{gameTitle}</dd>
          <dt className="text-gray-500">총 상금 GP</dt>
          <dd className="text-gray-900">{totalPrize.toLocaleString()} GP</dd>
          <dt className="text-gray-500">정답자 수</dt>
          <dd className="text-gray-900">{correctCount}명</dd>
          <dt className="text-gray-500">지분당 보상 GP</dt>
          <dd className="text-indigo-600 font-semibold">{perShare.toLocaleString()} GP</dd>
        </dl>
        <p className="text-xs text-gray-500">⚠ 운영 BO 실측 미실시 — 실제 모달 UI는 운영 검증 후 갱신 ([202-MD-REWARD] v2.2 명세 보존)</p>
      </div>
    </Modal>
  );
}
