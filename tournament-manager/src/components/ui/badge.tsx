import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[var(--accent)] text-[var(--accent-foreground)]',
        secondary: 'bg-[var(--surface-2)] text-[var(--foreground)] border border-[var(--border-color)]',
        outline: 'border border-[var(--border-color)] text-[var(--foreground)]',
        gold: 'bg-[var(--gold)] text-black',
        emerald: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
        amber: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
        red: 'bg-red-500/20 text-red-400 border border-red-500/30',
        blue: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
        purple: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
        live: 'bg-red-600 text-white',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
