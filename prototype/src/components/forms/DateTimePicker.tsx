'use client';

interface DateTimePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  min?: string;
  disabled?: boolean;
}

export default function DateTimePicker({ label, value, onChange, required, error, min, disabled }: DateTimePickerProps) {
  const dateValue = value ? value.substring(0, 10) : '';
  const timeValue = value ? value.substring(11, 16) : '';

  const handleDateChange = (date: string) => {
    onChange(`${date}T${timeValue || '00:00'}:00.000Z`);
  };

  const handleTimeChange = (time: string) => {
    onChange(`${dateValue || new Date().toISOString().substring(0, 10)}T${time}:00.000Z`);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="flex gap-2">
        <input
          type="date"
          value={dateValue}
          onChange={(e) => handleDateChange(e.target.value)}
          min={min?.substring(0, 10)}
          disabled={disabled}
          className={`flex-1 h-10 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? 'border-red-300' : 'border-gray-200'
          } ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
        />
        <input
          type="time"
          value={timeValue}
          onChange={(e) => handleTimeChange(e.target.value)}
          disabled={disabled}
          className={`w-[130px] h-10 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? 'border-red-300' : 'border-gray-200'
          } ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
        />
      </div>
      {error && <span className="text-xs text-red-500 mt-1 block">{error}</span>}
    </div>
  );
}
