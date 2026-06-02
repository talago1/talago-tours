'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-[#FF5B00] to-[#E65200] text-white shadow-lg shadow-[#FF5B00]/25 hover:shadow-[#FF5B00]/40 border-transparent hover:from-[#FF5B00] hover:to-[#FF5B00]',
  secondary:
    'bg-[#00473F] text-white shadow-lg shadow-[#00473F]/25 hover:shadow-[#00473F]/40 border-transparent hover:bg-[#005A50]',
  outline:
    'border-white/10 bg-white/5 text-slate-200 hover:border-[#06B6D4]/40 hover:bg-[#06B6D4]/10 hover:text-[#06B6D4]',
  ghost:
    'border-transparent bg-transparent text-slate-300 hover:bg-white/5 hover:text-white',
  danger:
    'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/40',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      fullWidth = false,
      className = '',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center gap-2.5 rounded-full font-black
          uppercase tracking-[0.18em] border
          transition-all duration-300 ease-in-out
          active:scale-[0.98]
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#070F1E]
          focus:ring-[#FF5B00]/50
          disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>{children}</span>
          </span>
        ) : (
          <>
            {icon && <span className="h-4 w-4">{icon}</span>}
            {children}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
