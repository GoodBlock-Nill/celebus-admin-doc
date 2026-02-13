'use client';

interface DatePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  min?: string;
  disabled?: boolean;
}

export default function DatePicker({ label, value, onChange, required, error, min, disabled }: DatePickerProps) {
  const dateValue = value ? value.substring(0, 10) : '';

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type="date"
        value={dateValue}
        onChange={(e) => onChange(e.target.value)}
        min={min?.substring(0, 10)}
        disabled={disabled}
        className={`w-full h-10 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-300' : 'border-gray-200'
        } ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
      />
      {error && <span className="text-xs text-red-500 mt-1 block">{error}</span>}
    </div>
  );
}
