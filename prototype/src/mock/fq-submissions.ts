import type { QuestSubmission, SubmissionStatus } from '@/lib/fq-types';

const NICKNAMES = [
  'starlight_army', 'kpop_lover99', 'bangtan_forever', 'blink_jennie',
  'my_universe22', 'seventeen_carat', 'newjeans_hanni', 'aespa_winter',
  'le_sserafim_fan', 'skz_stay4ever', 'twice_nayeon', 'ive_wonyoung',
  'exo_baekhyun', 'nct_dream_fan', 'itzy_ryujin', 'txt_soobin',
  'enhypen_jay', 'gidle_soyeon', 'redvelvet_joy', 'ateez_hj',
];

function randomDate(start: Date, end: Date): string {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString();
}

interface SubmissionTemplate {
  questId: string;
  status: SubmissionStatus;
  rejectionReason?: string;
}

const SUBMISSION_TEMPLATES: SubmissionTemplate[] = [
  // quest-004 (aespa, Active) - 7 submissions
  { questId: 'quest-004', status: 'Approved' },
  { questId: 'quest-004', status: 'Approved' },
  { questId: 'quest-004', status: 'Pending' },
  { questId: 'quest-004', status: 'Pending' },
  { questId: 'quest-004', status: 'Pending' },
  { questId: 'quest-004', status: 'Rejected', rejectionReason: 'reason-001' },
  { questId: 'quest-004', status: 'Rejected', rejectionReason: 'reason-003' },

  // quest-005 (NewJeans, Active) - 5 submissions
  { questId: 'quest-005', status: 'Approved' },
  { questId: 'quest-005', status: 'Approved' },
  { questId: 'quest-005', status: 'Approved' },
  { questId: 'quest-005', status: 'Pending' },
  { questId: 'quest-005', status: 'Rejected', rejectionReason: 'reason-002' },

  // quest-006 (SEVENTEEN, Active) - 3 submissions
  { questId: 'quest-006', status: 'Approved' },
  { questId: 'quest-006', status: 'Pending' },
  { questId: 'quest-006', status: 'Pending' },

  // quest-007 (LE SSERAFIM, Ended) - 3 submissions
  { questId: 'quest-007', status: 'Approved' },
  { questId: 'quest-007', status: 'Approved' },
  { questId: 'quest-007', status: 'Rejected', rejectionReason: 'reason-004' },

  // quest-008 (Stray Kids, Ended) - 2 submissions
  { questId: 'quest-008', status: 'Approved' },
  { questId: 'quest-008', status: 'Approved' },
];

const ADMINS = ['minsu.kim', 'jihyun.lee', 'sungho.park', 'yujin.choi'];

function createSubmission(template: SubmissionTemplate, index: number): QuestSubmission {
  const now = new Date();
  const pastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const submittedAt = randomDate(
    new Date(pastMonth.getTime() - 14 * 24 * 60 * 60 * 1000),
    new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
  );

  const isProcessed = template.status !== 'Pending';

  return {
    id: `sub-${String(index + 1).padStart(3, '0')}`,
    questId: template.questId,
    userId: 1000 + index,
    nickname: NICKNAMES[index % NICKNAMES.length],
    imageUrl: `/images/submission-${index + 1}.jpg`,
    submittedAt,
    status: template.status,
    rejectionReason: template.rejectionReason,
    processedAt: isProcessed
      ? randomDate(new Date(new Date(submittedAt).getTime() + 1 * 60 * 60 * 1000), new Date(new Date(submittedAt).getTime() + 48 * 60 * 60 * 1000))
      : undefined,
    processedBy: isProcessed ? ADMINS[Math.floor(Math.random() * ADMINS.length)] : undefined,
  };
}

export const mockSubmissions: QuestSubmission[] = SUBMISSION_TEMPLATES.map((t, i) => createSubmission(t, i));
