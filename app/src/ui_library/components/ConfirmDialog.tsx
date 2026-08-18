import * as React from "react"
import { Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/ui_library/primitives/alert-dialog"

export interface ConfirmDialogProps {
  open: boolean
  /** Ignored while `isLoading`, so a running action cannot be dismissed. */
  onClose: () => void
  /** May be async; the dialog stays open until it resolves. */
  onConfirm: () => void | Promise<void>
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  /** `destructive` makes the confirm button red. Use it for anything you cannot undo. */
  variant?: "default" | "destructive"
  isLoading?: boolean
}

/**
 * A yes/no gate in front of a consequential action.
 *
 * Use this rather than Modal when the dialog's whole purpose is the decision:
 * it is an alert dialog, so it takes focus and cannot be dismissed by clicking
 * away mid-action.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  isLoading = false,
}: ConfirmDialogProps) {
  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault()
    await onConfirm()
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && !isLoading && onClose()}>
      <AlertDialogContent className="max-w-[400px]">
        <AlertDialogHeader className="text-center sm:text-center flex flex-col items-center">
          <AlertDialogTitle className="text-xl font-bold text-ink">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-ink-mid mt-2">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6 flex flex-row sm:flex-row justify-center sm:justify-center gap-3 sm:gap-3">
          <AlertDialogCancel
            onClick={onClose}
            disabled={isLoading}
            className="border-line text-ink-mid hover:bg-line-light transition-colors"
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={
              variant === "destructive"
                ? "bg-danger hover:bg-danger-hover text-white transition-colors"
                : "bg-brand hover:bg-brand-hover text-white transition-colors"
            }
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
