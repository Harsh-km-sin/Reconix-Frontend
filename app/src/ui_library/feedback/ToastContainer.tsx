import type { Toast } from '@/types';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const toastStyles = {
  success: 'border-l-[#3BB54A]',
  error: 'border-l-[#E53935]',
  warning: 'border-l-[#FFA726]',
  info: 'border-l-[#13B5EA]',
};

const iconStyles = {
  success: 'text-[#3BB54A]',
  error: 'text-[#E53935]',
  warning: 'text-[#FFA726]',
  info: 'text-[#13B5EA]',
};

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-6 z-[2000] flex flex-col gap-3">
      {toasts.map((toast) => {
        const Icon = toastIcons[toast.type];
        return (
          <div
            key={toast.id}
            className={`w-[360px] bg-white rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.15)] border-l-4 ${toastStyles[toast.type]} p-4 toast-enter`}
          >
            <div className="flex items-start gap-3">
              <Icon className={`w-5 h-5 mt-0.5 ${iconStyles[toast.type]}`} />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-[#1A1A1A]">{toast.title}</h4>
                {toast.message && (
                  <p className="text-sm text-[#555555] mt-1">{toast.message}</p>
                )}
              </div>
              <button
                onClick={() => onRemove(toast.id)}
                className="text-[#8A8A8A] hover:text-[#555555] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
