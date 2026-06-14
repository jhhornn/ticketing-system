import React from 'react';
import type { ModalState } from '../context/ModalContextDefinition';
import { ModalActionButton } from './ui';

interface ModalOverlayProps {
  modalState: ModalState;
  closeModal: () => void;
}

export const ModalOverlay: React.FC<ModalOverlayProps> = ({ modalState, closeModal }) => {
  const { modalType, title, message, type, confirmText, cancelText, onConfirm, onCancel, onClose } = modalState;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      if (modalType === 'alert') {
        onClose?.();
        closeModal();
      } else if (modalType === 'confirm') {
        onCancel?.();
      }
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 animate-slide-up">
        {getIcon()}

        {title && (
          <h2 className="text-xl font-bold text-center mb-2">{title}</h2>
        )}

        <p className="text-center text-gray-600 mb-6">{message}</p>

        <div className="flex gap-3 justify-center">
          {modalType === 'alert' ? (
            <ModalActionButton
              onClick={() => {
                onClose?.();
                closeModal();
              }}
              variant="primary"
            >
              OK
            </ModalActionButton>
          ) : (
            <>
              <ModalActionButton
                onClick={onCancel}
                variant="cancel"
              >
                {cancelText}
              </ModalActionButton>
              <ModalActionButton
                onClick={onConfirm}
                variant={type === 'error' ? 'destructive' : type === 'success' ? 'success' : 'primary'}
              >
                {confirmText}
              </ModalActionButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
};