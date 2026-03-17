import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
};

/**
 * Reusable modal component with consistent styling
 * Handles escape key, backdrop click, and body scroll lock
 */
export default function Modal({
  isOpen,
  onClose,
  children,
  maxWidth = '2xl',
}: ModalProps) {
  // Handle escape key and body scroll lock
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-void-black/90 backdrop-blur-sm" />

      {/* Modal Content */}
      <div
        className={`relative bg-deep-space border border-art-deco-brass w-full ${maxWidthClasses[maxWidth]} max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

interface ModalHeaderProps {
  children: ReactNode;
  onClose: () => void;
}

/**
 * Modal header with sticky positioning and close button
 */
export function ModalHeader({ children, onClose }: ModalHeaderProps) {
  return (
    <div className="sticky top-0 bg-deep-space border-b border-art-deco-brass/25 p-6 flex justify-between items-start z-10">
      <div className="flex-1">{children}</div>
      <button
        onClick={onClose}
        className="font-mono text-stardust/50 hover:text-art-deco-brass transition-colors p-2 -mr-2 -mt-2"
      >
        ✕
      </button>
    </div>
  );
}

interface ModalBodyProps {
  children: ReactNode;
}

/**
 * Modal body with consistent padding and spacing
 */
export function ModalBody({ children }: ModalBodyProps) {
  return <div className="p-6 space-y-6">{children}</div>;
}
