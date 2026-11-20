import { cn } from '@/lib/utils';
import type { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, id, ...rest }: InputProps) {
  const inputId = id ?? rest.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'w-full rounded-xl border bg-ink-800 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2',
          error
            ? 'border-red-500 focus:ring-red-500/40'
            : 'border-slate-700 focus:border-primary-500 focus:ring-primary-500/40',
          className
        )}
        {...rest}
      />
      {error ? (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}
