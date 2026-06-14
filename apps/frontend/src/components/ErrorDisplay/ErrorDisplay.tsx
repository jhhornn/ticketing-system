/**
 * ErrorDisplay Component
 * 
 * Displays user-friendly error messages with action buttons
 */

import React from 'react';
import { AlertTriangle, AlertCircle, Info, XCircle } from 'lucide-react';
import type { TranslatedError } from '../../types/errors';

interface ErrorDisplayProps {
  error: TranslatedError;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onPrimaryAction,
  onSecondaryAction,
  onDismiss,
  className = '',
}) => {
  // Icon based on severity
  const getIcon = () => {
    switch (error.severity) {
      case 'critical':
      case 'error':
        return <XCircle className="w-6 h-6 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-amber-500" />;
      case 'info':
        return <Info className="w-6 h-6 text-blue-500" />;
      default:
        return <AlertCircle className="w-6 h-6 text-gray-500" />;
    }
  };

  // Color scheme based on severity
  const getColorClasses = () => {
    switch (error.severity) {
      case 'critical':
      case 'error':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-900';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const getButtonClasses = (isPrimary: boolean) => {
    const base = 'px-4 py-2 rounded-lg font-medium transition-colors';
    
    if (isPrimary) {
      switch (error.severity) {
        case 'critical':
        case 'error':
          return `${base} bg-red-600 hover:bg-red-700 text-white`;
        case 'warning':
          return `${base} bg-amber-600 hover:bg-amber-700 text-white`;
        case 'info':
          return `${base} bg-blue-600 hover:bg-blue-700 text-white`;
        default:
          return `${base} bg-gray-600 hover:bg-gray-700 text-white`;
      }
    }
    
    return `${base} bg-white border-2 border-current hover:bg-gray-50`;
  };

  return (
    <div className={`rounded-lg border-2 p-6 ${getColorClasses()} ${className}`}>
      <div className="flex gap-4">
        <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold mb-2">{error.title}</h3>
          <p className="text-sm leading-relaxed mb-4">{error.message}</p>
          
          {error.context?.affectedResource && (
            <p className="text-xs opacity-75 mb-4">
              Affected: {error.context.affectedResource}
            </p>
          )}
          
          {error.technicalDetails && (
            <details className="text-xs opacity-75 mb-4">
              <summary className="cursor-pointer font-medium mb-1">
                Technical Details
              </summary>
              <p className="pl-4">{error.technicalDetails}</p>
            </details>
          )}
          
          <div className="flex flex-wrap gap-3">
            {onPrimaryAction && (
              <button
                onClick={onPrimaryAction}
                className={getButtonClasses(true)}
              >
                {error.primaryAction.label}
              </button>
            )}
            
            {error.secondaryAction && onSecondaryAction && (
              <button
                onClick={onSecondaryAction}
                className={getButtonClasses(false)}
              >
                {error.secondaryAction.label}
              </button>
            )}
            
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="px-4 py-2 text-sm hover:underline"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Inline Error (for smaller contexts)
 */
interface InlineErrorProps {
  error: TranslatedError;
  className?: string;
}

export const InlineError: React.FC<InlineErrorProps> = ({
  error,
  className = '',
}) => {
  return (
    <div className={`flex items-start gap-2 text-sm ${className}`}>
      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
      <div>
        <span className="font-medium">{error.title}:</span> {error.message}
      </div>
    </div>
  );
};
