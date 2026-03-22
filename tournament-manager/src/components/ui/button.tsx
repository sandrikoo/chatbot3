'use client';
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-90 active:scale-95 shadow-lg shadow-[rgba(22,192,93,0.25)]',
        secondary:
          'bg-[var(--surface-2)] text-[var(--foreground)] border border-[var(--border-color)] hover:border-[var(--accent)] hover:bg-[var(--surface-2)]',
        outline:
          'border border-[var(--border-color)] bg-transparent text-[var(--foreground)] hover:bg-[var(--surface-2)] hover:border-[var(--accent)]',
        ghost:
          'bg-transparent text-[var(--foreground)] hover:bg-[var(--surface-2)]',
        destructive:
          'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-900/20',
        gold:
          'bg-[var(--gold)] text-black hover:opacity-90 active:scale-95 shadow-lg shadow-[rgba(240,180,41,0.3)]',
        premium:
          'bg-gradient-to-r from-[var(--accent)] to-emerald-400 text-black font-bold hover:opacity-95 active:scale-95 shadow-xl shadow-[rgba(22,192,93,0.3)]',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        default: 'h-10 px-5',
        lg: 'h-12 px-7 text-base',
        xl: 'h-14 px-9 text-lg',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
