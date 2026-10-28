// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
interface FormInputProps {
  label: string;
  type?: string;
  value: string | number;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  className?: string;
  inputClassName?: string;
}

export default function FormInput({
  label,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required = false,
  disabled = false,
  helperText,
  min,
  max,
  step,
  className = '',
  inputClassName = '',
}: FormInputProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-danger ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`input ${error ? 'border-danger focus:ring-danger' : ''} ${inputClassName}`}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
      />
      {error && (
        <p className="mt-1 text-sm text-danger flex items-center gap-1">
          <span>⚠️</span>
          {error}
        </p>
      )}
      {!error && helperText && (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  );
}
