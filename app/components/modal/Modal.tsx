import React, { useRef, useEffect } from "react";
import styles from "./modal.module.css";

import { GrClose } from "react-icons/gr";

interface ModalProps {
  isOpen: boolean;
  hasCloseBtn?: boolean;
  onClose?: () => void;
  children: React.ReactNode;
}

const Modal = ({
  isOpen,
  onClose,
  hasCloseBtn = true,
  children,
}: ModalProps) => {
  const modalRef = useRef<HTMLDialogElement>(null);

  const handleCloseModal = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === "Escape") {
      handleCloseModal();
    }
  };

  useEffect(() => {
    const modalElement = modalRef.current;
    if (!modalElement) return;

    // Open modal when 'isOpen' changes to true
    if (isOpen) {
      modalElement.showModal();
    } else {
      modalElement.close();
    }
  }, [isOpen]);

  return (
    <dialog ref={modalRef} className={styles.modal} onKeyDown={handleKeyDown}>
      {hasCloseBtn && (
        <button
          className={styles.modalCloseBtn}
          onClick={handleCloseModal}
          aria-label="Close modal"
        >
          <GrClose />
        </button>
      )}
      {children}
    </dialog>
  );
};

export default Modal;
