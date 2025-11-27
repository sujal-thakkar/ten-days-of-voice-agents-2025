'use client';

import * as React from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import * as TogglePrimitive from '@radix-ui/react-toggle';
import { cn } from '@/lib/utils';

const toggleVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 rounded-xl',
    'text-sm font-medium whitespace-nowrap',
    'cursor-pointer outline-none transition-all duration-200',
    'hover:bg-white/10 text-zinc-400 hover:text-white',
    'disabled:pointer-events-none disabled:opacity-50',
    'data-[state=on]:text-white',
    'focus-visible:ring-[#F15A24]/50 focus-visible:ring-2',
    'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        primary:
          'bg-white/5 data-[state=on]:bg-[#F15A24]/20 data-[state=on]:text-[#F15A24] hover:bg-white/10',
        secondary:
          'bg-transparent data-[state=on]:bg-[#F15A24]/20 data-[state=on]:text-[#F15A24] hover:bg-white/10 data-[state=on]:shadow-[0_0_12px_rgba(241,90,36,0.3)]',
        outline:
          'border border-white/10 bg-transparent shadow-xs hover:bg-white/10 hover:text-white',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 px-6 has-[>svg]:px-4',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Toggle, toggleVariants };
