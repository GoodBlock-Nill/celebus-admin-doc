import type { Quest, QuestStatus, RewardType } from '@/lib/fq-types';

const ADMINS = ['minsu.kim', 'jihyun.lee', 'sungho.park', 'yujin.choi', 'daeun.jung'];

const ARTISTS = ['V01D', 'iKON', 'CELEBUS', 'aespa', 'NewJeans', 'SEVENTEEN', 'LE SSERAFIM', 'Stray Kids'];

function randomDate(start: Date, end: Date): string {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString();
}

function pickAdmin(): string {
  return ADMINS[Math.floor(Math.random() * ADMINS.length)];
}

interface QuestTemplate {
  titleKo: string;
  titleEn: string;
  titleJp: string;
  artist: string;
  questType: string;
  rewardType: RewardType;
  ticketCount: number;
  nftEvent: string | null;
  status: QuestStatus;
  hasRelatedLinks: boolean;
}

const QUEST_TEMPLATES: QuestTemplate[] = [
  // 3 Draft
  {
    titleKo: 'V01D 팬아트 챌린지', titleEn: 'V01D Fan Art Challenge', titleJp: 'V01D ファンアートチャレンジ',
    artist: 'V01D', questType: 'PHOTO_SUBMISSION', rewardType: 'TICKET', ticketCount: 3, nftEvent: null,
    status: 'Draft', hasRelatedLinks: false,
  },
  {
    titleKo: 'iKON 응원 인증샷', titleEn: 'iKON Cheer Proof Shot', titleJp: 'iKON 応援認証ショット',
    artist: 'iKON', questType: 'PHOTO_SUBMISSION', rewardType: 'TICKET_NFT', ticketCount: 2, nftEvent: 'iKON Summer NFT',
    status: 'Draft', hasRelatedLinks: false,
  },
  {
    titleKo: 'CELEBUS 로고 리디자인', titleEn: 'CELEBUS Logo Redesign', titleJp: 'CELEBUS ロゴリデザイン',
    artist: 'CELEBUS', questType: 'PHOTO_SUBMISSION', rewardType: 'NFT', ticketCount: 0, nftEvent: 'CELEBUS Art NFT',
    status: 'Draft', hasRelatedLinks: true,
  },
  // 3 Active
  {
    titleKo: 'aespa 콘서트 인증샷 퀘스트', titleEn: 'aespa Concert Proof Quest', titleJp: 'aespa コンサート認証クエスト',
    artist: 'aespa', questType: 'PHOTO_SUBMISSION', rewardType: 'TICKET', ticketCount: 5, nftEvent: null,
    status: 'Active', hasRelatedLinks: true,
  },
  {
    titleKo: 'NewJeans 팬미팅 후기 챌린지', titleEn: 'NewJeans Fan Meeting Review', titleJp: 'NewJeans ファンミーティングレビュー',
    artist: 'NewJeans', questType: 'PHOTO_SUBMISSION', rewardType: 'TICKET', ticketCount: 2, nftEvent: null,
    status: 'Active', hasRelatedLinks: false,
  },
  {
    titleKo: 'SEVENTEEN 포토카드 컬렉션', titleEn: 'SEVENTEEN Photocard Collection', titleJp: 'SEVENTEEN フォトカードコレクション',
    artist: 'SEVENTEEN', questType: 'PHOTO_SUBMISSION', rewardType: 'TICKET_NFT', ticketCount: 3, nftEvent: 'SVT Collector NFT',
    status: 'Active', hasRelatedLinks: true,
  },
  // 2 Ended
  {
    titleKo: 'LE SSERAFIM 앨범 언박싱', titleEn: 'LE SSERAFIM Album Unboxing', titleJp: 'LE SSERAFIM アルバムアンボクシング',
    artist: 'LE SSERAFIM', questType: 'PHOTO_SUBMISSION', rewardType: 'TICKET', ticketCount: 2, nftEvent: null,
    status: 'Ended', hasRelatedLinks: false,
  },
  {
    titleKo: 'Stray Kids 월드투어 기념 퀘스트', titleEn: 'Stray Kids World Tour Quest', titleJp: 'Stray Kids ワールドツアー記念クエスト',
    artist: 'Stray Kids', questType: 'PHOTO_SUBMISSION', rewardType: 'TICKET_NFT', ticketCount: 4, nftEvent: 'SKZ Tour NFT',
    status: 'Ended', hasRelatedLinks: true,
  },
];

function createQuest(template: QuestTemplate, index: number): Quest {
  const now = new Date();
  const pastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const futureMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  let deadline: string;
  let startedAt: string | null = null;
  let stats = { total: 0, approved: 0, rejected: 0, pending: 0 };

  switch (template.status) {
    case 'Draft':
      deadline = randomDate(futureMonth, new Date(futureMonth.getTime() + 30 * 24 * 60 * 60 * 1000));
      break;
    case 'Active':
      startedAt = randomDate(pastMonth, new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000));
      deadline = randomDate(new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), futureMonth);
      stats = {
        total: 30 + Math.floor(Math.random() * 70),
        approved: 0,
        rejected: 0,
        pending: 0,
      };
      stats.approved = Math.floor(stats.total * 0.5) + Math.floor(Math.random() * 10);
      stats.rejected = Math.floor(Math.random() * 8);
      stats.pending = stats.total - stats.approved - stats.rejected;
      break;
    case 'Ended':
      startedAt = randomDate(
        new Date(pastMonth.getTime() - 60 * 24 * 60 * 60 * 1000),
        new Date(pastMonth.getTime() - 30 * 24 * 60 * 60 * 1000),
      );
      deadline = randomDate(
        new Date(pastMonth.getTime() - 14 * 24 * 60 * 60 * 1000),
        new Date(pastMonth.getTime() - 1 * 24 * 60 * 60 * 1000),
      );
      stats = {
        total: 80 + Math.floor(Math.random() * 120),
        approved: 0,
        rejected: 0,
        pending: 0,
      };
      stats.approved = Math.floor(stats.total * 0.7) + Math.floor(Math.random() * 15);
      stats.rejected = Math.floor(stats.total * 0.15) + Math.floor(Math.random() * 5);
      stats.pending = stats.total - stats.approved - stats.rejected;
      break;
  }

  const createdAt = startedAt
    ? randomDate(new Date(new Date(startedAt).getTime() - 14 * 24 * 60 * 60 * 1000), new Date(new Date(startedAt).getTime() - 1 * 24 * 60 * 60 * 1000))
    : randomDate(new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000));

  const admin = pickAdmin();

  const relatedLinks = template.hasRelatedLinks
    ? [
        {
          label: { ko: '공식 이벤트 페이지', en: 'Official Event Page', jp: '公式イベントページ' },
          url: `https://celebus.com/event/${index + 1}`,
        },
      ]
    : [];

  return {
    id: `quest-${String(index + 1).padStart(3, '0')}`,
    title: {
      ko: template.titleKo,
      en: template.status === 'Draft' && index === 0 ? '' : template.titleEn,
      jp: template.status === 'Draft' && index === 0 ? '' : template.titleJp,
    },
    description: {
      ko: `${template.titleKo}에 참여하고 응모권을 받으세요!`,
      en: template.status === 'Draft' ? '' : `Join ${template.titleEn} and earn tickets!`,
      jp: template.status === 'Draft' ? '' : `${template.titleJp}に参加して応募券をゲット！`,
    },
    userGuide: {
      ko: '1. 사진을 촬영합니다.\n2. 업로드합니다.\n3. 승인을 기다립니다.',
      en: '1. Take a photo.\n2. Upload it.\n3. Wait for approval.',
      jp: '1. 写真を撮ります。\n2. アップロードします。\n3. 承認を待ちます。',
    },
    thumbnailImage: `/images/quest-${index + 1}.jpg`,
    artist: template.artist,
    questType: template.questType,
    deadline,
    startedAt,
    rewardType: template.rewardType,
    ticketCount: template.ticketCount,
    nftEvent: template.nftEvent,
    relatedLinks,
    status: template.status,
    stats,
    createdBy: admin,
    createdAt,
    updatedBy: admin,
    updatedAt: createdAt,
  };
}

export const mockQuests: Quest[] = QUEST_TEMPLATES.map((t, i) => createQuest(t, i));
