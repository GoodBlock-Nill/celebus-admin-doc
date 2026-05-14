// 운영 /admins/list, /admins/permissions mock

export type AdminStatus = 'Active' | 'Pending' | 'Locked' | 'Inactive';

export interface Admin {
  id: number;
  status: AdminStatus;
  permission: string;
  name: string;
  email: string;
  registeredAt: string;
  lastLoginAt: string;
}

export interface AdminDetail extends Admin {
  active: boolean;
}

export interface ActivityLog {
  id: number;
  major: string;     // 대분류 — 인증/회원/게임존 ...
  middle: string;    // 중분류 — 계정/게임 관리 ...
  minor: string;     // 소분류 — 로그인/생성 ...
  message: string;   // 로그
  ip: string;
  createdAt: string;
}

export interface Role {
  id: number;
  status: 'Active' | 'Inactive';
  name: string;
  meta?: '수정불가' | '기본값';
  adminCount: number;
  adminNames: string;
  description?: string;
}

export const admins: Admin[] = [
  { id: 1, status: 'Active', permission: 'Super Admin', name: 'Oliver', email: 'oliver@good-block.com', registeredAt: '2026.04.01 12:57', lastLoginAt: '2026.04.29 16:18' },
  { id: 2, status: 'Active', permission: 'Super Admin', name: 'hennie', email: 'hennie@good-block.com', registeredAt: '2026.03.27 17:47', lastLoginAt: '2026.04.20 13:17' },
  { id: 3, status: 'Active', permission: 'Super Admin', name: 'Kara', email: 'kara@good-block.com', registeredAt: '2026.03.26 14:54', lastLoginAt: '2026.04.01 11:07' },
  { id: 4, status: 'Active', permission: 'Super Admin', name: 'carl', email: 'carl@good-block.com', registeredAt: '2026.03.10 10:33', lastLoginAt: '2026.03.10 10:34' },
  { id: 5, status: 'Active', permission: 'Super Admin', name: 'lily', email: 'lily@good-block.com', registeredAt: '2026.02.13 13:12', lastLoginAt: '2026.05.04 09:19' },
  { id: 6, status: 'Active', permission: 'Super Admin', name: 'sun', email: 'sun@good-block.com', registeredAt: '2026.02.13 12:02', lastLoginAt: '2026.04.24 13:38' },
  { id: 7, status: 'Active', permission: 'Super Admin', name: 'nill', email: 'nill@good-block.com', registeredAt: '2026.02.10 09:48', lastLoginAt: '2026.05.06 14:44' },
  { id: 8, status: 'Active', permission: 'Super Admin', name: 'teddy', email: 'lee.ch@good-block.com', registeredAt: '2026.02.09 15:30', lastLoginAt: '2026.04.24 12:02' },
  { id: 9, status: 'Active', permission: 'Super Admin', name: 'admin', email: 'admin@celebus.xyz', registeredAt: '2026.01.02 15:21', lastLoginAt: '2026.02.13 11:49' },
];

export const roles: Role[] = [
  { id: 1, status: 'Active', name: 'Super Admin', meta: '수정불가', adminCount: 9, adminNames: 'Oliver, hennie, Kara, carl, lily, sun, nill, teddy, admin', description: '-' },
  { id: 2, status: 'Active', name: 'Viewer', meta: '기본값', adminCount: 0, adminNames: '-', description: '-' },
];

export const adminStats = {
  total: 9,
  active: 9,
  pending: 0,
  locked: 0,
  inactive: 0,
};

export const roleStats = {
  total: 2,
  active: 2,
  inactive: 0,
};

const IPS = ['211.234.180.105', '211.234.204.172', '58.120.209.246', '211.234.204.14', '211.234.203.90'];
const LOG_DATES = [
  '2026.04.29 16:18', '2026.04.24 16:10', '2026.04.24 15:48', '2026.04.23 18:20', '2026.04.23 15:36',
  '2026.04.22 11:54', '2026.04.20 11:29', '2026.04.16 19:50', '2026.04.16 14:03', '2026.04.10 09:32',
  '2026.04.08 10:14', '2026.04.05 13:02', '2026.04.02 17:26', '2026.04.01 12:57', '2026.03.30 15:48',
  '2026.03.29 11:08', '2026.03.27 09:01', '2026.03.25 16:33', '2026.03.22 13:17', '2026.03.18 18:02',
  '2026.03.15 12:30', '2026.03.12 09:42', '2026.03.09 14:55', '2026.03.05 11:18', '2026.03.01 10:00',
];

export function getAdminById(id: number): AdminDetail | undefined {
  const a = admins.find((x) => x.id === id);
  if (!a) return undefined;
  return { ...a, active: a.status === 'Active' };
}

export function getAdminLogs(adminId: number): ActivityLog[] {
  // Generate 25 login logs based on adminId
  const logs: ActivityLog[] = [];
  const seed = adminId * 7;
  for (let i = 0; i < 25; i++) {
    logs.push({
      id: i + 1,
      major: '인증',
      middle: '계정',
      minor: '로그인',
      message: '관리자 계정에 로그인했습니다.',
      ip: IPS[(seed + i) % IPS.length],
      createdAt: LOG_DATES[i],
    });
  }
  return logs;
}

export const sidebarMenuList = [
  '대시보드', '회원', '프로젝트', '아티스트', '앱', 'BIVE', 'Fans', '티켓', '게임존', '관리자',
];
