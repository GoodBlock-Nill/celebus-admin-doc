'use client';

import { Field, Textarea } from '../../_components/form';
import { Card } from '../../_components/ui';
import { ConcertDetailImagesField } from './concert-detail-images-field';
import { MAX_DESCRIPTION_LENGTH } from './concert-image-rules';
import { ConcertPosterField } from './concert-poster-field';
import type { ConcertDraft, ConcertField, FieldErrors } from './concert-form-state';

interface MediaFieldsProps {
  draft: ConcertDraft;
  errors: FieldErrors;
  onChange: (field: ConcertField, value: string) => void;
  onDetailImagesChange: (urls: string[]) => void;
}

/** 포스터 이미지 · 공연 소개 · 상세 이미지 입력 영역 */
export function ConcertMediaFields({
  draft,
  errors,
  onChange,
  onDetailImagesChange,
}: MediaFieldsProps) {
  const descriptionLength = draft.description.length;

  return (
    <Card
      title="포스터 · 상세정보"
      description="앱 공연 목록 카드와 공연 상세에 그대로 노출되는 이미지·소개 글입니다."
    >
      <div className="flex flex-col gap-5">
        <ConcertPosterField
          posterUrl={draft.posterUrl}
          error={errors.posterUrl}
          onChange={(posterUrl) => onChange('posterUrl', posterUrl)}
        />

        <Field
          label="공연 소개"
          error={errors.description}
          hint={`이미지 안 정보를 글로도 전달하는 요약입니다. 화면낭독기·검색 대응에 필요합니다. (선택 입력 · ${descriptionLength.toLocaleString('ko-KR')}/${MAX_DESCRIPTION_LENGTH.toLocaleString('ko-KR')}자)`}
        >
          <Textarea
            value={draft.description}
            onChange={(event) => onChange('description', event.target.value)}
            maxLength={MAX_DESCRIPTION_LENGTH}
            placeholder="예) 데뷔 첫 단독 쇼케이스로, 신곡 무대와 팬 토크가 함께 진행됩니다."
            className="min-h-[120px]"
          />
        </Field>

        <ConcertDetailImagesField
          urls={draft.detailImageUrls}
          error={errors.detailImageUrls}
          onChange={onDetailImagesChange}
        />
      </div>
    </Card>
  );
}
