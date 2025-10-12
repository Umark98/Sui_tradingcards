import React from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  helpText?: string;
  error?: string;
}

export function FormField({ label, required = false, children, helpText, error }: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-200 mb-2">
        {label} {required && <span className="text-red-300">*</span>}
      </label>
      {children}
      {helpText && (
        <p className="text-xs text-gray-300 mt-1">{helpText}</p>
      )}
      {error && (
        <p className="text-xs text-red-300 mt-1">{error}</p>
      )}
    </div>
  );
}

interface SelectFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function SelectField({ 
  value, 
  onChange, 
  options, 
  placeholder = "Choose an option", 
  disabled = false,
  loading = false,
  className = "w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-white/15 transition-all"
}: SelectFieldProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      disabled={disabled || loading}
    >
      <option value="">{placeholder}</option>
      {loading ? (
        <option disabled>Loading...</option>
      ) : (
        options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))
      )}
    </select>
  );
}

interface InputFieldProps {
  type?: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  rows?: number;
}

export function InputField({ 
  type = "text", 
  value, 
  onChange, 
  placeholder, 
  disabled = false,
  className = "w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-white/15 transition-all",
  rows
}: InputFieldProps) {
  if (type === "textarea") {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
      />
    );
  }

  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}
