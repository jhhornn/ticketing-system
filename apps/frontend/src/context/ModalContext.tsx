import React, { useState, useCallback, type ReactNode } from 'react';
import { ModalOverlay } from '../components/ModalOverlay';
import { 
  ModalContext, 
  type AlertOptions, 
  type ConfirmOptions, 
  type ModalState,
  INITIAL_MODAL_STATE,
} from './ModalContextDefinition';

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modalState, setModalState] = useState<ModalState>(INITIAL_MODAL_STATE);

  const closeModal = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    // Clear after animation
    setTimeout(() => {
      setModalState(INITIAL_MODAL_STATE);
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
