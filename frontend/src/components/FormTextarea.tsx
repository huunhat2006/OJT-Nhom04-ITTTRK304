// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
interface FormTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  maxLength?: number;
  helperText?: string;
  className?: string;
}

export default function FormTextarea({
  label,
  value,
  onChange,
  error,
  placeholder,
  required = false,
  disabled = false,
  rows = 3,
  maxLength,
  helperText,
  className = '',
}: FormTextareaProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-danger ml-1">*</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`input ${error ? 'border-danger focus:ring-danger' : ''} resize-none`}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
      />
      <div className="flex justify-between items-center mt-1">
        <div className="flex-1">
          {error && (
            <p className="text-sm text-danger flex items-center gap-1">
              <span>⚠️</span>
              {error}
            </p>
          )}
          {!error && helperText && (
            <p className="text-xs text-gray-500">{helperText}</p>
          )}
        </div>
        {maxLength && (
          <p className="text-xs text-gray-400">
            {value.length}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
}
