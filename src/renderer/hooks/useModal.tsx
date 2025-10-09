import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Modal, { ModalSize } from '../components/common/Modal';

interface ModalOptions {
  title?: string;
  icon?: ReactNode;
  content: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  closeOnEscape?: boolean;
  closeOnOverlay?: boolean;
}

interface ModalContextValue {
  openModal: (options: ModalOptions) => void;
  closeModal: () => void;
  isOpen: boolean;
}

const ModalContext = createContext<ModalContextValue | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [modalOptions, setModalOptions] = useState<ModalOptions | null>(null);

  const openModal = useCallback((options: ModalOptions) => {
    setModalOptions(options);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    // Delay clearing options to allow exit animation
    setTimeout(() => setModalOptions(null), 300);
  }, []);

  return (
    <ModalContext.Provider value={{ openModal, closeModal, isOpen }}>
      {children}
      {modalOptions && (
        <Modal
          isOpen={isOpen}
          onClose={closeModal}
          title={modalOptions.title}
          icon={modalOptions.icon}
          footer={modalOptions.footer}
          size={modalOptions.size}
          closeOnEscape={modalOptions.closeOnEscape}
          closeOnOverlay={modalOptions.closeOnOverlay}
        >
          {modalOptions.content}
        </Modal>
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    console.warn('useModal must be used within ModalProvider. Falling back to no-op.');
    return {
      openModal: () => {
        console.warn('useModal called outside ModalProvider');
      },
      closeModal: () => {
        console.warn('useModal called outside ModalProvider');
      },
      isOpen: false,
    };
  }
  return context;
}
