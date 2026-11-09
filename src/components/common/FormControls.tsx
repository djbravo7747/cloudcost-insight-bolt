import type { ChangeEvent, ReactNode } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  className?: string;
}

export function SelectField({ label, value, options, onChange, className = '' }: SelectFieldProps) {
  return (
    <label className={`flex flex-col gap-1 text-xs font-medium text-slate-500 ${className}`}>
      {label}
      <select
        value={value}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-800 shadow-sm transition-colors hover:border-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

interface TextFieldProps {
  label: string;
  type?: 'text' | 'date' | 'number';
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  hint?: ReactNode;
  className?: string;
}

export function TextField({ label, type = 'text', value, onChange, min, max, hint, className = '' }: TextFieldProps) {
  return (
    <label className={`flex flex-col gap-1 text-xs font-medium text-slate-500 ${className}`}>
      {label}
      <input
        type={type}
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-800 shadow-sm transition-colors hover:border-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
      />
      {hint && <span className="font-normal text-slate-500">{hint}</span>}
    </label>
  );
}
