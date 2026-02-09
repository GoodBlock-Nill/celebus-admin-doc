'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface MultiLangEditorProps {
  label: string;
  values: { ko: string; en: string; jp: string };
  onChange: (values: { ko: string; en: string; jp: string }) => void;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

const LANG_TABS = [
  { key: 'ko' as const, label: 'KO' },
  { key: 'en' as const, label: 'EN' },
  { key: 'jp' as const, label: 'JP' },
];

const TOOLBAR_BUTTONS = [
  { command: 'bold', icon: 'B', title: 'Bold' },
  { command: 'italic', icon: 'I', title: 'Italic' },
  { command: 'underline', icon: 'U', title: 'Underline' },
  { command: 'insertUnorderedList', icon: '•', title: 'Bullet List' },
  { command: 'insertOrderedList', icon: '1.', title: 'Ordered List' },
  { command: 'justifyLeft', icon: '⇤', title: 'Align Left' },
  { command: 'justifyCenter', icon: '⇥', title: 'Align Center' },
  { command: 'justifyRight', icon: '⇥', title: 'Align Right' },
];

export default function MultiLangEditor({ label, values, onChange, required, error, disabled }: MultiLangEditorProps) {
  const [activeLang, setActiveLang] = useState<'ko' | 'en' | 'jp'>('ko');
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = values[activeLang];
    }
  }, [activeLang, values]);

  const handleFormat = useCallback((command: string) => {
    if (typeof document === 'undefined') return;
    document.execCommand(command, false, undefined);
    editorRef.current?.focus();
  }, []);

  const handleLink = useCallback(() => {
    if (typeof window === 'undefined') return;
    const url = window.prompt('URL을 입력하세요:');
    if (url) {
      document.execCommand('createLink', false, url);
    }
    editorRef.current?.focus();
  }, []);

  const handleImage = useCallback(() => {
    if (typeof window === 'undefined') return;
    const url = window.prompt('이미지 URL을 입력하세요:');
    if (url) {
      document.execCommand('insertImage', false, url);
    }
    editorRef.current?.focus();
  }, []);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange({ ...values, [activeLang]: editorRef.current.innerHTML });
    }
  }, [activeLang, onChange, values]);

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
      <div
        className={`border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 ${
          error ? 'border-red-300' : 'border-gray-200'
        }`}
      >
        {/* Toolbar */}
        <div className={`flex items-center gap-0.5 px-2 py-1.5 bg-gray-100 border-b border-gray-200 ${disabled ? 'opacity-50' : ''}`}>
          {TOOLBAR_BUTTONS.map((btn) => (
            <button
              key={btn.command}
              type="button"
              onClick={() => !disabled && handleFormat(btn.command)}
              title={btn.title}
              disabled={disabled}
              className={`w-7 h-7 flex items-center justify-center rounded text-xs font-semibold transition-colors hover:bg-gray-200 text-gray-700 ${disabled ? 'cursor-not-allowed' : ''}`}
            >
              {btn.icon}
            </button>
          ))}
          <div className="w-px h-5 bg-gray-300 mx-1" />
          <button
            type="button"
            onClick={() => !disabled && handleLink()}
            title="Insert Link"
            disabled={disabled}
            className={`w-7 h-7 flex items-center justify-center rounded text-xs font-semibold hover:bg-gray-200 text-gray-700 ${disabled ? 'cursor-not-allowed' : ''}`}
          >
            🔗
          </button>
          <button
            type="button"
            onClick={() => !disabled && handleImage()}
            title="Insert Image"
            disabled={disabled}
            className={`w-7 h-7 flex items-center justify-center rounded text-xs font-semibold hover:bg-gray-200 text-gray-700 ${disabled ? 'cursor-not-allowed' : ''}`}
          >
            🖼
          </button>
        </div>
        {/* Editor */}
        <div
          ref={editorRef}
          contentEditable={!disabled}
          onInput={handleInput}
          className={`min-h-[200px] px-3 py-2 text-sm focus:outline-none ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
          suppressContentEditableWarning
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
