import type { RejectionReason } from '@/lib/fq-types';

export const mockRejectionReasons: RejectionReason[] = [
  {
    id: 'reason-001',
    adminLabel: '촬영 조건 미달',
    userMessage: {
      ko: '촬영 조건을 충족하지 못했습니다. 가이드를 확인 후 다시 제출해 주세요.',
      en: 'The photo does not meet the shooting requirements. Please review the guide and resubmit.',
      jp: '撮影条件を満たしていません。ガイドを確認して再提出してください。',
    },
    isActive: true,
    createdAt: '2025-12-01T09:00:00.000Z',
  },
  {
    id: 'reason-002',
    adminLabel: '부적절한 콘텐츠',
    userMessage: {
      ko: '부적절한 콘텐츠가 포함되어 있습니다. 커뮤니티 가이드라인을 준수해 주세요.',
      en: 'The submission contains inappropriate content. Please follow community guidelines.',
      jp: '不適切なコンテンツが含まれています。コミュニティガイドラインを遵守してください。',
    },
    isActive: true,
    createdAt: '2025-12-01T09:00:00.000Z',
  },
  {
    id: 'reason-003',
    adminLabel: '이미지 품질 불량',
    userMessage: {
      ko: '이미지 품질이 기준에 미달합니다. 선명한 사진으로 다시 제출해 주세요.',
      en: 'The image quality does not meet standards. Please resubmit with a clearer photo.',
      jp: '画像品質が基準に達していません。鮮明な写真で再提出してください。',
    },
    isActive: true,
    createdAt: '2025-12-01T09:00:00.000Z',
  },
  {
    id: 'reason-004',
    adminLabel: '대상 불일치',
    userMessage: {
      ko: '퀘스트 대상과 일치하지 않는 사진입니다. 올바른 대상으로 다시 제출해 주세요.',
      en: 'The photo does not match the quest subject. Please resubmit with the correct subject.',
      jp: 'クエスト対象と一致しない写真です。正しい対象で再提出してください。',
    },
    isActive: true,
    createdAt: '2025-12-01T09:00:00.000Z',
  },
  {
    id: 'reason-005',
    adminLabel: '기타 사유',
    userMessage: {
      ko: '기타 사유로 반려되었습니다. 자세한 내용은 고객센터로 문의해 주세요.',
      en: 'Rejected for other reasons. Please contact customer support for details.',
      jp: 'その他の理由で却下されました。詳細はカスタマーサポートにお問い合わせください。',
    },
    isActive: false,
    createdAt: '2025-12-15T09:00:00.000Z',
  },
];
