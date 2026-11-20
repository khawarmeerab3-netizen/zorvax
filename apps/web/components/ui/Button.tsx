import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-primary-600 to-secondary-500 text-white hover:opacity-90 disabled:opacity-50',
  secondary: 'bg-ink-700 text-slate-100 hover:bg-ink-800 border border-slate-700',
  ghost: 'text-slate-300 hover:text-white hover:bg-white/5',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-8 py-3.5 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-ink-900',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      )}
      {children}
    </button>
  );
}
