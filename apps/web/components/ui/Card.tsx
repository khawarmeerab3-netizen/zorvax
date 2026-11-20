import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-800 bg-ink-800/60 p-6 shadow-xl shadow-black/20 backdrop-blur',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className, children }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-lg font-semibold text-white', className)}>{children}</h3>
  );
}
