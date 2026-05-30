import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded text-base font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-[#9b1b22] text-white hover:bg-[#780010] active:bg-[#5a0f14] shadow-sm',
        destructive:
          'bg-[#ba1a1a] text-white hover:bg-[#9b0000] active:bg-[#7a0000] shadow-sm',
        outline:
          'border border-[var(--border)] bg-white text-[#1f2937] hover:bg-[var(--secondary)] active:bg-[var(--muted)]',
        secondary:
          'bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[#e5e7eb] active:bg-[#d1d5db]',
        ghost:
          'text-[var(--foreground)] hover:bg-[var(--secondary)] active:bg-[var(--muted)]',
        link: 'text-[#9b1b22] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-12 px-5 py-2 min-w-[120px]',
        sm: 'h-9 px-4 py-1.5 text-sm',
        lg: 'h-14 px-8 py-3 text-lg',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
