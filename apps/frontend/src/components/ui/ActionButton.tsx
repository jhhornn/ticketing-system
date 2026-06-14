import React from 'react';
import { Edit, Settings, PercentCircle, Trash2 } from 'lucide-react';

export interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: 'edit' | 'sections' | 'discounts' | 'delete';
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

const variantConfig = {
  edit: {
    icon: Edit,
    label: 'Edit',
    colors: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
  },
  sections: {
    icon: Settings,
    label: 'Sections',
    colors: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
  },
  discounts: {
    icon: PercentCircle,
    label: 'Discounts',
    colors: 'from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700',
  },
  delete: {
    icon: Trash2,
    label: 'Delete',
    colors: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
  },
};

export const ActionButton: React.FC<ActionButtonProps> = ({
  variant,
  size = 'md',
  showLabel = true,
  disabled,
  className = '',
  ...props
}) => {
  const config = variantConfig[variant];
  const Icon = config.icon;

  const sizeClasses = size === 'sm' ? 'px-2.5 py-2 text-xs' : 'px-3 py-2.5 text-xs';
  const iconSize = size === 'sm' ? 14 : 16;

  return (
    <button
      disabled={disabled}
      className={`
        group inline-flex items-center justify-center gap-1.5 
        ${sizeClasses}
        rounded-xl font-medium
        transition-all duration-200 ease-out
        ${disabled
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : `bg-gradient-to-br ${config.colors} text-white shadow-md hover:shadow-lg hover:shadow-${variant === 'edit' ? 'blue' : variant === 'sections' ? 'purple' : variant === 'discounts' ? 'emerald' : 'red'}-500/30 active:scale-95`
        }
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      {...props}
    >
      <Icon size={iconSize} className="flex-shrink-0" />
      {showLabel && (
        <span className={size === 'sm' ? 'hidden sm:inline' : 'hidden sm:inline'}>
          {config.label}
        </span>
      )}
    </button>
  );
};
