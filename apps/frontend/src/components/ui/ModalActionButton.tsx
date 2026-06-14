import React from 'react';

export type ModalActionVariant = 'cancel' | 'primary' | 'success' | 'destructive';

export interface ModalActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ModalActionVariant;
  fullWidth?: boolean;
}

const variantClassMap: Record<ModalActionVariant, string> = {
  cancel:
    'bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all duration-300',
  primary:
    'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold shadow-soft hover:shadow-glow hover:from-blue-700 hover:to-blue-800 transition-all duration-300',
  success:
    'bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold shadow-soft transition-all duration-300 hover:from-green-700 hover:to-green-800',
  destructive:
    'bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold shadow-soft transition-all duration-300 hover:from-red-700 hover:to-red-800',
};

export function ModalActionButton({
  variant = 'primary',
  fullWidth = false,
  className = '',
  type = 'button',
  ...props
}: ModalActionButtonProps) {
  return (
    <button
      type={type}
      className={`px-6 py-2.5 ${fullWidth ? 'flex-1' : ''} ${variantClassMap[variant]} ${className}`
        .trim()
        .replace(/\s+/g, ' ')}
      {...props}
    />
  );
}
