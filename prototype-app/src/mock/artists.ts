import type { Artist } from '@/lib/types';

export const MOCK_ARTISTS: Artist[] = [
  {
    id: 'v01d',
    name: 'V01D',
    nameEn: 'V01D',
    logoUrl: '/v01d/logo.png',
    backgroundUrl: '/v01d/background.jpg',
    members: [
      { id: 'member-1', name: '멤버1', nameEn: 'Member1', imageUrl: '/v01d/member1.jpg' },
      { id: 'member-2', name: '멤버2', nameEn: 'Member2', imageUrl: '/v01d/member2.jpg' },
      { id: 'member-3', name: '멤버3', nameEn: 'Member3', imageUrl: '/v01d/member3.jpg' },
      { id: 'member-4', name: '멤버4', nameEn: 'Member4', imageUrl: '/v01d/member4.jpg' },
    ],
  },
];
