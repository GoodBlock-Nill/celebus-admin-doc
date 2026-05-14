// 운영 사이트 클론용 공통 타입 (게임존·팬퀘스트 전용 타입은 영역별 클론 시 재추가)

export interface Column<T> {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface MultiLangText {
  ko: string;
  en: string;
  jp: string;
}
