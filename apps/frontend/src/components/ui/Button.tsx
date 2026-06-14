import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 
    text-white font-semibold
    shadow-md hover:shadow-xl hover:shadow-blue-500/30
    hover:from-blue-700 hover:via-blue-800 hover:to-blue-900
    active:shadow-sm active:scale-[0.98]
    disabled:from-gray-300 disabled:via-gray-300 disabled:to-gray-400
    disabled:shadow-none disabled:cursor-not-allowed disabled:hover:scale-100
    border border-blue-800/20
    transform transition-all duration-200 ease-out
  `,
  secondary: `
    bg-gradient-to-br from-slate-100 to-slate-200
    text-slate-800 font-semibold
    border border-slate-300/80
    shadow-sm hover:shadow-md hover:shadow-slate-300/50
    hover:from-slate-200 hover:to-slate-300 hover:border-slate-400
    active:shadow-sm active:scale-[0.98]
    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
    transform transition-all duration-200 ease-out
  `,
  outline: `
    bg-transparent border-2 border-slate-300
    text-slate-700 font-semibold
    hover:bg-slate-50 hover:border-slate-400
    active:bg-slate-100 active:scale-[0.98]
    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
    transition-all duration-200 ease-out
  `,
  ghost: `
    bg-transparent text-slate-700 font-medium
    hover:bg-slate-100 hover:text-slate-900
    active:bg-slate-200 active:scale-[0.98]
    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
    transition-all duration-200 ease-out
  `,
  destructive: `
    bg-gradient-to-br from-red-600 via-red-700 to-red-800
    text-white font-semibold
    shadow-md hover:shadow-xl hover:shadow-red-500/30
    hover:from-red-700 hover:via-red-800 hover:to-red-900
    active:shadow-sm active:scale-[0.98]
    disabled:from-gray-300 disabled:via-gray-300 disabled:to-gray-400
    disabled:shadow-none disabled:cursor-not-allowed disabled:hover:scale-100
    border border-red-800/20
    transform transition-all duration-200 ease-out
  `,
  success: `
    bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800
    text-white font-semibold
    shadow-md hover:shadow-xl hover:shadow-emerald-500/30
    hover:from-emerald-700 hover:via-emerald-800 hover:to-emerald-900
    active:shadow-sm active:scale-[0.98]
    disabled:from-gray-300 disabled:via-gray-300 disabled:to-gray-400
    disabled:shadow-none disabled:cursor-not-allowed disabled:hover:scale-100
    border border-emerald-800/20
    transform transition-all duration-200 ease-out
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3 text-base rounded-xl gap-2.5',
  xl: 'px-8 py-4 text-lg rounded-2xl gap-3',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          inline-flex items-center justify-center
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `.trim().replace(/\s+/g, ' ')}
        {...props}
      >
        {loading && (
          <Loader2 className="animate-spin" size={size === 'sm' ? 14 : size === 'md' ? 16 : size === 'lg' ? 18 : 20} />
        )}
        {!loading && icon && iconPosition === 'left' && icon}
        {children}
        {!loading && icon && iconPosition === 'right' && icon}
      </button>
    );
  }
);

Button.displayName = 'Button';
