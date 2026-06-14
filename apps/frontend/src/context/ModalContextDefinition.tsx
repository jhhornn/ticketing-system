import { createContext } from 'react';

export type ModalType = 'success' | 'error' | 'info' | 'warning';

export interface AlertOptions {
  title?: string;
  message: string;
  type?: ModalType;
  onClose?: () => void;
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ModalType;
}

export interface ModalContextType {
  showAlert: (options: AlertOptions) => void;
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
  closeModal: () => void;
}

export interface ModalState {
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

export const INITIAL_MODAL_STATE: ModalState = {
  isOpen: false,
  modalType: null,
  message: '',
  type: 'info',
};

export const ModalContext = createContext<ModalContextType | undefined>(undefined);
