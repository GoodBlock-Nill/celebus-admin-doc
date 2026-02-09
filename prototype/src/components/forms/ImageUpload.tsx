'use client';

import { useState, useRef } from 'react';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ImageUploadProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export default function ImageUpload({ label, value, onChange, error }: ImageUploadProps) {
  const [preview, setPreview] = useState<string>(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        onChange(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = () => {
    setPreview('');
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {preview ? (
        <div className="relative w-[320px] aspect-video rounded-lg overflow-hidden border border-gray-200">
          <img src={preview} alt="thumbnail" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`w-[320px] aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors hover:border-blue-400 hover:bg-blue-50 ${
            error ? 'border-red-300' : 'border-gray-300'
          }`}
        >
          <PhotoIcon className="w-8 h-8 text-gray-400" />
          <span className="text-sm text-gray-500">이미지를 업로드하세요</span>
          <span className="text-xs text-gray-400">16:9 비율 권장</span>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      {error && <span className="text-xs text-red-500 mt-1 block">{error}</span>}
    </div>
  );
}
