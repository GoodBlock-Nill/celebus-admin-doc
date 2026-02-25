import React from 'react';

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );
}

interface HintLinkFieldProps {
  hintLinkEnabled: boolean;
  setHintLinkEnabled: (v: boolean) => void;
  hintLink: string;
  setHintLink: (v: string) => void;
  canEdit: boolean;
}

export function HintLinkField({ hintLinkEnabled, setHintLinkEnabled, hintLink, setHintLink, canEdit }: HintLinkFieldProps) {
  return (
    <>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700 w-[100px]">힌트 링크</span>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => canEdit && setHintLinkEnabled(true)}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${
              hintLinkEnabled ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            } ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            사용
          </button>
          <button
            type="button"
            onClick={() => canEdit && setHintLinkEnabled(false)}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${
              !hintLinkEnabled ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            } ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            미사용
          </button>
        </div>
      </div>
      {hintLinkEnabled && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">힌트 링크 URL</label>
          <input
            type="url"
            value={hintLink}
            onChange={(e) => setHintLink(e.target.value)}
            placeholder="https://example.com/hint"
            disabled={!canEdit}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
          />
        </div>
      )}
    </>
  );
}
