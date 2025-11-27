import * as React from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    'text-xs font-bold tracking-wider uppercase whitespace-nowrap',
    'inline-flex items-center justify-center gap-2 shrink-0 rounded-xl cursor-pointer outline-none transition-all duration-200',
    'focus-visible:ring-[#F15A24]/50 focus-visible:ring-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'aria-invalid:ring-destructive/20 aria-invalid:border-destructive dark:aria-invalid:ring-destructive/40',
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        default: 'bg-white/10 text-white hover:bg-white/20',
        destructive: [
          'bg-gradient-to-r from-red-600/90 to-red-500/90 text-white',
          'hover:from-red-500 hover:to-red-400',
          'shadow-lg shadow-red-500/20 hover:shadow-red-500/30',
        ],
        outline: [
          'border border-white/10 bg-transparent text-white',
          'hover:bg-white/10',
        ],
        primary: 'bg-gradient-to-r from-[#F15A24] to-[#FF7043] text-white hover:opacity-90 shadow-lg shadow-[#F15A24]/20',
        secondary: 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white',
        ghost: 'hover:bg-white/10 hover:text-white text-zinc-400',
        link: 'text-[#F15A24] underline-offset-4 hover:underline',
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

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
