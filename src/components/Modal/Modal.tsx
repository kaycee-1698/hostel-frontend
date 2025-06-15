'use client';

import { ReactNode, useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>    
      {/* Backdrop */}
      <div 
      className="fixed inset-0 flex items-center justify-center bg-black/60 z-50"
      onClick={onClose}
      aria-hidden="true" >

        {/* Modal container */}
        <div 
        className="bg-white rounded-lg p-4 w-full max-w-2xl shadow-xl relative max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside modal
        >
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-4 text-gray-400 hover:text-red-500 text-xl"
            aria-label="Close modal"
          >
            ×
          </button>

          {/* Header */}
          {title && (
            <div className="flex justify-between items-center border-b border-gray-200 px-2 py-3">
              <h2 id="modal-title" className="text-lg font-semibold">
                {title}
              </h2>
            </div>
          )}

          {/* Content */}
          <div className="p-2">{children}</div>
          
        </div>
      </div>
    </>
  );
}
