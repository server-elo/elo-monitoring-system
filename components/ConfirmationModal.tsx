import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-labelledby="confirmation-modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={onClose}></div>

      {/* Modal Content */}
      <div className="relative bg-brand-surface-1 rounded-lg shadow-xl p-6 md:p-8 w-full max-w-md transform transition-all">
        <h3 id="confirmation-modal-title" className="text-xl font-semibold text-brand-accent mb-4">
          {title}
        </h3>
        <p className="text-brand-text-secondary mb-6">
          {message}
        </p>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-brand-text-primary bg-brand-bg-light hover:bg-brand-secondary/40 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 focus:ring-offset-brand-surface-1 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-brand-surface-1 transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;