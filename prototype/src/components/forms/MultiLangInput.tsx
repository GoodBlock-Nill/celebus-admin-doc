'use client';

import { useState } from 'react';

interface MultiLangInputProps {
  label: string;
  values: { ko: string; en: string; jp: string };
  onChange: (values: { ko: string; en: string; jp: string }) => void;
  maxLength?: number;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

const LANG_TABS = [
  { key: 'ko' as const, label: 'KO' },
  { key: 'en' as const, label: 'EN' },
  { key: 'jp' as const, label: 'JP' },
];

export default function MultiLangInput({ label, values, onChange, maxLength = 50, required, error, disabled }: MultiLangInputProps) {
  const [activeLang, setActiveLang] = useState<'ko' | 'en' | 'jp'>('ko');

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="flex gap-1 mb-2">
        {LANG_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveLang(tab.key)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeLang === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <input
        type="text"
        value={values[activeLang]}
        onChange={(e) => onChange({ ...values, [activeLang]: e.target.value })}
        maxLength={maxLength}
        disabled={disabled}
        className={`w-full h-10 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-300' : 'border-gray-200'
        } ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
        placeholder={`${label} (${activeLang.toUpperCase()})`}
      />
      <div className="flex justify-between mt-1">
        {error ? (
          <span className="text-xs text-red-500">{error}</span>
        ) : (
          <span />
        )}
        <span className="text-xs text-gray-400">
          {values[activeLang].length}/{maxLength}
        </span>
      </div>
    </div>
  );
}
