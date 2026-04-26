import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-slate-900 text-white',
        secondary: 'border-transparent bg-slate-100 text-slate-700',
        outline: 'border-slate-200 text-slate-700',
        success: 'border-transparent bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
        warning: 'border-transparent bg-amber-50 text-amber-700 ring-1 ring-amber-200',
        danger: 'border-transparent bg-rose-50 text-rose-700 ring-1 ring-rose-200',
        info: 'border-transparent bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200',
        muted: 'border-transparent bg-slate-50 text-slate-600 ring-1 ring-slate-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
