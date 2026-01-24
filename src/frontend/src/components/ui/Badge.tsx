import React from 'react';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple' | 'blue';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: boolean;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; icon?: React.ComponentType<any> }> = {
  default: {
    bg: 'bg-slate-100 border-slate-200',
    text: 'text-slate-700',
  },
  success: {
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700',
    icon: CheckCircle2,
  },
  warning: {
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-700',
    icon: AlertCircle,
  },
  error: {
    bg: 'bg-red-50 border-red-200',
    text: 'text-red-700',
    icon: XCircle,
  },
  info: {
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-700',
    icon: Info,
  },
  purple: {
    bg: 'bg-purple-50 border-purple-200',
    text: 'text-purple-700',
  },
  blue: {
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-700',
  },
};

const sizeStyles: Record<BadgeSize, { padding: string; text: string; iconSize: number }> = {
  sm: { padding: 'px-2 py-0.5', text: 'text-xs', iconSize: 12 },
  md: { padding: 'px-2.5 py-1', text: 'text-xs', iconSize: 14 },
  lg: { padding: 'px-3 py-1.5', text: 'text-sm', iconSize: 16 },
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  icon = false,
  children,
  className = '',
}) => {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];
  const Icon = icon && variantStyle.icon ? variantStyle.icon : null;

  return (
    <span
      className={`
        inline-flex items-center gap-1
        ${variantStyle.bg} ${variantStyle.text}
        ${sizeStyle.padding} ${sizeStyle.text}
        border rounded-full font-semibold
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {Icon && <Icon size={sizeStyle.iconSize} />}
      {children}
    </span>
  );
};
