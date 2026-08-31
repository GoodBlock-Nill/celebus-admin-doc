'use client';

import { Field, NumberInput, Select, Textarea, TextInput } from '../../_components/form';
import { Card } from '../../_components/ui';
import {
  MAX_MAX_PER_USER,
  MIN_MAX_PER_USER,
  type ConcertDraft,
  type ConcertField,
  type FieldErrors,
} from './concert-form-state';
import type { SeatType } from '@/lib/api-types';

const SEAT_TYPES: SeatType[] = ['자유석', '구역제'];

function isSeatType(value: string): value is SeatType {
  return (SEAT_TYPES as string[]).includes(value);
}

interface BasicFieldsProps {
  draft: ConcertDraft;
  errors: FieldErrors;
  onChange: (field: ConcertField, value: string) => void;
  onSeatTypeChange: (seatType: SeatType) => void;
}

/** 공연 기본 정보 · 판매 기간 · 안내 문구 입력 영역 */
export function ConcertBasicFields({ draft, errors, onChange, onSeatTypeChange }: BasicFieldsProps) {
  return (
    <>
      <Card title="기본 정보" description="앱 공연 카드와 상세 화면에 그대로 노출되는 정보입니다.">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="공연 타이틀" required error={errors.title} className="md:col-span-2">
            <TextInput
              value={draft.title}
              onChange={(event) => onChange('title', event.target.value)}
              placeholder="예) V01D 1st SHOWCASE : Dream In Our V01D"
              maxLength={120}
            />
          </Field>
          <Field label="아티스트" required error={errors.artist}>
            <TextInput
              value={draft.artist}
              onChange={(event) => onChange('artist', event.target.value)}
              placeholder="예) V01D"
              maxLength={60}
            />
          </Field>
          <Field label="공연장" required error={errors.venue}>
            <TextInput
              value={draft.venue}
              onChange={(event) => onChange('venue', event.target.value)}
              placeholder="예) 예스24 라이브홀"
              maxLength={60}
            />
          </Field>
          <Field label="티켓 가격 (원)" required error={errors.priceKrw}>
            <NumberInput
              min={1}
              value={draft.priceKrw}
              onChange={(event) => onChange('priceKrw', event.target.value)}
              placeholder="55000"
            />
          </Field>
          <Field
            label="1인 예매 한도 (매)"
            required
            error={errors.maxPerUser}
            hint={`${MIN_MAX_PER_USER}~${MAX_MAX_PER_USER}매 범위에서 지정합니다. 무상 발급분도 한도에 합산됩니다.`}
          >
            <NumberInput
              min={MIN_MAX_PER_USER}
              max={MAX_MAX_PER_USER}
              value={draft.maxPerUser}
              onChange={(event) => onChange('maxPerUser', event.target.value)}
            />
          </Field>
          <Field label="좌석 방식" required>
            <Select
              value={draft.seatType}
              onChange={(event) => {
                if (isSeatType(event.target.value)) onSeatTypeChange(event.target.value);
              }}
            >
              {SEAT_TYPES.map((seatType) => (
                <option key={seatType} value={seatType}>
                  {seatType}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      <Card
        title="판매 기간"
        description="한국 시각 기준입니다. 판매를 시작해도 이 기간 밖에서는 예매가 진행되지 않습니다."
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="판매 시작 일시" required error={errors.salesStartAt}>
            <TextInput
              type="datetime-local"
              value={draft.salesStartAt}
              onChange={(event) => onChange('salesStartAt', event.target.value)}
            />
          </Field>
          <Field label="판매 종료 일시" required error={errors.salesEndAt}>
            <TextInput
              type="datetime-local"
              value={draft.salesEndAt}
              onChange={(event) => onChange('salesEndAt', event.target.value)}
            />
          </Field>
        </div>
      </Card>

      <Card title="환불 정책 · 예매 유의사항" description="앱 공연 상세에서 펼쳐 볼 수 있는 안내 문구입니다.">
        <div className="flex flex-col gap-3">
          <Field label="취소·환불 규정" hint="표준 문구가 채워져 있습니다. 공연 조건에 맞게 수정해 주세요.">
            <Textarea
              value={draft.refundPolicy}
              onChange={(event) => onChange('refundPolicy', event.target.value)}
              className="min-h-[160px]"
            />
          </Field>
          <Field label="예매 유의사항" hint="입금 안내·양도 금지 안내가 기본으로 채워져 있습니다.">
            <Textarea
              value={draft.notice}
              onChange={(event) => onChange('notice', event.target.value)}
              className="min-h-[200px]"
            />
          </Field>
        </div>
      </Card>
    </>
  );
}
