import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui_library/primitives/dialog';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps {
  open: boolean;
  /** Called on close by any route: the × button, Escape, or the overlay. */
  onClose: () => void;
  title: string;
  /** Sub-heading under the title. Also read out as the dialog's description. */
  description?: string;
  children: React.ReactNode;
  /** Footer content, typically the action buttons. */
  footer?: React.ReactNode;
  size?: ModalSize;
  /** Hide the × button when the user must resolve the dialog to leave it. */
  showCloseButton?: boolean;
  className?: string;
}

const SIZE_CLASS: Record<ModalSize, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
  full: 'sm:max-w-[95vw] sm:h-[90vh]',
};

/**
 * The one modal. Wraps the Radix dialog primitive so callers do not hand-roll
 * an overlay + fixed panel + Escape handling again — there were three such
 * copies before this existed, none of which trapped focus.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
  className = '',
}: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent
        showCloseButton={showCloseButton}
        className={`${SIZE_CLASS[size]} bg-surface p-0 gap-0 overflow-hidden ${className}`}
      >
        <DialogHeader className="px-6 py-4 border-b border-line bg-page text-left">
          <DialogTitle className="text-lg font-bold text-ink">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-sm text-ink-mid">{description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="px-6 py-5 overflow-y-auto max-h-[70vh]">{children}</div>

        {footer && (
          <DialogFooter className="px-6 py-4 border-t border-line bg-page">{footer}</DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
