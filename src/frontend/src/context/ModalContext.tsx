import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type ModalType = 'success' | 'error' | 'info' | 'warning';

interface AlertOptions {
  title?: string;
  message: string;
  type?: ModalType;
  onClose?: () => void;
}

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ModalType;
}

interface ModalContextType {
  showAlert: (options: AlertOptions) => void;
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
  closeModal: () => void;
}

interface ModalState {
  isOpen: boolean;
  modalType: 'alert' | 'confirm' | null;
  title?: string;
  message: string;
  type: ModalType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    modalType: null,
    message: '',
    type: 'info',
  });

  const closeModal = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    // Clear after animation
    setTimeout(() => {
      setModalState({
        isOpen: false,
        modalType: null,
        message: '',
        type: 'info',
      });
    }, 300);
  }, []);

  const showAlert = useCallback((options: AlertOptions) => {
    setModalState({
      isOpen: true,
      modalType: 'alert',
      title: options.title,
      message: options.message,
      type: options.type || 'info',
      onClose: options.onClose,
    });
  }, []);

  const showConfirm = useCallback(
    (options: ConfirmOptions): Promise<boolean> => {
      return new Promise((resolve) => {
        setModalState({
          isOpen: true,
          modalType: 'confirm',
          title: options.title,
          message: options.message,
          type: options.type || 'warning',
          confirmText: options.confirmText || 'Confirm',
          cancelText: options.cancelText || 'Cancel',
          onConfirm: () => {
            closeModal();
            resolve(true);
          },
          onCancel: () => {
            closeModal();
            resolve(false);
          },
        });
      });
    },
    [closeModal]
  );

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm, closeModal }}>
      {children}
      {modalState.isOpen && (
        <ModalOverlay
          modalState={modalState}
          closeModal={closeModal}
        />
      )}
    </ModalContext.Provider>
  );
};

interface ModalOverlayProps {
  modalState: ModalState;
  closeModal: () => void;
}

const ModalOverlay: React.FC<ModalOverlayProps> = ({ modalState, closeModal }) => {
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
            <button
              onClick={() => {
                onClose?.();
                closeModal();
              }}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold shadow-soft hover:shadow-glow hover:from-blue-700 hover:to-blue-800 transition-all duration-300"
            >
              OK
            </button>
          ) : (
            <>
              <button
                onClick={onCancel}
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all duration-300"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`px-6 py-2.5 rounded-xl font-semibold shadow-soft transition-all duration-300 ${
                  type === 'error'
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800'
                    : type === 'success'
                    ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
                }`}
              >
                {confirmText}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
