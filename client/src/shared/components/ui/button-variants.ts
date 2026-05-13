import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl text-sm font-medium whitespace-nowrap transition-[color,box-shadow,transform,filter] duration-200 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          'bg-brand text-white shadow-glow hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:brightness-95',
        destructive:
          'bg-error text-white shadow-soft hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:brightness-95',
        outline:
          'border border-default bg-surface [color:var(--text-primary)] shadow-soft hover:-translate-y-0.5 hover:bg-subtle active:translate-y-0',
        secondary:
          'border border-default bg-elevated [color:var(--text-primary)] shadow-soft hover:-translate-y-0.5 hover:bg-subtle active:translate-y-0',
        ghost:
          '[color:var(--text-primary)] hover:bg-subtle hover:[color:var(--text-primary)]',
        link: 'text-brand underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-xl px-3',
        lg: 'h-11 rounded-2xl px-6',
        icon: 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)
