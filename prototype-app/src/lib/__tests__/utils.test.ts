import { describe, it, expect } from 'vitest';
import {
  formatNumber,
  formatGP,
  formatGPWithSign,
  formatPercent,
  truncateText,
  truncateHash,
  generateId,
  getRemainingTime,
  cn,
} from '../utils';

describe('formatNumber', () => {
  it('should format numbers with thousand separators', () => {
    expect(formatNumber(1234)).toBe('1,234');
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(1000000)).toBe('1,000,000');
  });
});

describe('formatGP', () => {
  it('should format GP with label', () => {
    expect(formatGP(1000)).toBe('1,000 GP');
  });
});

describe('formatGPWithSign', () => {
  it('should add + sign for positive', () => {
    expect(formatGPWithSign(500)).toBe('+500 GP');
  });
  it('should not add sign for negative', () => {
    expect(formatGPWithSign(-300)).toBe('-300 GP');
  });
  it('should not add sign for zero', () => {
    expect(formatGPWithSign(0)).toBe('0 GP');
  });
});

describe('formatPercent', () => {
  it('should format rate to percentage', () => {
    expect(formatPercent(0.125)).toBe('12.5%');
    expect(formatPercent(1)).toBe('100.0%');
  });
});

describe('truncateText', () => {
  it('should truncate long text', () => {
    expect(truncateText('Hello World', 5)).toBe('Hello...');
  });
  it('should not truncate short text', () => {
    expect(truncateText('Hi', 5)).toBe('Hi');
  });
});

describe('truncateHash', () => {
  it('should truncate hash with ellipsis', () => {
    expect(truncateHash('0x1234567890abcdef')).toBe('0x1234...cdef');
  });
  it('should return short hash as-is', () => {
    expect(truncateHash('0x12')).toBe('0x12');
  });
});

describe('generateId', () => {
  it('should generate unique ids', () => {
    const a = generateId();
    const b = generateId();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(0);
  });
});

describe('getRemainingTime', () => {
  it('should return zero for past dates', () => {
    const result = getRemainingTime('2020-01-01T00:00:00Z');
    expect(result.days).toBe(0);
    expect(result.hours).toBe(0);
  });
});

describe('cn', () => {
  it('should merge class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });
  it('should handle conditional classes', () => {
    expect(cn('a', false && 'b', 'c')).toBe('a c');
  });
  it('should merge conflicting Tailwind classes', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });
});
