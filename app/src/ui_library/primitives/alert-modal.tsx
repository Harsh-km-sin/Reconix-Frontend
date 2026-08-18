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

export interface AlertModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
  isLoading?: boolean
}

export function AlertModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  isLoading = false,
}: AlertModalProps) {
  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault()
    await onConfirm()
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <AlertDialogContent className="max-w-[400px]">
        <AlertDialogHeader className="text-center sm:text-center flex flex-col items-center">
          <AlertDialogTitle className="text-xl font-bold text-[#1A1A1A]">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-[#555555] mt-2">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6 flex flex-row sm:flex-row justify-center sm:justify-center gap-3 sm:gap-3">
          <AlertDialogCancel
            onClick={onClose}
            disabled={isLoading}
            className="border-[#E0E0E0] text-[#555555] hover:bg-[#F5F5F5] transition-colors"
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={
              variant === "destructive"
                ? "bg-[#E53935] hover:bg-[#D32F2F] text-white transition-colors"
                : "bg-[#13B5EA] hover:bg-[#0E92BC] text-white transition-colors"
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
